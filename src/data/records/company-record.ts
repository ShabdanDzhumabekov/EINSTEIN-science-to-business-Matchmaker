import { z } from "zod"
import { ChallengeRecord } from "./challenge-record"

export const CompanyRecord = z.object({
	id: z.string().regex(/^C\d{3}$/),
	name: z.string(),
	sector: z.string(),
	employees: z.number().int(),
	founded: z.number().int(),
	location: z.string(),
	about: z.string(),
	products: z.array(z.string()),
	tech: z.array(z.string()),
	challenges: z.array(ChallengeRecord),
	plans: z.string(),
	rd_capacity: z.string(),
	past_collaborations: z.string(),
	language: z.string(),
})

export type CompanyRecord = z.infer<typeof CompanyRecord>
