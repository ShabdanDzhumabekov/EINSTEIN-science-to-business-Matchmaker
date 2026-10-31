import { describe, expect, it } from "vitest"
import { aDataset, aPublication, aResearcher } from "../test-support/dataset-builders"
import { researcherQualityFlags } from "./researcher-quality-flags"

describe("researcherQualityFlags", () => {
	it("flags a profile listing a publication that does not name the researcher", () => {
		const dataset = aDataset({
			researchers: [aResearcher({ id: "R0139", publications: ["SYN-PUB-01827"] })],
			publications: [aPublication({ id: "SYN-PUB-01827", authors: [] })],
		})

		expect(researcherQualityFlags(dataset).get("R0139")).toEqual(["authorship_conflict"])
	})

	it("flags both profiles sharing a name across word order and script without merging them", () => {
		const dataset = aDataset({
			researchers: [
				aResearcher({ id: "R0139", name: "Jeremić Mirjana" }),
				aResearcher({ id: "R0539", name: "Мирјана Јеремић" }),
			],
		})

		const flags = researcherQualityFlags(dataset)

		expect([flags.get("R0139"), flags.get("R0539")]).toEqual([["duplicate_name"], ["duplicate_name"]])
	})

	it.each([
		["an empty bio", { bio: "  " }, "missing_bio"],
		["a profile written in Serbian", { language: "sr-Cyrl" }, "non_english"],
		["an emeritus title", { title: "Professor Emeritus" }, "stale_profile"],
		["a note saying the researcher retired", { notes: "Professor Paunović is retired and consults only." }, "stale_profile"],
		["a note saying the researcher left", { notes: "She left the university in 2023." }, "stale_profile"],
	])("flags %s", (_description: string, overrides: object, flag: string) => {
		const dataset = aDataset({ researchers: [aResearcher({ id: "R0001", ...overrides })] })

		expect(researcherQualityFlags(dataset).get("R0001")).toEqual([flag])
	})

	it("does not treat a sabbatical note as a stale profile", () => {
		const dataset = aDataset({ researchers: [aResearcher({ id: "R0001", notes: "On sabbatical until March 2026." })] })

		expect(researcherQualityFlags(dataset).get("R0001")).toEqual([])
	})
})
