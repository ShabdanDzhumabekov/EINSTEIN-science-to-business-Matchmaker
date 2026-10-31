import { z } from "zod"
import { QuestionText } from "./decision"

export const CompanyScreenedResearcher = z.object({
	researcherId: z.string().min(1),
	jev: z.number().min(0).max(1),
	isKept: z.boolean(),
})

/* Optional pre-filter before the challenge screening: one Jev question per researcher about the company as a whole. */
export const CompanyScreening = z.object({
	companyId: z.string().min(1),
	threshold: z.number().min(0).max(1),
	pairs: z.array(CompanyScreenedResearcher),
	model: z.string().min(1),
	question: QuestionText,
	provenance: z.object({ screenedAt: z.string().min(1), isFromCache: z.boolean() }).optional(),
})

export type CompanyScreenedResearcher = z.infer<typeof CompanyScreenedResearcher>
export type CompanyScreening = z.infer<typeof CompanyScreening>
