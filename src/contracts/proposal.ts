import { z } from "zod"
import { ArtifactRef } from "./artifact-ref"
import { CollaborationFormat } from "./collaboration-format"
import { SupportedClaim } from "./supported-claim"

export const Proposal = z.object({
	taskId: z.string().min(1),
	researcherId: z.string().min(1),
	format: CollaborationFormat,
	isConditional: z.boolean(),
	title: z.string().min(1),
	markdown: z.string().min(1),
	facts: z.array(SupportedClaim).min(1),
	inferences: z.array(z.string().min(1)),
	proposedActions: z.array(z.string().min(1)),
	questions: z.array(z.string().min(1)),
	/* Potential gains as the Writer sees them, not facts: anything factual behind them stays in facts with sources. */
	benefits: z.object({ company: z.string(), researcher: z.string() }),
	inputs: z.array(ArtifactRef).min(1),
})

export type Proposal = z.infer<typeof Proposal>
