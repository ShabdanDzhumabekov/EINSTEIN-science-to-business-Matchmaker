import { z } from "zod"

export const PatentRecord = z.object({
	id: z.string().regex(/^SYN-PAT-\d{3}$/),
	title: z.string(),
	year: z.number().int(),
	status: z.string(),
	abstract: z.string(),
	inventors: z.array(z.object({ researcher_id: z.string(), name: z.string() })),
})

export type PatentRecord = z.infer<typeof PatentRecord>
