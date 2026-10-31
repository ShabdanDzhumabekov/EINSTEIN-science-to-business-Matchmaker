import { z } from "zod"

/* One line of the Critic's checklist: a pass must quote the proposal sentence that satisfies the item. */
export const CriticCheck = z.object({
	item: z.enum(["problem", "constraints", "researcher_fit", "contributions", "first_experiment", "metric", "causal_claims", "risks", "participation", "benefits"]),
	verdict: z.enum(["pass", "fail", "not_applicable"]),
	evidence: z.string().min(1),
})

export type CriticCheck = z.infer<typeof CriticCheck>
