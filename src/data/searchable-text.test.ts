import { describe, expect, it } from "vitest"
import { searchableText } from "./searchable-text"

describe("searchableText", () => {
	it.each([
		["Serbian Cyrillic into Latin", "Никола Урошевић", "nikola urosevic"],
		["Cyrillic digraph letters", "Љиљана Џаковић Њего", "ljiljana dzakovic njego"],
		["Latin diacritics", "Čičić Đorđe Žarko", "cicic djordje zarko"],
		["English text unchanged apart from case", "Anomaly Detection", "anomaly detection"],
	])("folds %s", (_description: string, input: string, expected: string) => {
		expect(searchableText(input)).toBe(expected)
	})

	it("makes Cyrillic and Latin spellings of one name equal", () => {
		expect(searchableText("Мирјана Јеремић")).toBe(searchableText("Mirjana Jeremić"))
	})
})
