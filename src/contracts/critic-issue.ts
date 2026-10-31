import { z } from "zod"
import { RoleName } from "./role-name"
import { SourceRef } from "./source-ref"

export const CriticIssue = z.object({
	category: z.enum([
		"quote_not_found",
		"unknown_source",
		"authorship_conflict",
		"title_only_evidence",
		"unsupported_claim",
		"constraint_omitted",
		"constraint_contradicted",
		"participation_misstated",
		"format_mismatch",
		"plan_underspecified",
	]),
	severity: z.enum(["blocking", "advisory"]),
	claim: z.string().min(1),
	sources: z.array(SourceRef),
	explanation: z.string().min(1),
	owner: RoleName.exclude(["critic"]),
})

export type CriticIssue = z.infer<typeof CriticIssue>
