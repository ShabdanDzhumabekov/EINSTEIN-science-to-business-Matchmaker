import type { ArtifactRef } from '../../../contracts/artifact-ref'
import type { BusinessCard } from '../../../contracts/business-card'
import type { CriticIssue } from '../../../contracts/critic-issue'
import type { PairAssessment } from '../../../contracts/pair-assessment'
import type { Proposal } from '../../../contracts/proposal'
import type { ScholarCard } from '../../../contracts/scholar-card'
import type { SavedArtifact } from '../domain/saved-artifact'
import type { WorkflowResult } from '../domain/workflow-result'
import type { CollaborationStages } from '../ports/outbound/collaboration-stages'
import type { ArtifactOutput } from '../ports/outbound/artifact-output'
import { ArtifactLedger } from '../domain/artifact-ledger'
import { StageValidationError } from '../domain/stage-validation-error'

const MAX_CANDIDATES = 8
const MAX_ASSESSMENT_ATTEMPTS = 3
const MAX_PROPOSAL_ATTEMPTS = 3

type PairOutcome = 'no_fit' | 'check_failed' | 'proposal_needs_revision'
type Pair = { business: SavedArtifact<BusinessCard>; scholar: SavedArtifact<ScholarCard> }

/* Ordered by how far a dropped pair got; the task status reports the furthest stage any of its pairs reached. */
const OUTCOME_DEPTH: ReadonlyArray<PairOutcome> = ['no_fit', 'check_failed', 'proposal_needs_revision']

export class CollaborationWorkflow {
  private readonly ledger: ArtifactLedger
  constructor(runId: string, datasetVersion: string, private readonly stages: CollaborationStages, private readonly output: ArtifactOutput) {
    this.ledger = new ArtifactLedger(runId, datasetVersion)
  }
  async run(taskId: string): Promise<WorkflowResult> {
    const business = this.save(`business-${taskId}`, 'business', this.stages.businessCard(taskId), [])
    const screening = this.save(`screening-${taskId}`, 'screening', await this.stages.screen(business.content), [business.ref])
    if (!screening.content.isResearchProblem) {
      this.output.event('task.screened_out', { taskId, researchFit: screening.content.researchFit })
      return { status: 'screened_out', taskId, reason: `Jev rates the task as a research problem at ${screening.content.researchFit}` }
    }
    const candidateIds = screening.content.pairs.filter(pair => pair.isKept).slice(0, MAX_CANDIDATES).map(pair => pair.researcherId)
    if (!candidateIds.length) return { status: 'screened_out', taskId, reason: 'No researcher passed Jev screening' }
    let furthest: PairOutcome = 'no_fit'
    for (const researcherId of candidateIds) {
      const scholar = this.save(`scholar-${taskId}-${researcherId}`, 'scholar', this.stages.scholarCard(researcherId), [])
      const outcome = await this.pairOutcome({ business, scholar })
      if (typeof outcome !== 'string') return { status: 'ready', taskId, proposal: outcome }
      this.output.event('pair.dropped', { taskId, researcherId, stage: outcome })
      if (OUTCOME_DEPTH.indexOf(outcome) > OUTCOME_DEPTH.indexOf(furthest)) furthest = outcome
    }
    return { status: furthest, taskId, reason: `None of ${candidateIds.length} screened pairs produced a Critic-approved proposal` }
  }
  /* One given pair through Matchmaker, the Jev check and Writer ⇄ Critic, for the reverse (Stars) direction where the researcher is fixed. */
  async runPair(taskId: string, researcherId: string): Promise<WorkflowResult> {
    const business = this.save(`business-${taskId}`, 'business', this.stages.businessCard(taskId), [])
    const scholar = this.save(`scholar-${taskId}-${researcherId}`, 'scholar', this.stages.scholarCard(researcherId), [])
    const outcome = await this.pairOutcome({ business, scholar })
    if (typeof outcome !== 'string') return { status: 'ready', taskId, proposal: outcome }
    this.output.event('pair.dropped', { taskId, researcherId, stage: outcome })
    return { status: outcome, taskId, reason: `The pair with ${researcherId} ended at ${outcome}` }
  }
  private async pairOutcome(pair: Pair): Promise<SavedArtifact<Proposal> | PairOutcome> {
    const assessment = await this.assessment(pair)
    if (assessment?.content.outcome !== 'pair') return 'no_fit'
    const check = await this.stages.check({ business: pair.business.content, scholar: pair.scholar.content, assessment: assessment.content, subject: assessment.ref })
    const savedCheck = this.save(`check-${assessment.ref.artifactId}`, 'check', check, [assessment.ref])
    if (!check.isKept) {
      this.output.event('check.failed', { subject: savedCheck.ref, jev: check.jev, threshold: check.threshold })
      return 'check_failed'
    }
    return await this.approvedProposal(pair, assessment) ?? 'proposal_needs_revision'
  }
  private async assessment({ business, scholar }: Pair): Promise<SavedArtifact<PairAssessment> | undefined> {
    const inputs = [business.ref, scholar.ref]
    let feedback: ReadonlyArray<CriticIssue> = []
    for (let attempt = 1; attempt <= MAX_ASSESSMENT_ATTEMPTS; attempt++) {
      try {
        const content = await this.stages.assess({ business: business.content, scholar: scholar.content, inputs, feedback })
        return this.save(`pair-${business.content.taskId}-${scholar.content.researcherId}`, 'pair', content, inputs)
      } catch (error) {
        if (!(error instanceof StageValidationError)) throw error
        feedback = error.issues; this.output.event('validation.revise', { owner: 'matchmaker', issues: feedback })
      }
    }
    return undefined
  }
  private async approvedProposal({ business, scholar }: Pair, assessment: SavedArtifact<PairAssessment>): Promise<SavedArtifact<Proposal> | undefined> {
    const inputs: ReadonlyArray<ArtifactRef> = [business.ref, scholar.ref, assessment.ref]
    const id = `${business.content.taskId}-${scholar.content.researcherId}`
    let feedback: ReadonlyArray<CriticIssue> = []
    let previousDraft: string | undefined
    for (let attempt = 1; attempt <= MAX_PROPOSAL_ATTEMPTS; attempt++) {
      let content: Proposal
      try { content = await this.stages.write({ business: business.content, scholar: scholar.content, assessment: assessment.content, inputs, feedback, previousDraft }) }
      catch (error) {
        if (!(error instanceof StageValidationError)) throw error
        feedback = error.issues; this.output.event('validation.revise', { owner: 'proposal_writer', issues: feedback }); continue
      }
      const proposal = this.save(`proposal-${id}`, 'proposal', content, inputs)
      const verdict = await this.stages.reviewProposal({ subject: proposal.ref, business: business.content, scholar: scholar.content, assessment: assessment.content, proposal: content })
      const review = this.save(`proposal-review-${id}`, 'review', verdict, [proposal.ref])
      if (this.ledger.authorize(proposal, review, content.facts.length)) {
        this.output.event('proposal.ready', { subject: proposal.ref, review: review.ref })
        return proposal
      }
      feedback = verdict.issues; previousDraft = content.markdown; this.output.event('critic.revise', { phase: 'proposal', subject: proposal.ref, issues: feedback })
    }
    return undefined
  }
  private save<Content>(id: string, kind: SavedArtifact<Content>['kind'], content: Content, inputs: ReadonlyArray<ArtifactRef>): SavedArtifact<Content> {
    const artifact = this.ledger.save(id, kind, content, inputs)
    this.output.save(artifact); return artifact
  }
}
