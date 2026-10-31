import { z } from "zod"
import { Passage } from "./passage"
import { QualityFlag } from "./quality-flag"
import { SourceRef } from "./source-ref"

const RoleWillingness = z.object({
	status: z.enum(["open", "declined", "unknown"]),
	sources: z.array(SourceRef),
})

const Work = z.object({
	recordId: z.string().min(1),
	kind: z.enum(["publication", "project", "patent"]),
	title: z.string().min(1),
	body: Passage,
})

export const ScholarCard = z.object({
	researcherId: z.string().min(1),
	name: z.string().min(1),
	faculty: z.string(),
	department: z.string(),
	fields: z.array(z.string()),
	keywords: z.array(z.string()),
	openTo: z.array(z.string()),
	bio: Passage,
	industryExperience: Passage,
	notes: Passage,
	works: z.array(Work),
	participation: z.object({
		industrialPhdSupervision: RoleWillingness,
		jointProject: RoleWillingness,
		availability: z.object({
			status: z.enum(["active", "limited", "unavailable", "unknown"]),
			sources: z.array(SourceRef),
		}),
	}),
	qualityFlags: z.array(QualityFlag),
})

export type ScholarCard = z.infer<typeof ScholarCard>
