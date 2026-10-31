import { z } from "zod"

export const ResearcherRecord = z.object({
	id: z.string().regex(/^R\d{4}$/),
	name: z.string(),
	title: z.string(),
	institution: z.string(),
	faculty: z.string(),
	department: z.string(),
	fields: z.array(z.string()),
	keywords: z.array(z.string()),
	bio: z.string(),
	publications: z.array(z.string()),
	projects: z.array(z.string()),
	patents: z.array(z.string()),
	open_to: z.array(z.string()),
	industry_experience: z.string(),
	notes: z.string(),
	language: z.string(),
})

export type ResearcherRecord = z.infer<typeof ResearcherRecord>
