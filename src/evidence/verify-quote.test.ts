import { describe, expect, it } from "vitest"
import type { SourceRef } from "../contracts/source-ref"
import { aDataset, aPublication, aResearcher, TEST_DATASET_VERSION } from "../test-support/dataset-builders"
import { verifyQuote } from "./verify-quote"

function aRef(overrides: Partial<SourceRef>): SourceRef {
	return { recordId: "SYN-PUB-00001", field: "abstract", quote: "", datasetVersion: TEST_DATASET_VERSION, ...overrides }
}

const abstract = "The allocator is proved to be a “forward simulation” over  four registers."

describe("verifyQuote", () => {
	it("confirms a quote copied verbatim from the field", () => {
		const dataset = aDataset({ publications: [aPublication({ abstract })] })

		const status = verifyQuote(dataset, aRef({ quote: "proved to be a “forward simulation”" }))

		expect(status).toBe("exact")
	})

	it.each([
		["collapsed whitespace", "simulation” over four registers"],
		["straight quotes", 'a "forward simulation"'],
		["a different letter case", "The Allocator is proved"],
	])("accepts a quote that differs only by %s as normalized", (_difference: string, quote: string) => {
		const dataset = aDataset({ publications: [aPublication({ abstract })] })

		const status = verifyQuote(dataset, aRef({ quote }))

		expect(status).toBe("normalized")
	})

	it("accepts Serbian Latin text written with decomposed diacritics as normalized", () => {
		const dataset = aDataset({ researchers: [aResearcher({ id: "R0002", bio: "Radovan Čičić vodi inženjering." })] })

		const status = verifyQuote(dataset, aRef({ recordId: "R0002", field: "bio", quote: "Čičić vodi".normalize("NFD") }))

		expect(status).toBe("normalized")
	})

	it("rejects a quote with a changed word", () => {
		const dataset = aDataset({ publications: [aPublication({ abstract })] })

		const status = verifyQuote(dataset, aRef({ quote: "proved to be a backward simulation" }))

		expect(status).toBe("not_found")
	})

	it("rejects a quote stitched across two list elements", () => {
		const dataset = aDataset({ researchers: [aResearcher({ id: "R0001", keywords: ["proof assistants", "Coq"] })] })

		const status = verifyQuote(dataset, aRef({ recordId: "R0001", field: "keywords", quote: "assistants Coq" }))

		expect(status).toBe("not_found")
	})

	it("reports a quote that cites a record missing from the dataset", () => {
		const dataset = aDataset()

		const status = verifyQuote(dataset, aRef({ recordId: "SYN-PUB-99999", quote: "anything" }))

		expect(status).toBe("unknown_record")
	})

	it("reports a quote that cites another dataset version", () => {
		const dataset = aDataset({ publications: [aPublication({ abstract })] })

		const status = verifyQuote(dataset, aRef({ quote: "forward simulation", datasetVersion: "other@2" }))

		expect(status).toBe("version_mismatch")
	})
})
