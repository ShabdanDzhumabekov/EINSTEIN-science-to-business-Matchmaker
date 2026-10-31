import { searchableText } from "../data/searchable-text"

const STOP_WORDS = new Set(
	(
		"a an and are as at be been but by can could do does for from had has have how in into is it its of on or our " +
		"over so such than that the their them then there these they this to was we were what when where which while " +
		"who will with within without would you your not no all any each more most other some very also using based use"
	).split(" "),
)

export function searchTerms(text: string): ReadonlyArray<string> {
	return searchableText(text)
		.split(/[^a-z0-9]+/)
		.filter((word) => word.length >= 2 && !STOP_WORDS.has(word))
		.map(singular)
}

function singular(word: string): string {
	if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`
	if (word.length > 4 && word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us")) return word.slice(0, -1)
	return word
}
