import { z } from "zod"
import { CriticCheck } from "../../contracts/critic-check"
import { CriticIssue } from "../../contracts/critic-issue"
import type { RoleInference } from "../../contracts/role-inference"

const ModelReview = z.object({ checks: z.array(CriticCheck).default([]), issues: z.array(CriticIssue) })

export type SemanticReview = { checks: ReadonlyArray<CriticCheck>; issues: ReadonlyArray<CriticIssue> }

const ALWAYS_BLOCKING: ReadonlySet<CriticIssue["category"]> = new Set([
	"quote_not_found",
	"unknown_source",
	"authorship_conflict",
	"unsupported_claim",
	"constraint_omitted",
	"constraint_contradicted",
	"participation_misstated",
])

export async function semanticIssues(
	inference: RoleInference,
	instruction: string,
	input: string,
	datasetVersion: string,
): Promise<SemanticReview> {
	const review = await inference.infer({ role: "critic", instruction, input, output: { name: "critic_review", schema: ModelReview } })
	return {
		checks: review.checks,
		issues: review.issues.map((issue) => ({
			...issue,
			severity: ALWAYS_BLOCKING.has(issue.category) ? "blocking" : issue.severity,
			sources: issue.sources.map((source) => ({ ...source, datasetVersion })),
		})),
	}
}
