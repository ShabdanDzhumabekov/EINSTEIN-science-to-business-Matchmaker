import type { RoleInference, RoleInferenceRequest } from '../contracts/role-inference'
import type { Decision } from '../contracts/decision'
import type { ScholarCard } from '../contracts/scholar-card'
import type { Dataset } from '../data/dataset'
import { researcherQualityFlags } from '../data/researcher-quality-flags'
import { businessCard } from '../cards/business-card'
import { scholarCard } from '../cards/scholar-card'
import { critiqueProposal } from '../agents/critic/critique-proposal'
import { screenTask } from '../screening/screen-task'
import { screenCompany } from '../screening/screen-company'
import type { CompanyScreening } from '../contracts/company-screening'
import { checkPair } from '../screening/check-pair'
import type { ScreeningStore } from '../screening/screening-store'
import { assessPair } from '../features/matching/adapters/outbound/assess-pair'
import { writeProposal } from '../features/proposals/adapters/outbound/write-proposal'
import { InvalidAssessmentError } from '../features/matching/domain/invalid-assessment-error'
import { InvalidProposalError } from '../features/proposals/domain/invalid-proposal-error'
import { StageValidationError } from '../features/workflow/domain/stage-validation-error'
import { RoleInferenceError } from '../features/inference/domain/role-inference-error'
import type { CriticIssue } from '../contracts/critic-issue'
import type { CollaborationStages } from '../features/workflow/ports/outbound/collaboration-stages'

const SCREENING_THRESHOLD = 0.5
const CHECK_THRESHOLD = 0.9
const SCREENING_BATCH_SIZE = 150

/* A cut-off or malformed answer is one failed attempt of that role, corrected like a validation error, not a failed task. */
function malformedOutput(error: unknown, owner: 'matchmaker' | 'proposal_writer'): StageValidationError | undefined {
  if (!(error instanceof RoleInferenceError) || error.code !== 'invalid_output') return undefined
  const explanation = `Your previous answer was cut off or did not match the schema (${error.message}). Answer again, more concisely.`
  const issue: CriticIssue = { category: 'unsupported_claim', severity: 'blocking', owner, claim: explanation, explanation, sources: [] }
  return new StageValidationError([issue])
}

function carefulCritic(inference: RoleInference): RoleInference {
  return {
    infer<Output>(request: RoleInferenceRequest<Output>) {
      return inference.infer({ ...request, instruction: `${request.instruction}\nAudit each verified fact for hidden inferences. A paper on Modbus does not establish BACnet transfer. A percentage reduction in model size does not establish RAM/CPU fit on the company's hardware. Statements of relevance or meeting requirements are inferences, not measured facts. Flag unsupported factual implications as unsupported_claim. Proposed experiments and numerical targets are allowed when clearly hypothetical.` })
    },
  }
}

export type StageOptions = { prefilterThreshold?: number }

/* Absent means off; any value must be a probability. An empty or malformed value is a configuration error, not "off". */
export function prefilterThresholdOf(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined
  const threshold = raw.trim() === '' ? Number.NaN : Number(raw)
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new RangeError(`PREFILTER_THRESHOLD must be a probability between 0 and 1, got "${raw}"`)
  return threshold
}

export function createStages(inference: RoleInference, decision: Decision, dataset: Dataset, screenings: ScreeningStore, options: StageOptions = {}): CollaborationStages {
  const flags = researcherQualityFlags(dataset)
  const companyScreenings = new Map<string, Promise<CompanyScreening>>()
  const scholars = new Map<string, ScholarCard>()
  const scholarCardOf = (researcherId: string) => {
    const cached = scholars.get(researcherId)
    if (cached) return cached
    const card = scholarCard(dataset, researcherId, flags.get(researcherId) ?? [])
    scholars.set(researcherId, card)
    return card
  }
  return {
    businessCard: taskId => businessCard(dataset, taskId),
    scholarCard: scholarCardOf,
    async screen(business) {
      const cached = screenings.find(business.taskId, options.prefilterThreshold)
      if (cached) return cached
      const everyone = [...dataset.researchers.keys()].map(scholarCardOf)
      if (options.prefilterThreshold === undefined) {
        return screenings.save(await screenTask(decision, business, everyone, { threshold: SCREENING_THRESHOLD, batchSize: SCREENING_BATCH_SIZE }))
      }
      const threshold = options.prefilterThreshold
      const inFlight = companyScreenings.get(business.companyId) ?? (async () => screenings.findCompany(business.companyId)
        ?? screenings.saveCompany(await screenCompany(decision, business, everyone, { threshold, batchSize: SCREENING_BATCH_SIZE })))()
      companyScreenings.set(business.companyId, inFlight)
      const company = await inFlight
      const kept = new Set(company.pairs.filter(pair => pair.jev >= threshold).map(pair => pair.researcherId))
      const screened = everyone.filter(scholar => kept.has(scholar.researcherId))
      const screening = await screenTask(decision, business, screened, { threshold: SCREENING_THRESHOLD, batchSize: SCREENING_BATCH_SIZE })
      return screenings.save({ ...screening, prefilter: { threshold, company, researchersScreened: screened.length, researchersRemoved: everyone.length - screened.length } })
    },
    async assess(request) {
      try { return await assessPair(inference, dataset, request) }
      catch (error) {
        const malformed = malformedOutput(error, 'matchmaker')
        if (malformed) throw malformed
        if (!(error instanceof InvalidAssessmentError)) throw error
        throw new StageValidationError(error.violations.map((explanation, index) => ({ category: 'unsupported_claim', severity: 'blocking',
          owner: 'matchmaker', claim: index === 0 ? JSON.stringify(error.assessment) : explanation, explanation, sources: [] })))
      }
    },
    check: ({ business, scholar, assessment, subject }) => checkPair(decision, business, scholar, assessment, subject, CHECK_THRESHOLD),
    async write(request) {
      try { return await writeProposal(inference, dataset, request) }
      catch (error) {
        const malformed = malformedOutput(error, 'proposal_writer')
        if (malformed) throw malformed
        if (!(error instanceof InvalidProposalError)) throw error
        throw new StageValidationError(error.violations.map((explanation, index) => ({ category: 'unsupported_claim', severity: 'blocking',
          owner: 'proposal_writer', claim: index === 0 ? JSON.stringify(error.draft) : explanation, explanation, sources: [] })))
      }
    },
    async reviewProposal(request) {
      try { return await critiqueProposal(carefulCritic(inference), decision, dataset, request) }
      catch (error) {
        if (!(error instanceof RoleInferenceError) || error.code !== 'invalid_output') throw error
        return critiqueProposal(carefulCritic(inference), decision, dataset, request)
      }
    },
  }
}
