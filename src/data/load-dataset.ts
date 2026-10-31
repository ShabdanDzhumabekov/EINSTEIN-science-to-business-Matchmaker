import { readFileSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import { Dataset } from "./dataset"
import { CompanyPageRecord } from "./records/company-page-record"
import { CompanyRecord } from "./records/company-record"
import { PatentRecord } from "./records/patent-record"
import { ProjectRecord } from "./records/project-record"
import { PublicationRecord } from "./records/publication-record"
import { ResearcherRecord } from "./records/researcher-record"

export const DATASET_VERSION = "einstein-matchmaker-data@4fb99b3"

const EXPECTED_SCHEMA_VERSION = "2.0"

export function loadDataset(directory: string): Dataset {
	return new Dataset(DATASET_VERSION, {
		researchers: wrappedRecords(directory, "researchers.json", "researchers", ResearcherRecord),
		publications: lineRecords(directory, "publications.jsonl", PublicationRecord),
		projects: wrappedRecords(directory, "projects.json", "projects", ProjectRecord),
		patents: wrappedRecords(directory, "patents.json", "patents", PatentRecord),
		companies: wrappedRecords(directory, "companies.json", "companies", CompanyRecord),
		companyPages: lineRecords(directory, "company-pages.jsonl", CompanyPageRecord),
	})
}

function wrappedRecords<Record>(
	directory: string,
	fileName: string,
	key: string,
	recordSchema: z.ZodType<Record>,
): ReadonlyArray<Record> {
	const wrapper = z.object({ version: z.string(), [key]: z.array(z.unknown()) })
	const file = parsed(fileName, wrapper, JSON.parse(readFileSync(join(directory, fileName), "utf-8")))
	if (file.version !== EXPECTED_SCHEMA_VERSION) {
		throw new Error(`${fileName}: expected dataset version ${EXPECTED_SCHEMA_VERSION}, found version ${file.version}`)
	}
	return parsed(fileName, z.array(recordSchema), file[key])
}

function lineRecords<Record>(directory: string, fileName: string, recordSchema: z.ZodType<Record>): ReadonlyArray<Record> {
	const lines = readFileSync(join(directory, fileName), "utf-8")
		.split("\n")
		.filter((line) => line.trim() !== "")
	return parsed(fileName, z.array(recordSchema), lines.map((line) => JSON.parse(line)))
}

function parsed<Output>(fileName: string, schema: z.ZodType<Output>, raw: unknown): Output {
	const result = schema.safeParse(raw)
	if (!result.success) {
		throw new Error(`${fileName}: ${z.prettifyError(result.error)}`)
	}
	return result.data
}
