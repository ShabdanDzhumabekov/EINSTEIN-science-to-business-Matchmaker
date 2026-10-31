import { z } from "zod"

export const SearchQuery = z.object({
	kind: z.enum(["problem", "methods", "conditions"]),
	text: z.string().min(1),
})

export type SearchQuery = z.infer<typeof SearchQuery>
