import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { aCompany, aPublication, aResearcher } from "../test-support/dataset-builders"
import { DATASET_VERSION, loadDataset } from "./load-dataset"

function aDatasetDirectory(overrides: { researchersFileVersion?: string; researchers?: ReadonlyArray<object> } = {}): string {
	const directory = mkdtempSync(join(tmpdir(), "einstein-dataset-"))
	const wrapped = (key: string, records: ReadonlyArray<object>, version = "2.0") =>
		JSON.stringify({ name: "test", version, note: "synthetic", [key]: records })
	const page = { company_id: "C001", kind: "website", title: "Home", date: "2024-01-01", text: "Hello." }
	writeFileSync(
		join(directory, "researchers.json"),
		wrapped("researchers", overrides.researchers ?? [aResearcher()], overrides.researchersFileVersion),
	)
	writeFileSync(join(directory, "publications.jsonl"), `${JSON.stringify(aPublication())}\n`)
	writeFileSync(join(directory, "projects.json"), wrapped("projects", []))
	writeFileSync(join(directory, "patents.json"), wrapped("patents", []))
	writeFileSync(join(directory, "companies.json"), wrapped("companies", [aCompany()]))
	writeFileSync(join(directory, "company-pages.jsonl"), `${JSON.stringify(page)}\n`)
	return directory
}

describe("loadDataset", () => {
	it("loads every record kind under the pinned dataset version", () => {
		const directory = aDatasetDirectory()

		const dataset = loadDataset(directory)

		expect({
			version: dataset.version,
			researcherIds: [...dataset.researchers.keys()],
			publicationIds: [...dataset.publications.keys()],
			challengeIds: [...dataset.challenges.keys()],
			pageIds: [...dataset.companyPages.keys()],
		}).toEqual({
			version: DATASET_VERSION,
			researcherIds: ["R0001"],
			publicationIds: ["SYN-PUB-00001"],
			challengeIds: ["C001-CH1"],
			pageIds: ["C001-P1"],
		})
	})

	it("refuses a dataset file of another schema version", () => {
		const directory = aDatasetDirectory({ researchersFileVersion: "3.0" })

		expect(() => loadDataset(directory)).toThrow(/researchers\.json.*version 3\.0/)
	})

	it("refuses a record that breaks the schema and names it", () => {
		const directory = aDatasetDirectory({ researchers: [{ ...aResearcher(), fields: "not a list" }] })

		expect(() => loadDataset(directory)).toThrow(/researchers\.json/)
	})
})
