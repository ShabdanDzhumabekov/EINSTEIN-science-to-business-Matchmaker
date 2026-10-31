import { z } from "zod"
import { QuestionText } from "./decision"

export const ScreenedPair = z.object({
	taskId: z.string().min(1),
	researcherId: z.string().min(1),
	jev: z.number().min(0).max(1),
	isKept: z.boolean(),
})

export const TaskScreening = z.object({
	taskId: z.string().min(1),
	researchFit: z.number().min(0).max(1),
	isResearchProblem: z.boolean(),
	threshold: z.number().min(0).max(1),
	pairs: z.array(ScreenedPair),
	model: z.string().min(1),
	/* Wording of the two Jev questions; `<researcherId>` stands for the id inserted per researcher. Optional only for cache files written before it was recorded. */
	questions: z.object({ researchProblem: QuestionText, pairFit: QuestionText }).optional(),
	/* Set by the screening store: when the screening was made and whether this run reused it from the cache. */
	provenance: z.object({ screenedAt: z.string().min(1), isFromCache: z.boolean() }).optional(),
})

export type ScreenedPair = z.infer<typeof ScreenedPair>
export type TaskScreening = z.infer<typeof TaskScreening>
