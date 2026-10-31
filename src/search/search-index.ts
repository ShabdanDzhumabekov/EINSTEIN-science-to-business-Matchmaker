import type { Dataset } from "../data/dataset"
import { searchTerms } from "./search-terms"

export type FieldMatch = {
	recordId: string
	field: string
	researcherIds: ReadonlyArray<string>
	score: number
	matchedTerms: ReadonlyArray<string>
}

type IndexedField = {
	recordId: string
	field: string
	researcherIds: ReadonlyArray<string>
	termCounts: ReadonlyMap<string, number>
	length: number
}

const BM25_K1 = 1.2
const BM25_B = 0.75

export class SearchIndex {
	private readonly fields: ReadonlyArray<IndexedField>
	private readonly documentFrequency: ReadonlyMap<string, number>
	private readonly averageLength: number

	constructor(readonly dataset: Dataset) {
		this.fields = indexedFields(dataset)
		const documentFrequency = new Map<string, number>()
		for (const field of this.fields) {
			for (const term of field.termCounts.keys()) {
				documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1)
			}
		}
		this.documentFrequency = documentFrequency
		this.averageLength = this.fields.reduce((total, field) => total + field.length, 0) / Math.max(this.fields.length, 1)
	}

	matches(terms: ReadonlyArray<string>): ReadonlyArray<FieldMatch> {
		const uniqueTerms = [...new Set(terms)]
		return this.fields.flatMap((field) => {
			const matchedTerms = uniqueTerms.filter((term) => field.termCounts.has(term))
			if (matchedTerms.length === 0) return []
			const score = matchedTerms.reduce((total, term) => total + this.termScore(field, term), 0)
			return [{ recordId: field.recordId, field: field.field, researcherIds: field.researcherIds, score, matchedTerms }]
		})
	}

	private termScore(field: IndexedField, term: string): number {
		const frequency = field.termCounts.get(term) ?? 0
		const fieldCount = this.fields.length
		const documentFrequency = this.documentFrequency.get(term) ?? 0
		const inverseFrequency = Math.log(1 + (fieldCount - documentFrequency + 0.5) / (documentFrequency + 0.5))
		const lengthNorm = 1 - BM25_B + BM25_B * (field.length / this.averageLength)
		return (inverseFrequency * frequency * (BM25_K1 + 1)) / (frequency + BM25_K1 * lengthNorm)
	}
}

function indexedFields(dataset: Dataset): ReadonlyArray<IndexedField> {
	const listedBy = profileListings(dataset)
	const workAuthors = (recordId: string, namedIds: ReadonlyArray<string | null>): ReadonlyArray<string> => [
		...new Set([...namedIds.filter((id): id is string => id !== null), ...(listedBy.get(recordId) ?? [])]),
	]
	const sources: Array<{ recordId: string; researcherIds: ReadonlyArray<string>; texts: Record<string, string> }> = []
	for (const researcher of dataset.researchers.values()) {
		sources.push({
			recordId: researcher.id,
			researcherIds: [researcher.id],
			texts: {
				fields: researcher.fields.join("\n"),
				keywords: researcher.keywords.join("\n"),
				bio: researcher.bio,
				industry_experience: researcher.industry_experience,
			},
		})
	}
	for (const publication of dataset.publications.values()) {
		sources.push({
			recordId: publication.id,
			researcherIds: workAuthors(publication.id, publication.authors.map((author) => author.researcher_id)),
			texts: { title: publication.title, abstract: publication.abstract, keywords: publication.keywords.join("\n") },
		})
	}
	for (const project of dataset.projects.values()) {
		sources.push({
			recordId: project.id,
			researcherIds: workAuthors(project.id, project.participants.map((participant) => participant.researcher_id)),
			texts: { title: project.title, summary: project.summary },
		})
	}
	for (const patent of dataset.patents.values()) {
		sources.push({
			recordId: patent.id,
			researcherIds: workAuthors(patent.id, patent.inventors.map((inventor) => inventor.researcher_id)),
			texts: { title: patent.title, abstract: patent.abstract },
		})
	}
	return sources.flatMap((source) =>
		Object.entries(source.texts).flatMap(([field, text]) => {
			const terms = searchTerms(text)
			if (terms.length === 0) return []
			const termCounts = new Map<string, number>()
			for (const term of terms) termCounts.set(term, (termCounts.get(term) ?? 0) + 1)
			return [{ recordId: source.recordId, field, researcherIds: source.researcherIds, termCounts, length: terms.length }]
		}),
	)
}

function profileListings(dataset: Dataset): ReadonlyMap<string, ReadonlyArray<string>> {
	const listedBy = new Map<string, string[]>()
	for (const researcher of dataset.researchers.values()) {
		for (const workId of [...researcher.publications, ...researcher.projects, ...researcher.patents]) {
			listedBy.set(workId, [...(listedBy.get(workId) ?? []), researcher.id])
		}
	}
	return listedBy
}
