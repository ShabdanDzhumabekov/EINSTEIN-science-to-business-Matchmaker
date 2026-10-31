import { z } from "zod"

export const PublicationRecord = z.object({
	id: z.string().regex(/^SYN-PUB-\d{5}$/),
	title: z.string(),
	abstract: z.string(),
	year: z.number().int(),
	venue: z.string(),
	type: z.string(),
	keywords: z.array(z.string()),
	authors: z.array(
		z.object({
			name: z.string(),
			researcher_id: z.string().nullable(),
			affiliation: z.string(),
		}),
	),
})

export type PublicationRecord = z.infer<typeof PublicationRecord>
