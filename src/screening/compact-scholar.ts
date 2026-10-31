import type { ScholarCard } from "../contracts/scholar-card"

const WORK_TITLES_SHOWN = 8

/* The short form of a researcher that fits 150 of them into one Jev request. */
export function compactScholar(scholar: ScholarCard) {
	return { fields: scholar.fields, keywords: scholar.keywords, works: scholar.works.slice(0, WORK_TITLES_SHOWN).map((work) => work.title) }
}
