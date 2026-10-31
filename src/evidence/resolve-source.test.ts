import { describe, expect, it } from "vitest"
import { aCompany, aDataset, aPublication, aResearcher } from "../test-support/dataset-builders"
import { resolveSource } from "./resolve-source"

describe("resolveSource", () => {
	it("returns a text field of a publication as one passage", () => {
		const dataset = aDataset({ publications: [aPublication({ id: "SYN-PUB-00007", abstract: "Forward simulation." })] })

		const resolved = resolveSource(dataset, { recordId: "SYN-PUB-00007", field: "abstract" })

		expect(resolved).toEqual({ status: "resolved", passages: ["Forward simulation."] })
	})

	it("returns each element of a list field as its own passage", () => {
		const dataset = aDataset({ researchers: [aResearcher({ id: "R0042", keywords: ["Coq", "Agda"] })] })

		const resolved = resolveSource(dataset, { recordId: "R0042", field: "keywords" })

		expect(resolved).toEqual({ status: "resolved", passages: ["Coq", "Agda"] })
	})

	it("resolves a company challenge by its own id", () => {
		const company = aCompany({ id: "C002", challenges: [{ id: "C002-CH3", text: "Short.", detail: "Long detail." }] })
		const dataset = aDataset({ companies: [company] })

		const resolved = resolveSource(dataset, { recordId: "C002-CH3", field: "detail" })

		expect(resolved).toEqual({ status: "resolved", passages: ["Long detail."] })
	})

	it("resolves a company page by its derived id", () => {
		const firstPage = { company_id: "C001", kind: "website", title: "Home", date: "2024-01-01", text: "First." }
		const secondPage = { ...firstPage, kind: "job", title: "Hiring", text: "Second." }
		const dataset = aDataset({ companies: [aCompany()], companyPages: [firstPage, secondPage] })

		const resolved = resolveSource(dataset, { recordId: "C001-P2", field: "text" })

		expect(resolved).toEqual({ status: "resolved", passages: ["Second."] })
	})

	it("reports an id that is not in the dataset", () => {
		const dataset = aDataset()

		const resolved = resolveSource(dataset, { recordId: "R9999", field: "bio" })

		expect(resolved).toEqual({ status: "unknown_record" })
	})

	it.each([
		["a field that does not exist", "favourite_colour"],
		["a field that is not quotable evidence", "publications"],
	])("reports %s as unknown", (_description: string, field: string) => {
		const dataset = aDataset({ researchers: [aResearcher({ id: "R0001" })] })

		const resolved = resolveSource(dataset, { recordId: "R0001", field })

		expect(resolved).toEqual({ status: "unknown_field" })
	})
})
