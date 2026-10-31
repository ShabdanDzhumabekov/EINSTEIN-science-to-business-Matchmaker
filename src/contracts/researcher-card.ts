import { z } from "zod"
import { QualityFlag } from "./quality-flag"
import { SourceRef } from "./source-ref"
import { SupportedClaim } from "./supported-claim"

const RoleWillingness = z.object({
	status: z.enum(["open", "declined", "unknown"]),
	sources: z.array(SourceRef),
})

export const ResearcherCard = z.object({
	researcherId: z.string().min(1),
	methods: z.array(SupportedClaim),
	participation: z.object({
		industrialPhdSupervision: RoleWillingness,
		jointProject: RoleWillingness,
		availability: z.object({
			status: z.enum(["active", "limited", "unavailable", "unknown"]),
			sources: z.array(SourceRef),
		}),
	}),
	unknowns: z.array(z.string().min(1)),
	qualityFlags: z.array(QualityFlag),
})

export type ResearcherCard = z.infer<typeof ResearcherCard>
