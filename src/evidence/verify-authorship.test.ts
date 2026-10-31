import { describe, expect, it } from "vitest"
import { aDataset, aPublication, aResearcher } from "../test-support/dataset-builders"
import { verifyAuthorship } from "./verify-authorship"

const author = { name: "Natalija Fejsa", researcher_id: "R0001", affiliation: "UNS" }
const coAuthor = { name: "Boštjan Krajnc", researcher_id: null, affiliation: "Ljubljana" }

describe("verifyAuthorship", () => {
	it("confirms a publication listed by the profile and naming the researcher as author", () => {
		const dataset = aDataset({
			researchers: [aResearcher({ id: "R0001", publications: ["SYN-PUB-00001"] })],
			publications: [aPublication({ id: "SYN-PUB-00001", authors: [author, coAuthor] })],
		})

		expect(verifyAuthorship(dataset, "R0001", "SYN-PUB-00001")).toBe("confirmed")
	})

	it("flags a publication claimed by the profile but not naming the researcher as author", () => {
		const dataset = aDataset({
			researchers: [aResearcher({ id: "R0001", publications: ["SYN-PUB-00001"] })],
			publications: [aPublication({ id: "SYN-PUB-00001", authors: [coAuthor] })],
		})

		expect(verifyAuthorship(dataset, "R0001", "SYN-PUB-00001")).toBe("profile_only")
	})

	it("flags a publication naming the researcher but missing from the profile", () => {
		const dataset = aDataset({
			researchers: [aResearcher({ id: "R0001", publications: [] })],
			publications: [aPublication({ id: "SYN-PUB-00001", authors: [author] })],
		})

		expect(verifyAuthorship(dataset, "R0001", "SYN-PUB-00001")).toBe("record_only")
	})

	it("does not link a namesake whose author entry has no researcher id", () => {
		const namesake = { name: "Natalija Fejsa", researcher_id: null, affiliation: "Elsewhere" }
		const dataset = aDataset({
			researchers: [aResearcher({ id: "R0001", publications: [] })],
			publications: [aPublication({ id: "SYN-PUB-00001", authors: [namesake] })],
		})

		expect(verifyAuthorship(dataset, "R0001", "SYN-PUB-00001")).toBe("not_linked")
	})

	it("confirms a project through its participant list", () => {
		const project = {
			id: "SYN-PRJ-0001",
			acronym: "",
			title: "AGROSAT",
			programme: "Science Fund",
			years: "2022–2025",
			summary: "Satellite monitoring.",
			partners: [],
			participants: [{ researcher_id: "R0001", role: "principal investigator" }],
		}
		const dataset = aDataset({ researchers: [aResearcher({ id: "R0001", projects: ["SYN-PRJ-0001"] })], projects: [project] })

		expect(verifyAuthorship(dataset, "R0001", "SYN-PRJ-0001")).toBe("confirmed")
	})

	it("confirms a patent through its inventor list", () => {
		const patent = {
			id: "SYN-PAT-001",
			title: "Soil probe",
			year: 2021,
			status: "granted",
			abstract: "",
			inventors: [{ researcher_id: "R0001", name: "Natalija Fejsa" }],
		}
		const dataset = aDataset({ researchers: [aResearcher({ id: "R0001", patents: ["SYN-PAT-001"] })], patents: [patent] })

		expect(verifyAuthorship(dataset, "R0001", "SYN-PAT-001")).toBe("confirmed")
	})

	it.each([
		["an unknown researcher", "R9999", "SYN-PUB-00001"],
		["an unknown work", "R0001", "SYN-PUB-99999"],
	])("reports %s", (_description: string, researcherId: string, recordId: string) => {
		const dataset = aDataset({
			researchers: [aResearcher({ id: "R0001" })],
			publications: [aPublication({ id: "SYN-PUB-00001" })],
		})

		expect(verifyAuthorship(dataset, researcherId, recordId)).toBe("unknown_record")
	})
})
