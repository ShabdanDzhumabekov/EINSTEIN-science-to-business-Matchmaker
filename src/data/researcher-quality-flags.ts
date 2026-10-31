import type { QualityFlag } from "../contracts/quality-flag"
import { verifyAuthorship } from "../evidence/verify-authorship"
import type { Dataset } from "./dataset"
import type { ResearcherRecord } from "./records/researcher-record"
import { searchableText } from "./searchable-text"

/* Hints for Researcher and Critic only: availability itself is decided from an explicit quote, not from these flags. */
const STALE_PROFILE_PATTERN = /\bemerit|\bretired\b|left the university|u penziji|у пензији/i

export function researcherQualityFlags(dataset: Dataset): ReadonlyMap<string, ReadonlyArray<QualityFlag>> {
	const profileCountByName = new Map<string, number>()
	for (const researcher of dataset.researchers.values()) {
		const nameKey = comparableName(researcher.name)
		profileCountByName.set(nameKey, (profileCountByName.get(nameKey) ?? 0) + 1)
	}
	return new Map(
		[...dataset.researchers.values()].map((researcher) => {
			const isNameShared = (profileCountByName.get(comparableName(researcher.name)) ?? 0) > 1
			return [researcher.id, flagsOf(dataset, researcher, isNameShared)]
		}),
	)
}

function flagsOf(dataset: Dataset, researcher: ResearcherRecord, isNameShared: boolean): ReadonlyArray<QualityFlag> {
	const flags: QualityFlag[] = []
	if (hasAuthorshipConflict(dataset, researcher)) flags.push("authorship_conflict")
	if (isNameShared) flags.push("duplicate_name")
	if (researcher.bio.trim() === "") flags.push("missing_bio")
	if (STALE_PROFILE_PATTERN.test(`${researcher.title}\n${researcher.notes}`)) flags.push("stale_profile")
	if (researcher.language !== "en") flags.push("non_english")
	return flags
}

function hasAuthorshipConflict(dataset: Dataset, researcher: ResearcherRecord): boolean {
	return [...researcher.publications, ...researcher.projects, ...researcher.patents].some(
		(workId) => verifyAuthorship(dataset, researcher.id, workId) !== "confirmed",
	)
}

function comparableName(name: string): string {
	return searchableText(name).split(/\s+/).filter(Boolean).sort().join(" ")
}
