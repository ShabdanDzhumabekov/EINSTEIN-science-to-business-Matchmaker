import { z } from "zod"

/* A quotable dataset field as the roles see it; a quote is verified by code as a substring of text. */
export const Passage = z.object({
	recordId: z.string().min(1),
	field: z.string().min(1),
	text: z.string(),
})

export type Passage = z.infer<typeof Passage>
