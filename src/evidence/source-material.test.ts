import { describe, expect, it } from "vitest"
import { aDataset, aResearcher } from "../test-support/dataset-builders"
import { sourceMaterial } from "./source-material"

describe("sourceMaterial", () => {
	it("labels every passage with the record and field to cite", () => {
		const dataset = aDataset({ researchers: [aResearcher({ id: "R0001", bio: "Works on Coq.", keywords: ["Coq", "Agda"] })] })

		const material = sourceMaterial(dataset, [
			{ recordId: "R0001", field: "bio" },
			{ recordId: "R0001", field: "keywords" },
		])

		expect(material).toBe("[R0001.bio] Works on Coq.\n[R0001.keywords] Coq\n[R0001.keywords] Agda")
	})

	it("skips empty passages and fields that cannot be resolved", () => {
		const dataset = aDataset({ researchers: [aResearcher({ id: "R0001", bio: " ", notes: "Retired." })] })

		const material = sourceMaterial(dataset, [
			{ recordId: "R0001", field: "bio" },
			{ recordId: "R0001", field: "notes" },
			{ recordId: "R9999", field: "bio" },
		])

		expect(material).toBe("[R0001.notes] Retired.")
	})
})
