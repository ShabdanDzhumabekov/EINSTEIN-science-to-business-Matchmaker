import { z } from "zod"
import { ArtifactRef } from "./artifact-ref"
import { CriticCheck } from "./critic-check"
import { CriticIssue } from "./critic-issue"
import { QuestionText } from "./decision"

export const CriticVerdict = z.object({
	phase: z.enum(["pair", "proposal"]),
	subject: ArtifactRef,
	checkedClaimCount: z.number().int().nonnegative(),
	issues: z.array(CriticIssue),
	/* Jev's support probability per fact, in fact order, with the question wording; only the proposal phase runs it. */
	/* The LLM Critic's checklist, kept for the trace; issues are derived from its failed items. */
	checklist: z.array(CriticCheck).optional(),
	/* LLM issues whose quoted sources code could not find in the dataset; they do not block and are kept for the trace. */
	unverifiedIssues: z.array(CriticIssue).optional(),
	jevFactCheck: z.object({ support: z.array(z.number().min(0).max(1)), threshold: z.number().min(0).max(1), question: QuestionText }).optional(),
})

export type CriticVerdict = z.infer<typeof CriticVerdict>
