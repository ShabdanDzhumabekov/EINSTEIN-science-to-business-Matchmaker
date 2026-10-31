import { z } from "zod"
import type { ArtifactRef } from "../../../../contracts/artifact-ref"
import type { BusinessCard } from "../../../../contracts/business-card"
import type { CriticIssue } from "../../../../contracts/critic-issue"
import type { PairAssessment } from "../../../../contracts/pair-assessment"
import { Proposal } from "../../../../contracts/proposal"
import type { RoleInference } from "../../../../contracts/role-inference"
import type { ScholarCard } from "../../../../contracts/scholar-card"
import { SourceRef } from "../../../../contracts/source-ref"
import type { SupportedClaim } from "../../../../contracts/supported-claim"
import type { Dataset } from "../../../../data/dataset"
import { cardPassages } from "../../../../cards/card-passages"
import { pairSourceViolations } from "../../../../evidence/pair-source-violations"
import { DeclinedParticipationError } from "../../domain/declined-participation-error"
import { InvalidProposalError } from "../../domain/invalid-proposal-error"
import { PROPOSAL_WRITER_INSTRUCTION } from "./proposal-writer-instruction"
import { proposalMarkdown } from '../../domain/proposal-markdown'

export type ProposalRequest = {
	business: BusinessCard
	scholar: ScholarCard
	assessment: PairAssessment
	inputs: ReadonlyArray<ArtifactRef>
	feedback?: ReadonlyArray<CriticIssue>
	/* The Markdown of the draft the feedback refers to, so the Writer revises it instead of starting over. */
	previousDraft?: string
}

const ModelFact = z.object({ text: z.string().min(1), sources: z.array(SourceRef.omit({ datasetVersion: true })).min(1) })
const ModelProposal = Proposal.omit({ taskId: true, researcherId: true, format: true, inputs: true, markdown: true })
	.extend({ facts: z.array(ModelFact).min(1) }).partial({ isConditional: true })

export async function writeProposal(inference: RoleInference, dataset: Dataset, request: ProposalRequest): Promise<Proposal> {
	const { assessment, business, scholar } = request
	if (assessment.outcome !== "pair") {
		throw new Error(`writeProposal: assessment for ${assessment.taskId} is "${assessment.outcome}", not a pair`)
	}
	if (assessment.taskId !== business.taskId || assessment.researcherId !== scholar.researcherId) {
		throw new Error(`writeProposal: mismatched inputs task ${business.taskId}, card ${scholar.researcherId}, pair ${assessment.taskId}/${assessment.researcherId}`)
	}
	const { industrialPhdSupervision, jointProject, availability } = scholar.participation
	const willingness = assessment.format === "industrial_phd" ? industrialPhdSupervision : jointProject
	if (willingness.status === "declined") {
		throw new DeclinedParticipationError(assessment.researcherId, assessment.format)
	}
	const modelOutput = await inference.infer({
		role: "proposal_writer",
		instruction: PROPOSAL_WRITER_INSTRUCTION,
		input: proposalWriterInput(request),
		output: { name: "proposal", schema: ModelProposal },
	})
	const modelProposal = {
		...modelOutput,
		inferences: modelOutput.inferences.map(withoutLeadingColon),
		proposedActions: modelOutput.proposedActions.map(withoutLeadingColon),
		questions: modelOutput.questions.map(withoutLeadingColon),
	}
	const facts = modelProposal.facts.map((fact) => ({ text: fact.text, sources: fact.sources.map((source) => ({ ...source, datasetVersion: dataset.version })) }))
	const violations = [
		...pairSourceViolations(dataset, business, scholar, facts, "proposal_writer"),
		...uncitedConstraintViolations(assessment.constraints, facts),
		...listItemViolations({ inferences: modelProposal.inferences, proposedActions: modelProposal.proposedActions, questions: modelProposal.questions }),
	]
	const markdown = proposalMarkdown({ ...modelProposal, facts })
	const wordCount = markdown.split(/\s+/).length
	if (wordCount > MAX_WORDS) violations.push(`proposal has ${wordCount} words, limit ${MAX_WORDS}: cut at least ${wordCount - MAX_WORDS} words, starting with inferences and later proposed actions`)
	if (facts.length > MAX_FACTS) violations.push(`proposal has ${facts.length} facts, limit ${MAX_FACTS}: merge related facts`)
	const scholarRecordIds = new Set([scholar.researcherId, ...scholar.works.map((work) => work.recordId)])
	if (!facts.some((fact) => fact.sources.some((source) => scholarRecordIds.has(source.recordId)))) {
		violations.push("facts must include at least one claim quoted from the researcher's own material (profile or confirmed works)")
	}
	for (const side of ["company", "researcher"] as const) {
		if (modelProposal.benefits[side].trim() === "") violations.push(`benefits.${side} must state what the ${side} could gain`)
	}
	if (violations.length > 0) {
		throw new InvalidProposalError(violations, modelProposal)
	}
	return {
		...modelProposal,
		facts,
		markdown,
		taskId: assessment.taskId,
		researcherId: assessment.researcherId,
		format: assessment.format,
		isConditional: modelProposal.isConditional === true || willingness.status === "unknown" || availability.status !== "active",
		inputs: [...request.inputs],
	}
}

function proposalWriterInput(request: ProposalRequest): string {
	return [
		...cardPassages(request.business, request.scholar),
		"",
		`Pair assessment: ${JSON.stringify(request.assessment)}`,
		...(!request.feedback?.length
			? []
			: ["", "Issues found in your previous proposal (a claim may contain the rejected draft). Fix every one and keep what was correct:", ...request.feedback.map((issue) => JSON.stringify(issue)),
				...(request.previousDraft === undefined ? [] : ["", "Your previous draft follows. Revise it rather than rewriting it: keep every proposed go/no-go target, threshold, uncertainty rule, population-specific acceptance and control condition unless an issue asks to change it; dropping one is a regression.", request.previousDraft])]),
	].join("\n")
}

function uncitedConstraintViolations(
	constraints: ReadonlyArray<SupportedClaim>,
	facts: ReadonlyArray<SupportedClaim>,
): ReadonlyArray<string> {
	const factSources = facts.flatMap((fact) => fact.sources)
	return constraints
		.filter((constraint) => !constraint.sources.some((source) => factSources.some((factSource) => isSameSource(source, factSource))))
		.map((constraint) => {
			const source = constraint.sources[0]
			const citation = source === undefined ? "" : `; add a fact with the source recordId "${source.recordId}", field "${source.field}", quote "${source.quote}"`
			return `constraint "${constraint.text}" has no source cited in facts${citation}`
		})
}

/* DeepSeek prefixes list items with ": "; the item itself is fine, so the prefix is dropped at the boundary. */
function withoutLeadingColon(item: string): string {
	return item.replace(/^\s*:\s*/, "")
}

/* Hard limits checked by code; the Writer prompt aims below them (650 words, 7 facts, 60 and 150 words per item). */
const MAX_WORDS = 1000
const MAX_FACTS = 10
const MAX_ITEM_WORDS = 80
const MAX_FIRST_EXPERIMENT_WORDS = 180

/* Glued lists showed up as a leading ": " and as several questions in one item; a full first experiment stays one long action. */
function listItemViolations(lists: Readonly<Record<string, ReadonlyArray<string>>>): ReadonlyArray<string> {
	return Object.entries(lists).flatMap(([name, items]) => items.flatMap((item, index) => {
		const limit = name === "proposedActions" && index === 0 ? MAX_FIRST_EXPERIMENT_WORDS : MAX_ITEM_WORDS
		return /^\s*[:;,.\-–—]/.test(item) || item.split(/\s+/).length > limit || (name === "questions" && (item.match(/\?/g) ?? []).length > 1)
			? [`${name} item ${index + 1} must be one separate point without leading punctuation, at most ${limit} words`]
			: []
	}))
}

function isSameSource(left: SourceRef, right: SourceRef): boolean {
	return left.recordId === right.recordId && left.field === right.field && left.quote === right.quote && left.datasetVersion === right.datasetVersion
}
