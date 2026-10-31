import { describe, expect, it } from "vitest"
import type { SearchQuery } from "../contracts/search-query"
import { aDataset, aPublication, aResearcher } from "../test-support/dataset-builders"
import { SearchIndex } from "./search-index"
import { searchCandidates } from "./search-candidates"

const anomalyQuery: SearchQuery = { kind: "methods", text: "unsupervised anomaly detection in network traffic" }
const wideLimits = { candidates: 20, reserve: 10 }

function aPublicationBy(researcherId: string, id: string, abstract: string) {
	return aPublication({ id, title: "Untitled", abstract, keywords: [], authors: [{ name: "X", researcher_id: researcherId, affiliation: "UNS" }] })
}

function aPlainResearcher(id: string, publications: ReadonlyArray<string> = []) {
	return aResearcher({ id, fields: [], keywords: [], bio: "", publications: [...publications] })
}

describe("searchCandidates", () => {
	it("ranks a researcher whose abstract matches the query above one with weaker overlap", () => {
		const dataset = aDataset({
			researchers: [aPlainResearcher("R0001", ["SYN-PUB-00001"]), aPlainResearcher("R0002", ["SYN-PUB-00002"])],
			publications: [
				aPublicationBy("R0001", "SYN-PUB-00001", "We study crop yield in network farms."),
				aPublicationBy("R0002", "SYN-PUB-00002", "Unsupervised anomaly detection on industrial network traffic."),
			],
		})

		const result = searchCandidates(new SearchIndex(dataset), "C001-CH1", [anomalyQuery], wideLimits)

		expect(result.candidates.map((candidate) => candidate.researcherId)).toEqual(["R0002", "R0001"])
	})

	it("leaves out researchers with no matching term", () => {
		const dataset = aDataset({
			researchers: [aPlainResearcher("R0001", ["SYN-PUB-00001"])],
			publications: [aPublicationBy("R0001", "SYN-PUB-00001", "Soil moisture probes for vineyards.")],
		})

		const result = searchCandidates(new SearchIndex(dataset), "C001-CH1", [anomalyQuery], wideLimits)

		expect(result.candidates).toEqual([])
	})

	it("explains a hit by query kind, matched terms and the record field it came from", () => {
		const dataset = aDataset({
			researchers: [aPlainResearcher("R0002", ["SYN-PUB-00002"])],
			publications: [aPublicationBy("R0002", "SYN-PUB-00002", "Anomaly detection without labels.")],
		})

		const [candidate] = searchCandidates(new SearchIndex(dataset), "C001-CH1", [anomalyQuery], wideLimits).candidates

		expect(candidate).toMatchObject({
			researcherId: "R0002",
			matchedQueryKinds: ["methods"],
			matchedTerms: ["anomaly", "detection"],
			hits: [{ recordId: "SYN-PUB-00002", field: "abstract" }],
		})
	})

	it("matches profile keywords regardless of Serbian diacritics", () => {
		const dataset = aDataset({ researchers: [aResearcher({ id: "R0003", keywords: ["mašinsko učenje"], bio: "" })] })

		const result = searchCandidates(new SearchIndex(dataset), "C001-CH1", [{ kind: "methods", text: "masinsko ucenje" }], wideLimits)

		expect(result.candidates.map((candidate) => candidate.researcherId)).toEqual(["R0003"])
	})

	it("moves candidates beyond the limit into the reserve", () => {
		const researchers = ["R0001", "R0002", "R0003"].map((id) => aResearcher({ id, keywords: ["anomaly detection"], bio: "" }))
		const dataset = aDataset({ researchers })

		const result = searchCandidates(new SearchIndex(dataset), "C001-CH1", [anomalyQuery], { candidates: 2, reserve: 1 })

		expect([result.candidates.length, result.reserve.length]).toEqual([2, 1])
	})

	it("counts a publication for every profiled co-author", () => {
		const coAuthored = aPublication({
			id: "SYN-PUB-00009",
			abstract: "Anomaly detection for substations.",
			authors: [
				{ name: "A", researcher_id: "R0001", affiliation: "UNS" },
				{ name: "B", researcher_id: "R0002", affiliation: "UNS" },
			],
		})
		const dataset = aDataset({
			researchers: [aPlainResearcher("R0001", ["SYN-PUB-00009"]), aPlainResearcher("R0002", ["SYN-PUB-00009"])],
			publications: [coAuthored],
		})

		const result = searchCandidates(new SearchIndex(dataset), "C001-CH1", [anomalyQuery], wideLimits)

		expect(result.candidates.map((candidate) => candidate.researcherId).sort()).toEqual(["R0001", "R0002"])
	})
})
