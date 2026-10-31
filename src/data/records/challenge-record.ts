import { z } from "zod"

export const ChallengeRecord = z.object({
	id: z.string().regex(/^C\d{3}-CH\d+$/),
	text: z.string(),
	detail: z.string(),
})

export type ChallengeRecord = z.infer<typeof ChallengeRecord>
