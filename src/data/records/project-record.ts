import { z } from "zod"

export const ProjectRecord = z.object({
	id: z.string().regex(/^SYN-PRJ-\d{4}$/),
	acronym: z.string(),
	title: z.string(),
	programme: z.string(),
	years: z.string(),
	summary: z.string(),
	partners: z.array(z.string()),
	participants: z.array(z.object({ researcher_id: z.string(), role: z.string() })),
})

export type ProjectRecord = z.infer<typeof ProjectRecord>
