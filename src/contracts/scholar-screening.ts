import { z } from "zod"
import { QuestionText } from "./decision"

export const ScreenedChallenge = z.object({
	taskId: z.string().min(1),
	companyId: z.string().min(1),
	fit: z.number().min(0).max(1),
	researchFit: z.number().min(0).max(1),
	isKept: z.boolean(),
})

export const ScholarScreening = z.object({
	researcherId: z.string().min(1),
	threshold: z.number().min(0).max(1),
	batches: z.number().int().positive(),
	challenges: z.array(ScreenedChallenge),
	model: z.string().min(1),
	/* Wording of the two Jev questions; `<taskId>` stands for the id inserted per challenge. */
	questions: z.object({ pairFit: QuestionText, researchProblem: QuestionText }),
})

export type ScreenedChallenge = z.infer<typeof ScreenedChallenge>
export type ScholarScreening = z.infer<typeof ScholarScreening>
