import type { Dataset } from "../data/dataset"

export type SourceLocation = { recordId: string; field: string }

export type ResolvedSource =
	| { status: "resolved"; passages: ReadonlyArray<string> }
	| { status: "unknown_record" }
	| { status: "unknown_field" }

type FieldValue = string | ReadonlyArray<string>

const QUOTABLE_FIELDS = {
	researcher: ["title", "fields", "keywords", "bio", "open_to", "industry_experience", "notes"],
	publication: ["title", "abstract", "keywords"],
	project: ["title", "summary"],
	patent: ["title", "abstract"],
	company: ["about", "products", "tech", "plans", "rd_capacity", "past_collaborations"],
	challenge: ["text", "detail"],
	companyPage: ["title", "text"],
} as const

export function resolveSource(dataset: Dataset, location: SourceLocation): ResolvedSource {
	const record = quotableRecord(dataset, location.recordId)
	if (record === undefined) {
		return { status: "unknown_record" }
	}
	if (!record.quotableFields.includes(location.field)) {
		return { status: "unknown_field" }
	}
	const value = record.fields[location.field]
	if (value === undefined) {
		return { status: "unknown_field" }
	}
	return { status: "resolved", passages: typeof value === "string" ? [value] : value }
}

type QuotableRecord = {
	fields: Readonly<Record<string, FieldValue>>
	quotableFields: ReadonlyArray<string>
}

function quotableRecord(dataset: Dataset, recordId: string): QuotableRecord | undefined {
	const candidates: ReadonlyArray<[object | undefined, ReadonlyArray<string>]> = [
		[dataset.researchers.get(recordId), QUOTABLE_FIELDS.researcher],
		[dataset.publications.get(recordId), QUOTABLE_FIELDS.publication],
		[dataset.projects.get(recordId), QUOTABLE_FIELDS.project],
		[dataset.patents.get(recordId), QUOTABLE_FIELDS.patent],
		[dataset.companies.get(recordId), QUOTABLE_FIELDS.company],
		[dataset.challenges.get(recordId), QUOTABLE_FIELDS.challenge],
		[dataset.companyPages.get(recordId), QUOTABLE_FIELDS.companyPage],
	]
	for (const [record, quotableFields] of candidates) {
		if (record !== undefined) {
			return { fields: textFields(record), quotableFields }
		}
	}
	return undefined
}

function textFields(record: object): Readonly<Record<string, FieldValue>> {
	return Object.fromEntries(
		Object.entries(record).filter((entry): entry is [string, FieldValue] => isFieldValue(entry[1])),
	)
}

function isFieldValue(value: unknown): value is FieldValue {
	return typeof value === "string" || (Array.isArray(value) && value.every((item) => typeof item === "string"))
}
