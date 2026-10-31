import type { Dataset } from "../data/dataset"
import type { ResearcherRecord } from "../data/records/researcher-record"

export type AuthorshipStatus = "confirmed" | "profile_only" | "record_only" | "not_linked" | "unknown_record"

type WorkLink = { isListedByProfile: boolean; isNamedByRecord: boolean }

export function verifyAuthorship(dataset: Dataset, researcherId: string, recordId: string): AuthorshipStatus {
	const researcher = dataset.researchers.get(researcherId)
	if (researcher === undefined) {
		return "unknown_record"
	}
	const link = workLink(dataset, researcher, recordId)
	if (link === undefined) {
		return "unknown_record"
	}
	if (link.isListedByProfile && link.isNamedByRecord) {
		return "confirmed"
	}
	if (link.isListedByProfile) {
		return "profile_only"
	}
	if (link.isNamedByRecord) {
		return "record_only"
	}
	return "not_linked"
}

function workLink(dataset: Dataset, researcher: ResearcherRecord, recordId: string): WorkLink | undefined {
	const publication = dataset.publications.get(recordId)
	if (publication !== undefined) {
		return {
			isListedByProfile: researcher.publications.includes(recordId),
			isNamedByRecord: publication.authors.some((author) => author.researcher_id === researcher.id),
		}
	}
	const project = dataset.projects.get(recordId)
	if (project !== undefined) {
		return {
			isListedByProfile: researcher.projects.includes(recordId),
			isNamedByRecord: project.participants.some((participant) => participant.researcher_id === researcher.id),
		}
	}
	const patent = dataset.patents.get(recordId)
	if (patent !== undefined) {
		return {
			isListedByProfile: researcher.patents.includes(recordId),
			isNamedByRecord: patent.inventors.some((inventor) => inventor.researcher_id === researcher.id),
		}
	}
	return undefined
}
