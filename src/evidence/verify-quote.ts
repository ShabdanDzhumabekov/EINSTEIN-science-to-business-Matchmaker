import type { SourceRef } from "../contracts/source-ref"
import type { Dataset } from "../data/dataset"
import { resolveSource } from "./resolve-source"

export type QuoteStatus = "exact" | "normalized" | "not_found" | "unknown_record" | "unknown_field" | "version_mismatch"

export function verifyQuote(dataset: Dataset, ref: SourceRef): QuoteStatus {
	if (ref.datasetVersion !== dataset.version) {
		return "version_mismatch"
	}
	const source = resolveSource(dataset, ref)
	if (source.status !== "resolved") {
		return source.status
	}
	if (source.passages.some((passage) => passage.includes(ref.quote))) {
		return "exact"
	}
	const normalizedQuote = comparableText(ref.quote)
	if (source.passages.some((passage) => comparableText(passage).includes(normalizedQuote))) {
		return "normalized"
	}
	return "not_found"
}

function comparableText(text: string): string {
	return text
		.normalize("NFC")
		.replace(/[‘’‚‛]/g, "'")
		.replace(/[“”„‟«»]/g, '"')
		.replace(/[‐-―]/g, "-")
		.replace(/\s+/g, " ")
		.trim()
		.toLocaleLowerCase()
}
