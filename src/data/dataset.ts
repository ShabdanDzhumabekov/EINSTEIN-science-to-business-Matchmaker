import type { ChallengeRecord } from "./records/challenge-record"
import type { CompanyPageRecord } from "./records/company-page-record"
import type { CompanyRecord } from "./records/company-record"
import type { PatentRecord } from "./records/patent-record"
import type { ProjectRecord } from "./records/project-record"
import type { PublicationRecord } from "./records/publication-record"
import type { ResearcherRecord } from "./records/researcher-record"

export type CompanyPage = CompanyPageRecord & { id: string }

export type Challenge = ChallengeRecord & { companyId: string }

export type DatasetRecords = {
	researchers: ReadonlyArray<ResearcherRecord>
	publications: ReadonlyArray<PublicationRecord>
	projects: ReadonlyArray<ProjectRecord>
	patents: ReadonlyArray<PatentRecord>
	companies: ReadonlyArray<CompanyRecord>
	companyPages: ReadonlyArray<CompanyPageRecord>
}

export class Dataset {
	readonly researchers: ReadonlyMap<string, ResearcherRecord>
	readonly publications: ReadonlyMap<string, PublicationRecord>
	readonly projects: ReadonlyMap<string, ProjectRecord>
	readonly patents: ReadonlyMap<string, PatentRecord>
	readonly companies: ReadonlyMap<string, CompanyRecord>
	readonly challenges: ReadonlyMap<string, Challenge>
	readonly companyPages: ReadonlyMap<string, CompanyPage>

	constructor(
		readonly version: string,
		records: DatasetRecords,
	) {
		this.researchers = byId(records.researchers)
		this.publications = byId(records.publications)
		this.projects = byId(records.projects)
		this.patents = byId(records.patents)
		this.companies = byId(records.companies)
		this.challenges = byId(
			records.companies.flatMap((company) =>
				company.challenges.map((challenge) => ({ ...challenge, companyId: company.id })),
			),
		)
		this.companyPages = byId(numberedPages(records.companyPages))
	}
}

function byId<Entry extends { id: string }>(entries: ReadonlyArray<Entry>): ReadonlyMap<string, Entry> {
	return new Map(entries.map((entry) => [entry.id, entry]))
}

/* Pages have no id in the source; the n-th page of a company (in file order, from 1) becomes `C001-P<n>`. */
function numberedPages(pages: ReadonlyArray<CompanyPageRecord>): ReadonlyArray<CompanyPage> {
	const pageCountByCompany = new Map<string, number>()
	return pages.map((page) => {
		const pageNumber = (pageCountByCompany.get(page.company_id) ?? 0) + 1
		pageCountByCompany.set(page.company_id, pageNumber)
		return { ...page, id: `${page.company_id}-P${pageNumber}` }
	})
}
