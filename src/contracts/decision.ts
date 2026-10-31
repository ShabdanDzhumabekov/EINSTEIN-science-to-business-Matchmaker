import { z } from "zod"

/* The wording of one Jev question, kept in artifacts so a reader sees what was asked. */
export const QuestionText = z.object({ instructions: z.string().min(1), whenTrue: z.string().min(1), whenFalse: z.string().min(1) })
export type QuestionText = z.infer<typeof QuestionText>

/* One yes/no question for Jev; the answer is the probability that the statement in whenTrue holds. */
export type NoulQuestion = {
	key: string
	instructions: string
	whenTrue: string
	whenFalse: string
}

/* Implemented by the runtime (developer B): one Jev Decisions call answering several questions about one shared state. */
export interface Decision {
	probabilities(state: Readonly<Record<string, unknown>>, questions: ReadonlyArray<NoulQuestion>): Promise<ReadonlyMap<string, number>>
}
