import type { CandidateSet } from "../contracts/candidate-set"
import type { SearchQuery } from "../contracts/search-query"
import type { FieldMatch, SearchIndex } from "./search-index"
import { searchTerms } from "./search-terms"

export type CandidateLimits = { candidates: number; reserve: number }

type Candidate = CandidateSet["candidates"][number]

/* Summing only the best few fields per query keeps prolific authors from winning on volume alone. */
const FIELDS_COUNTED_PER_QUERY = 3

export function searchCandidates(
	index: SearchIndex,
	taskId: string,
	queries: ReadonlyArray<SearchQuery>,
	limits: CandidateLimits,
): CandidateSet {
	const candidatesById = new Map<string, Candidate>()
	for (const query of queries) {
		const terms = searchTerms(query.text)
		for (const [researcherId, matches] of matchesByResearcher(index.matches(terms))) {
			const counted = [...matches].sort((left, right) => right.score - left.score).slice(0, FIELDS_COUNTED_PER_QUERY)
			const existing = candidatesById.get(researcherId)
			const countedTerms = new Set(counted.flatMap((match) => match.matchedTerms))
			candidatesById.set(researcherId, {
				researcherId,
				retrievalScore: (existing?.retrievalScore ?? 0) + counted.reduce((total, match) => total + match.score, 0),
				matchedQueryKinds: [...new Set([...(existing?.matchedQueryKinds ?? []), query.kind])],
				matchedTerms: [...new Set([...(existing?.matchedTerms ?? []), ...terms.filter((term) => countedTerms.has(term))])],
				hits: [...(existing?.hits ?? []), ...counted.map((match) => ({ recordId: match.recordId, field: match.field }))],
			})
		}
	}
	const ranked = [...candidatesById.values()].sort((left, right) => right.retrievalScore - left.retrievalScore)
	return {
		taskId,
		datasetVersion: index.dataset.version,
		queries: [...queries],
		candidates: ranked.slice(0, limits.candidates),
		reserve: ranked.slice(limits.candidates, limits.candidates + limits.reserve),
	}
}

function matchesByResearcher(matches: ReadonlyArray<FieldMatch>): ReadonlyMap<string, ReadonlyArray<FieldMatch>> {
	const grouped = new Map<string, FieldMatch[]>()
	for (const match of matches) {
		for (const researcherId of match.researcherIds) {
			grouped.set(researcherId, [...(grouped.get(researcherId) ?? []), match])
		}
	}
	return grouped
}
