import { z } from "zod"
import { SearchQuery } from "./search-query"
import { SupportedClaim } from "./supported-claim"

export const TaskCard = z.object({
	taskId: z.string().min(1),
	companyId: z.string().min(1),
	problem: SupportedClaim,
	goal: SupportedClaim,
	constraints: z.array(SupportedClaim),
	resources: z.array(SupportedClaim),
	unknowns: z.array(z.string().min(1)),
	researchFit: z.object({
		kind: z.enum(["research_problem", "not_research_problem", "unclear"]),
		reason: z.string().min(1),
	}),
	searchQueries: z.array(SearchQuery).min(1),
})

export type TaskCard = z.infer<typeof TaskCard>
