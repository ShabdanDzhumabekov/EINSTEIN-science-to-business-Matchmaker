import { describe, expect, it } from "vitest"
import { aCompany, aDataset, aPublication, aResearcher } from "../test-support/dataset-builders"
import { dataQualityReport } from "./data-quality-report"

describe("dataQualityReport", () => {
	it("counts records, gaps and spelling variants", () => {
		const dataset = aDataset({
			researchers: [
				aResearcher({ id: "R0001", faculty: "Faculty of Technical Sciences" }),
				aResearcher({ id: "R0002", faculty: "Fakultet tehničkih nauka", open_to: [] }),
			],
			publications: [aPublication({ id: "SYN-PUB-00001", abstract: "" }), aPublication({ id: "SYN-PUB-00002" })],
			companies: [aCompany({ id: "C001", language: "sr" })],
		})
		const flags = new Map([
			["R0001", ["missing_bio" as const]],
			["R0002", ["missing_bio" as const, "non_english" as const]],
		])

		const report = dataQualityReport(dataset, flags)

		expect(report).toEqual({
			datasetVersion: dataset.version,
			recordCounts: { researchers: 2, publications: 2, projects: 0, patents: 0, companies: 1, challenges: 1, companyPages: 0 },
			researcherFlagCounts: { authorship_conflict: 0, duplicate_name: 0, missing_bio: 2, stale_profile: 0, non_english: 1 },
			publicationsWithoutAbstract: 1,
			researchersWithoutOpenTo: 1,
			facultySpellings: 2,
			nonEnglishCompanies: 1,
		})
	})
})
