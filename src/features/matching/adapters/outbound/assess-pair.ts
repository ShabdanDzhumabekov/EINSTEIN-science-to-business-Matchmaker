import { z } from "zod"
import type { ArtifactRef } from "../../../../contracts/artifact-ref"
import type { BusinessCard } from "../../../../contracts/business-card"
import type { CriticIssue } from "../../../../contracts/critic-issue"
import { PairAssessment } from "../../../../contracts/pair-assessment"
import type { RoleInference } from "../../../../contracts/role-inference"
import type { ScholarCard } from "../../../../contracts/scholar-card"
import { SourceRef } from "../../../../contracts/source-ref"
import { SupportedClaim } from "../../../../contracts/supported-claim"
import type { Dataset } from "../../../../data/dataset"
import { pairSourceViolations } from "../../../../evidence/pair-source-violations"
import { InvalidAssessmentError } from "../../domain/invalid-assessment-error"
import { cardPassages } from "../../../../cards/card-passages"
import { MATCHMAKER_DECISION_INSTRUCTION, MATCHMAKER_INSTRUCTION } from "./matchmaker-instruction"

export type AssessmentRequest = {
	business: BusinessCard
	scholar: ScholarCard
	inputs: ReadonlyArray<ArtifactRef>
	feedback?: ReadonlyArray<CriticIssue>
}

const ModelSourceRef = SourceRef.omit({ datasetVersion: true })
const ModelClaim = SupportedClaim.extend({ sources: z.array(ModelSourceRef).min(1) })
const [ProposedPair, NoFit] = PairAssessment.options
const codeAssignedFields = { taskId: true, researcherId: true, inputs: true } as const

const ModelPair = ProposedPair.omit({ ...codeAssignedFields, outcome: true }).extend({ rationale: z.array(ModelClaim).min(1), constraints: z.array(ModelClaim) })
const ModelDecision = z.object({ fits: z.boolean(), reason: z.string() })

type ModelPair = z.infer<typeof ModelPair>
type ProposedPair = Extract<PairAssessment, { outcome: "pair" }>

/* Two calls: a short fit decision, then the full pair. A correction skips the decision, since only a pair is ever corrected. */
export async function assessPair(inference: RoleInference, dataset: Dataset, request: AssessmentRequest): Promise<PairAssessment> {
	const stamped = { taskId: request.business.taskId, researcherId: request.scholar.researcherId, inputs: [...request.inputs] }
	if (!request.feedback?.length) {
		const decision = await fitDecision(inference, request)
		if (!decision.fits) return { outcome: "no_fit", reason: decision.reason, ...stamped }
	}
	const modelPair = await inference.infer({
		role: "matchmaker",
		instruction: MATCHMAKER_INSTRUCTION,
		input: matchmakerInput(request),
		output: { name: "pair_assessment", schema: ModelPair },
	})
	const assessment = { ...completed(modelPair, dataset.version), ...stamped }
	const violations = pairViolations(dataset, request, assessment)
	if (violations.length > 0) {
		throw new InvalidAssessmentError(violations, assessment)
	}
	return assessment
}

/* A template drop reason has hidden a fit before; ask once more, then accept the answer so a correction never forces a pair. */
async function fitDecision(inference: RoleInference, request: AssessmentRequest): Promise<z.infer<typeof ModelDecision>> {
	const ask = (note: string) => inference.infer({
		role: "matchmaker",
		instruction: MATCHMAKER_DECISION_INSTRUCTION,
		input: `${matchmakerInput(request)}${note}`,
		output: { name: "pair_decision", schema: ModelDecision },
	})
	const decision = await ask("")
	if (decision.fits || !isTemplateReason(decision.reason)) return decision
	return ask(`\n\nYour previous answer gave the template reason "${decision.reason}". Decide again and explain the reason in a full sentence.`)
}

function isTemplateReason(reason: string): boolean {
	return reason.trim().split(/\s+/).length < 5 || /placeholder|\btodo\b|\btbd\b|lorem/i.test(reason)
}

function completed(modelPair: ModelPair, datasetVersion: string): Omit<ProposedPair, "taskId" | "researcherId" | "inputs"> {
	const versioned = (claim: z.infer<typeof ModelClaim>) => ({ text: claim.text, sources: claim.sources.map((source) => ({ ...source, datasetVersion })) })
	return { ...modelPair, outcome: "pair", rationale: modelPair.rationale.map(versioned), constraints: modelPair.constraints.map(versioned) }
}

function pairViolations(dataset: Dataset, request: AssessmentRequest, pair: ProposedPair): ReadonlyArray<string> {
	const { business, scholar } = request
	const willingness = pair.format === "industrial_phd" ? scholar.participation.industrialPhdSupervision : scholar.participation.jointProject
	const scholarRecordIds = new Set([scholar.researcherId, ...scholar.works.map((work) => work.recordId)])
	const companyOnlyRationale = pair.rationale
		.filter((claim) => !claim.sources.some((source) => scholarRecordIds.has(source.recordId)))
		.map((claim) => `rationale "${claim.text}" must cite the researcher's own material`)
	return [
		...pairSourceViolations(dataset, business, scholar, [...pair.rationale, ...pair.constraints], "matchmaker"),
		...companyOnlyRationale,
		...(willingness.status === "declined" ? [`format ${pair.format} is declined in the researcher card`] : []),
		...(scholar.participation.availability.status === "unavailable" ? [`researcher ${scholar.researcherId} is unavailable according to the card`] : []),
	]
}

function matchmakerInput(request: AssessmentRequest): string {
	return [
		...cardPassages(request.business, request.scholar),
		...(!request.feedback?.length
			? []
			: ["", "Feedback on the previous assessment; claim may contain the rejected output. Correct every reported issue:", ...request.feedback.map((issue) => JSON.stringify(issue))]),
	].join("\n")
}
