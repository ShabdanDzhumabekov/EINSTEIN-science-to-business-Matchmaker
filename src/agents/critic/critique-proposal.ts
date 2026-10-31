import type { ArtifactRef } from "../../contracts/artifact-ref"
import type { CriticVerdict } from "../../contracts/critic-verdict"
import type { PairAssessment } from "../../contracts/pair-assessment"
import type { Proposal } from "../../contracts/proposal"
import type { ScholarCard } from "../../contracts/scholar-card"
import type { RoleInference } from "../../contracts/role-inference"
import type { BusinessCard } from "../../contracts/business-card"
import type { CriticIssue } from "../../contracts/critic-issue"
import type { Decision } from "../../contracts/decision"
import type { Dataset } from "../../data/dataset"
import { cardPassages } from "../../cards/card-passages"
import { verifyQuote } from "../../evidence/verify-quote"
import { claimSourceIssues } from "./claim-source-issues"
import { factSupport } from "./fact-support"
import { PROPOSAL_CRITIC_INSTRUCTION } from "./critic-instruction"
import { participationIssues } from "./participation-issues"
import { reviewMaterial } from "./review-material"
import { semanticIssues } from "./semantic-issues"

export type ProposalReviewRequest = {
	subject: ArtifactRef
	business: BusinessCard
	scholar: ScholarCard
	assessment: PairAssessment
	proposal: Proposal
}

export async function critiqueProposal(
	inference: RoleInference,
	decision: Decision,
	dataset: Dataset,
	request: ProposalReviewRequest,
): Promise<CriticVerdict> {
	const { business, scholar, assessment, proposal } = request
	const isSamePair =
		proposal.taskId === business.taskId &&
		assessment.taskId === business.taskId &&
		proposal.researcherId === scholar.researcherId &&
		assessment.outcome === "pair" &&
		assessment.researcherId === scholar.researcherId
	if (!isSamePair) {
		throw new Error(
			`critiqueProposal: mismatched inputs task ${business.taskId}, card ${scholar.researcherId}, proposal ${proposal.taskId}/${proposal.researcherId}`,
		)
	}
	const codeIssues = [
		...claimSourceIssues(
			dataset,
			proposal.facts.map((claim) => ({ claim, owner: "proposal_writer" as const, researcherId: scholar.researcherId, isCompetenceClaim: false })),
		),
		...participationIssues(proposal.format, scholar, "proposal_writer"),
		...conditionalityIssues(proposal, scholar),
	]
	const citedSources = proposal.facts.flatMap((claim) => claim.sources)
	const input = [
		`datasetVersion: ${dataset.version}`,
		reviewMaterial(dataset, business, citedSources),
		"",
		"Material of both sides:",
		...cardPassages(business, scholar),
		`Approved pair assessment: ${JSON.stringify(assessment)}`,
		"",
		"Proposal under review:",
		JSON.stringify({ ...proposal, markdown: undefined }),
		"Proposal text:",
		proposal.markdown,
	].join("\n")
	const [modelReview, jev] = await Promise.all([
		semanticIssues(inference, PROPOSAL_CRITIC_INSTRUCTION, input, dataset.version),
		factSupport(decision, dataset, proposal.facts),
	])
	const isGrounded = (issue: CriticIssue) => issue.sources.every((source) => ["exact", "normalized"].includes(verifyQuote(dataset, source)))
	return {
		phase: "proposal", subject: request.subject, checkedClaimCount: proposal.facts.length,
		issues: [...codeIssues, ...jev.issues, ...modelReview.issues.filter(isGrounded)],
		checklist: [...modelReview.checks],
		unverifiedIssues: modelReview.issues.filter((issue) => !isGrounded(issue)),
		jevFactCheck: { support: [...jev.support], threshold: jev.threshold, question: jev.question },
	}
}

function conditionalityIssues(proposal: Proposal, card: ScholarCard): ReadonlyArray<CriticIssue> {
	const willingness =
		proposal.format === "industrial_phd" ? card.participation.industrialPhdSupervision : card.participation.jointProject
	if (willingness.status !== "unknown" || proposal.isConditional) {
		return []
	}
	return [
		{
			category: "participation_misstated",
			severity: "blocking",
			claim: `unconditional ${proposal.format} proposal`,
			sources: [],
			explanation: "The researcher's willingness for this role is unknown, so the proposal must be marked conditional.",
			owner: "proposal_writer",
		},
	]
}
