import type { QualityFlag } from "../contracts/quality-flag"
import type { ScholarCard } from "../contracts/scholar-card"
import type { SourceRef } from "../contracts/source-ref"
import type { Dataset } from "../data/dataset"
import type { ResearcherRecord } from "../data/records/researcher-record"
import { searchableText } from "../data/searchable-text"
import { verifyAuthorship } from "../evidence/verify-authorship"

/* Matched against searchableText(), so Serbian Cyrillic and Latin profiles are read by the same patterns. */
const PHD_OPEN_PATTERN = /ph\.?\s?d|doctor|doktor/
const JOINT_PROJECT_OPEN_PATTERN = /joint|contract research|collaborat|zajednick|ugovor|saradn/
/* B's measured refusal phrasing plus explicit "not available for / will not / not seeking to" forms; a bare "not" is too loose ("not currently on sabbatical and supervises"). */
const PHD_DECLINED_PATTERN =
	/\b(not available to|cannot|can't|unable to|does not|is not in a position to|not able to|no longer)\b[^.;]{0,30}\b(formally )?(supervis\w*|serve as an? (phd|doctoral) supervisor)|\b(not available for|not for|will not|won't|not seeking to|not taking on)\b[^.;]{0,50}\b(supervis\w*|ph\.?\s?d students|doctoral students|new students)/
const JOINT_PROJECT_DECLINED_PATTERN = /\b(not|no longer|will not|won't)\b[^.;]{0,30}\b(join|take part|participate)\b[^.;]{0,30}\bproject|\bnot for [^.;]{0,20}project (participation|work|leadership)/
const LEFT_OR_RETIRED_PATTERN = /\bretired\b|left the university|u penziji|\bemerit/
const STILL_AVAILABLE_PATTERN = /\bavailable\b|consult|limited basis|part-time|occasional/
const EXPLICIT_REFUSAL_PATTERN = /not available|no longer|will not|won't/
/* A refusal naming one of these roles is that role's willingness, not general availability. */
const CONDITIONAL_LIMIT_PATTERN = /not available for/
const ROLE_SPECIFIC_PATTERN = /supervis|ph\.?\s?d|doctoral|students|teaching|project coordination|grant/
const EMERITUS_STATUS_ONLY = /^\W*(professor\s+)?emerit\w*(\s+status)?\W*$/
const SENTENCE_BOUNDARY = /(?<=[.!?])\s+(?=[\p{Lu}0-9"“(])/u

type Work = ScholarCard["works"][number]
type RoleWillingness = ScholarCard["participation"]["industrialPhdSupervision"]

/* Stand-in for A's card table: one deterministic ScholarCard per researcher, straight from the dataset. */
export function scholarCard(dataset: Dataset, researcherId: string, qualityFlags: ReadonlyArray<QualityFlag>): ScholarCard {
	const researcher = dataset.researchers.get(researcherId)
	if (researcher === undefined) {
		throw new Error(`scholarCard: unknown researcher ${researcherId}`)
	}
	const passage = (field: "bio" | "industry_experience" | "notes") => ({ recordId: researcher.id, field, text: researcher[field] })
	return {
		researcherId: researcher.id,
		name: researcher.name,
		faculty: researcher.faculty,
		department: researcher.department,
		fields: [...researcher.fields],
		keywords: [...researcher.keywords],
		openTo: [...researcher.open_to],
		bio: passage("bio"),
		industryExperience: passage("industry_experience"),
		notes: passage("notes"),
		works: confirmedWorks(dataset, researcher),
		participation: {
			industrialPhdSupervision: willingness(dataset.version, researcher, PHD_OPEN_PATTERN, PHD_DECLINED_PATTERN),
			jointProject: willingness(dataset.version, researcher, JOINT_PROJECT_OPEN_PATTERN, JOINT_PROJECT_DECLINED_PATTERN),
			availability: availability(dataset.version, researcher),
		},
		qualityFlags: [...qualityFlags],
	}
}

function confirmedWorks(dataset: Dataset, researcher: ResearcherRecord): Work[] {
	const isConfirmed = (workId: string) => verifyAuthorship(dataset, researcher.id, workId) === "confirmed"
	const works: Array<Work | undefined> = [
		...researcher.publications.filter(isConfirmed).map((id) => work(id, "publication", dataset.publications.get(id)?.title, "abstract", dataset.publications.get(id)?.abstract)),
		...researcher.projects.filter(isConfirmed).map((id) => work(id, "project", dataset.projects.get(id)?.title, "summary", dataset.projects.get(id)?.summary)),
		...researcher.patents.filter(isConfirmed).map((id) => work(id, "patent", dataset.patents.get(id)?.title, "abstract", dataset.patents.get(id)?.abstract)),
	]
	return works.filter((entry): entry is Work => entry !== undefined)
}

function work(recordId: string, kind: Work["kind"], title: string | undefined, field: string, body: string | undefined): Work | undefined {
	if (title === undefined || body === undefined || body.trim() === "") return undefined
	return { recordId, kind, title, body: { recordId, field, text: body } }
}

/* A refusal in the notes outweighs a generic open_to item; without either the status stays unknown. */
function willingness(datasetVersion: string, researcher: ResearcherRecord, openPattern: RegExp, declinedPattern: RegExp): RoleWillingness {
	const refusals = notesSentences(researcher).filter((sentence) => declinedPattern.test(searchableText(sentence)))
	if (refusals.length > 0) return { status: "declined", sources: refusals.map((quote) => notesSource(datasetVersion, researcher, quote)) }
	const sources = researcher.open_to
		.filter((item) => openPattern.test(searchableText(item)))
		.map((quote): SourceRef => ({ recordId: researcher.id, field: "open_to", quote, datasetVersion }))
	return sources.length > 0 ? { status: "open", sources } : { status: "unknown", sources: [] }
}

/* Only explicit statements in the notes count; a title such as Professor Emeritus says nothing about availability.
   Retiring or leaving alone leaves availability unknown; only a limit the researcher states makes it limited (a conditional
   "not available for ..." counts for anyone), and only a refusal not tied to one role (such as PhD supervision) makes it unavailable. */
function availability(datasetVersion: string, researcher: ResearcherRecord): ScholarCard["participation"]["availability"] {
	const sentences = notesSentences(researcher).map((sentence) => ({ sentence, folded: searchableText(sentence) }))
	const statements = sentences.filter(({ folded }) => LEFT_OR_RETIRED_PATTERN.test(folded) && !EMERITUS_STATUS_ONLY.test(folded))
	const generalRefusals = statements.filter(({ folded }) => EXPLICIT_REFUSAL_PATTERN.test(folded) && !ROLE_SPECIFIC_PATTERN.test(folded))
	if (generalRefusals.length > 0) return { status: "unavailable", sources: generalRefusals.map(({ sentence }) => notesSource(datasetVersion, researcher, sentence)) }
	const limits = sentences.filter(({ folded }) =>
		(CONDITIONAL_LIMIT_PATTERN.test(folded) && !ROLE_SPECIFIC_PATTERN.test(folded)) || (statements.length > 0 && STILL_AVAILABLE_PATTERN.test(folded)))
	if (limits.length === 0) return { status: "unknown", sources: [] }
	return { status: "limited", sources: limits.map(({ sentence }) => notesSource(datasetVersion, researcher, sentence)) }
}

function notesSentences(researcher: ResearcherRecord): string[] {
	return researcher.notes.split(SENTENCE_BOUNDARY).map((sentence) => sentence.trim()).filter((sentence) => sentence !== "")
}

function notesSource(datasetVersion: string, researcher: ResearcherRecord, quote: string): SourceRef {
	return { recordId: researcher.id, field: "notes", quote, datasetVersion }
}
