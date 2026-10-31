import type { BusinessCard } from "../contracts/business-card"
import type { Passage } from "../contracts/passage"
import type { ScholarCard } from "../contracts/scholar-card"

/* Both cards rendered as labelled passages; a role cites them as [recordId.field] plus an exact quote. */
export function cardPassages(business: BusinessCard, scholar: ScholarCard): ReadonlyArray<string> {
	const { challenge, company } = business
	const labelled = (passages: ReadonlyArray<Passage>) => passages.filter((passage) => passage.text.trim() !== "").map((passage) => `[${passage.recordId}.${passage.field}] ${passage.text}`)
	return [
		`Company task ${business.taskId}: ${business.companyName} (${business.sector}, ${business.location})`,
		...labelled([challenge.text, challenge.detail, company.about, ...company.products, ...company.tech, company.plans, company.rdCapacity, company.pastCollaborations]),
		"",
		`Researcher ${scholar.researcherId}: ${scholar.name}, ${scholar.faculty}, ${scholar.department}`,
		`Fields: ${scholar.fields.join("; ")}. Keywords: ${scholar.keywords.join("; ")}.`,
		`Participation (decided by code from open_to and notes): ${JSON.stringify(scholar.participation)}`,
		`Quality flags: ${scholar.qualityFlags.join(", ") || "none"}`,
		...labelled([scholar.bio, scholar.industryExperience, scholar.notes]),
		...scholar.works.flatMap((work) => [`${work.kind} ${work.recordId}: ${work.title}`, ...labelled([work.body])]),
	]
}
