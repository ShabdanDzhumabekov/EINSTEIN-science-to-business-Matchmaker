import { z } from "zod"

export const CompanyPageRecord = z.object({
	company_id: z.string().regex(/^C\d{3}$/),
	kind: z.string(),
	title: z.string(),
	date: z.string(),
	text: z.string(),
})

export type CompanyPageRecord = z.infer<typeof CompanyPageRecord>
