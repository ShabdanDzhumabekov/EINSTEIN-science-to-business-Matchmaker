import { z } from "zod"
import { SearchQuery } from "./search-query"

const Candidate = z.object({
	researcherId: z.string().min(1),
	retrievalScore: z.number(),
	matchedQueryKinds: z.array(SearchQuery.shape.kind).min(1),
	matchedTerms: z.array(z.string().min(1)),
	hits: z.array(z.object({ recordId: z.string().min(1), field: z.string().min(1) })).min(1),
})

export const CandidateSet = z.object({
	taskId: z.string().min(1),
	datasetVersion: z.string().min(1),
	queries: z.array(SearchQuery).min(1),
	candidates: z.array(Candidate),
	reserve: z.array(Candidate),
})

export type CandidateSet = z.infer<typeof CandidateSet>
