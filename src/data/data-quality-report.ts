import type { QualityFlag } from "../contracts/quality-flag"
import type { Dataset } from "./dataset"

export type DataQualityReport = {
	datasetVersion: string
	recordCounts: Readonly<Record<string, number>>
	researcherFlagCounts: Readonly<Record<QualityFlag, number>>
	publicationsWithoutAbstract: number
	researchersWithoutOpenTo: number
	facultySpellings: number
	nonEnglishCompanies: number
}

export function dataQualityReport(dataset: Dataset, flags: ReadonlyMap<string, ReadonlyArray<QualityFlag>>): DataQualityReport {
	const researchers = [...dataset.researchers.values()]
	const flagCounts: Record<QualityFlag, number> = {
		authorship_conflict: 0,
		duplicate_name: 0,
		missing_bio: 0,
		stale_profile: 0,
		non_english: 0,
	}
	for (const researcherFlags of flags.values()) {
		for (const flag of researcherFlags) flagCounts[flag] += 1
	}
	return {
		datasetVersion: dataset.version,
		recordCounts: {
			researchers: dataset.researchers.size,
			publications: dataset.publications.size,
			projects: dataset.projects.size,
			patents: dataset.patents.size,
			companies: dataset.companies.size,
			challenges: dataset.challenges.size,
			companyPages: dataset.companyPages.size,
		},
		researcherFlagCounts: flagCounts,
		publicationsWithoutAbstract: [...dataset.publications.values()].filter((publication) => publication.abstract.trim() === "").length,
		researchersWithoutOpenTo: researchers.filter((researcher) => researcher.open_to.length === 0).length,
		facultySpellings: new Set(researchers.map((researcher) => researcher.faculty)).size,
		nonEnglishCompanies: [...dataset.companies.values()].filter((company) => company.language !== "en").length,
	}
}
