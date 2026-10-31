import { Dataset, type DatasetRecords } from "../data/dataset"
import type { CompanyRecord } from "../data/records/company-record"
import type { PublicationRecord } from "../data/records/publication-record"
import type { ResearcherRecord } from "../data/records/researcher-record"

export const TEST_DATASET_VERSION = "test-dataset@1"

export function aResearcher(overrides: Partial<ResearcherRecord> = {}): ResearcherRecord {
	return {
		id: "R0001",
		name: "Natalija Fejsa",
		title: "Assistant Professor",
		institution: "University of Novi Sad",
		faculty: "Faculty of Sciences",
		department: "Department of Mathematics and Informatics",
		fields: ["Formal Methods and Program Verification"],
		keywords: ["proof assistants", "Coq"],
		bio: "Her group works on mechanically verified compilers.",
		publications: [],
		projects: [],
		patents: [],
		open_to: ["joint projects with companies requiring formal correctness guarantees"],
		industry_experience: "",
		notes: "",
		language: "en",
		...overrides,
	}
}

export function aPublication(overrides: Partial<PublicationRecord> = {}): PublicationRecord {
	return {
		id: "SYN-PUB-00001",
		title: "A Coq Formalization of a Simple Register-Allocation Pass",
		abstract: "The allocator is proved to be a forward simulation.",
		year: 2013,
		venue: "CPP 2013",
		type: "conference",
		keywords: ["register allocation"],
		authors: [],
		...overrides,
	}
}

export function aCompany(overrides: Partial<CompanyRecord> = {}): CompanyRecord {
	return {
		id: "C001",
		name: "ArmaturaSec d.o.o.",
		sector: "Cybersecurity",
		employees: 67,
		founded: 2008,
		location: "Zrenjanin",
		about: "We build network security hardware.",
		products: ["NetGuard-OT: network access control appliance"],
		tech: ["Embedded Linux"],
		challenges: [{ id: "C001-CH1", text: "Detect anomalies without labels.", detail: "We have no attack examples." }],
		plans: "",
		rd_capacity: "One engineer part-time.",
		past_collaborations: "",
		language: "en",
		...overrides,
	}
}

export function aDataset(records: Partial<DatasetRecords> = {}): Dataset {
	return new Dataset(TEST_DATASET_VERSION, {
		researchers: [],
		publications: [],
		projects: [],
		patents: [],
		companies: [],
		companyPages: [],
		...records,
	})
}
