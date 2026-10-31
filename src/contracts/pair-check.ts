import { z } from "zod"
import { ArtifactRef } from "./artifact-ref"
import { QuestionText } from "./decision"

export const PairCheck = z.object({
	taskId: z.string().min(1),
	researcherId: z.string().min(1),
	assessment: ArtifactRef,
	jev: z.number().min(0).max(1),
	isKept: z.boolean(),
	threshold: z.number().min(0).max(1),
	model: z.string().min(1),
	question: QuestionText,
})

export type PairCheck = z.infer<typeof PairCheck>
