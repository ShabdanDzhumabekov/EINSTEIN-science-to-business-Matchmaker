import { z } from "zod"
import { Passage } from "./passage"

export const BusinessCard = z.object({
	taskId: z.string().min(1),
	companyId: z.string().min(1),
	companyName: z.string().min(1),
	sector: z.string().min(1),
	location: z.string().min(1),
	challenge: z.object({ text: Passage, detail: Passage }),
	company: z.object({
		about: Passage,
		products: z.array(Passage),
		tech: z.array(Passage),
		plans: Passage,
		rdCapacity: Passage,
		pastCollaborations: Passage,
	}),
})

export type BusinessCard = z.infer<typeof BusinessCard>
