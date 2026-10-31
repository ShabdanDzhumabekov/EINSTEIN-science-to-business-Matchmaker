import { describe, expect, it } from "vitest"
import type { SourceRef } from "../../contracts/source-ref"
import { aDataset, aPublication, aResearcher, TEST_DATASET_VERSION } from "../../test-support/dataset-builders"
import { claimSourceIssues } from "./claim-source-issues"

const author = { name: "Natalija Fejsa", researcher_id: "R0001", affiliation: "UNS" }

function aSource(overrides: Partial<SourceRef>): SourceRef {
	return { recordId: "SYN-PUB-00001", field: "abstract", quote: "forward simulation", datasetVersion: TEST_DATASET_VERSION, ...overrides }
}

function aDatasetWithAuthoredPublication() {
	return aDataset({
		researchers: [aResearcher({ id: "R0001", publications: ["SYN-PUB-00001"] })],
		publications: [aPublication({ id: "SYN-PUB-00001", abstract: "The allocator is a forward simulation.", authors: [author] })],
	})
}

function issueCategories(sources: ReadonlyArray<SourceRef>, isCompetenceClaim = true): ReadonlyArray<string> {
	const issues = claimSourceIssues(aDatasetWithAuthoredPublication(), [
		{ claim: { text: "Builds verified compilers.", sources: [...sources] }, owner: "researcher", researcherId: "R0001", isCompetenceClaim },
	])
	return issues.map((issue) => `${issue.category}:${issue.severity}`)
}

describe("claimSourceIssues", () => {
	it("accepts a competence claim quoted from an abstract the researcher authored", () => {
		expect(issueCategories([aSource({})])).toEqual([])
	})

	it("blocks a quote that is not in the cited field", () => {
		expect(issueCategories([aSource({ quote: "backward simulation" })])).toEqual(["quote_not_found:blocking"])
	})

	it("blocks a source that does not exist", () => {
		expect(issueCategories([aSource({ recordId: "SYN-PUB-99999" })])).toEqual(["unknown_source:blocking"])
	})

	it("blocks a work the researcher is not confirmed to have authored", () => {
		const dataset = aDataset({
			researchers: [aResearcher({ id: "R0001", publications: ["SYN-PUB-00001"] })],
			publications: [aPublication({ id: "SYN-PUB-00001", abstract: "The allocator is a forward simulation.", authors: [] })],
		})

		const issues = claimSourceIssues(dataset, [
			{ claim: { text: "Builds verified compilers.", sources: [aSource({})] }, owner: "researcher", researcherId: "R0001", isCompetenceClaim: true },
		])

		expect(issues.map((issue) => issue.category)).toEqual(["authorship_conflict"])
	})

	it("blocks a competence claim backed only by publication titles", () => {
		expect(issueCategories([aSource({ field: "title", quote: "Coq Formalization" })])).toEqual(["title_only_evidence:blocking"])
	})

	it("accepts a title as evidence for a claim that is not about competence", () => {
		expect(issueCategories([aSource({ field: "title", quote: "Coq Formalization" })], false)).toEqual([])
	})

	it("assigns the fix to the role that made the claim", () => {
		const issues = claimSourceIssues(aDatasetWithAuthoredPublication(), [
			{ claim: { text: "Needs a method.", sources: [aSource({ quote: "missing" })] }, owner: "industry_analyst", isCompetenceClaim: false },
		])

		expect(issues.map((issue) => issue.owner)).toEqual(["industry_analyst"])
	})
})
