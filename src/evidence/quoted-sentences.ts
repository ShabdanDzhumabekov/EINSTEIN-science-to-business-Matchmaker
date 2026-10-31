import type { SourceRef } from "../contracts/source-ref"
import type { Dataset } from "../data/dataset"
import { resolveSource } from "./resolve-source"

const SENTENCE_BOUNDARY = /(?<=[.!?])\s+(?=[\p{Lu}0-9"“(])/u

/* The sentence a quote was cut from; a short fragment alone left Jev unsure about claims the source states plainly. */
export function quotedSentences(dataset: Dataset, source: SourceRef): ReadonlyArray<string> {
	const resolved = resolveSource(dataset, source)
	if (resolved.status !== "resolved") return [source.quote]
	const sentences = resolved.passages.flatMap((passage) => passage.split(SENTENCE_BOUNDARY)).filter((sentence) => sentence.includes(source.quote))
	return sentences.length > 0 ? sentences : [source.quote]
}
