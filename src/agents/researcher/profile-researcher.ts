import type { z } from "zod"
import type { CriticIssue } from "../../contracts/critic-issue"
import type { QualityFlag } from "../../contracts/quality-flag"
import { ResearcherCard } from "../../contracts/researcher-card"
import type { RoleInference } from "../../contracts/role-inference"
import type { SourceRef } from "../../contracts/source-ref"
import type { Dataset } from "../../data/dataset"
import type { ResearcherRecord } from "../../data/records/researcher-record"
import type { SourceLocation } from "../../evidence/resolve-source"
import { sourceMaterial } from "../../evidence/source-material"
import { verifyAuthorship } from "../../evidence/verify-authorship"
import { claimSourceIssues } from "../critic/claim-source-issues"
import { verifiedInference } from "../verified-inference"
import { withDatasetVersion } from "../with-dataset-version"
import { RESEARCHER_INSTRUCTION } from "./researcher-instruction"

export type ResearcherProfileRequest = {
	researcherId: string
	qualityFlags: ReadonlyArray<QualityFlag>
}

const ModelResearcherCard = ResearcherCard.omit({ researcherId: true, qualityFlags: true })

type ModelResearcherCard = z.infer<typeof ModelResearcherCard>

type Participation = ResearcherCard["participation"]

const PROFILE_FIELDS = ["title", "fields", "keywords", "bio", "open_to", "industry_experience", "notes"] as const

export async function profileResearcher(
	inference: RoleInference,
	dataset: Dataset,
	request: ResearcherProfileRequest,
): Promise<ResearcherCard> {
	const researcher = dataset.researchers.get(request.researcherId)
	if (researcher === undefined) {
		throw new Error(`profileResearcher: unknown researcher ${request.researcherId}`)
	}
	const completed = (modelCard: ModelResearcherCard): ResearcherCard => ({
		...modelCard,
		researcherId: researcher.id,
		qualityFlags: [...request.qualityFlags],
		methods: modelCard.methods.map((claim) => withDatasetVersion(claim, dataset.version)),
		participation: participationWithVersion(modelCard.participation, dataset.version),
	})
	return verifiedInference(
		inference,
		{
			role: "researcher",
			instruction: RESEARCHER_INSTRUCTION,
			input: researcherInput(dataset, researcher),
			output: { name: "researcher_card", schema: ModelResearcherCard },
		},
		completed,
		(card) => cardIssues(dataset, card),
	)
}

function researcherInput(dataset: Dataset, researcher: ResearcherRecord): string {
	const confirmedWorks = (workIds: ReadonlyArray<string>) =>
		workIds.filter((workId) => verifyAuthorship(dataset, researcher.id, workId) === "confirmed")
	const unconfirmedWorks = [...researcher.publications, ...researcher.projects, ...researcher.patents].filter(
		(workId) => verifyAuthorship(dataset, researcher.id, workId) !== "confirmed",
	)
	const locations: ReadonlyArray<SourceLocation> = [
		...PROFILE_FIELDS.map((field) => ({ recordId: researcher.id, field })),
		...confirmedWorks(researcher.publications).flatMap((id) =>
			["title", "abstract", "keywords"].map((field) => ({ recordId: id, field })),
		),
		...confirmedWorks(researcher.projects).flatMap((id) => ["title", "summary"].map((field) => ({ recordId: id, field }))),
		...confirmedWorks(researcher.patents).flatMap((id) => ["title", "abstract"].map((field) => ({ recordId: id, field }))),
	]
	return [
		`datasetVersion: ${dataset.version}`,
		`Researcher: ${researcher.id} ${researcher.name}, ${researcher.faculty}, ${researcher.department}`,
		"",
		"Citable material:",
		sourceMaterial(dataset, locations),
		...(unconfirmedWorks.length > 0
			? ["", `Listed on the profile but authorship unconfirmed, do not use: ${unconfirmedWorks.join(", ")}`]
			: []),
	].join("\n")
}

function participationWithVersion(participation: Participation, datasetVersion: string): Participation {
	const versioned = (sources: ReadonlyArray<SourceRef>) => sources.map((source) => ({ ...source, datasetVersion }))
	return {
		industrialPhdSupervision: { ...participation.industrialPhdSupervision, sources: versioned(participation.industrialPhdSupervision.sources) },
		jointProject: { ...participation.jointProject, sources: versioned(participation.jointProject.sources) },
		availability: { ...participation.availability, sources: versioned(participation.availability.sources) },
	}
}

function cardIssues(dataset: Dataset, card: ResearcherCard): ReadonlyArray<CriticIssue> {
	const participationEntries = Object.entries(card.participation)
	const statedWithoutSource: ReadonlyArray<CriticIssue> = participationEntries
		.filter(([, entry]) => entry.status !== "unknown" && entry.sources.length === 0)
		.map(([aspect, entry]) => ({
			category: "participation_misstated",
			severity: "blocking",
			claim: `${aspect}: ${entry.status}`,
			sources: [],
			explanation: `A ${entry.status} status needs a quote; otherwise use "unknown".`,
			owner: "researcher",
		}))
	const quotedClaims = [
		...card.methods.map((claim) => ({ claim, owner: "researcher" as const, researcherId: card.researcherId, isCompetenceClaim: true })),
		...participationEntries
			.filter(([, entry]) => entry.sources.length > 0)
			.map(([aspect, entry]) => ({
				claim: { text: `${aspect}: ${entry.status}`, sources: entry.sources },
				owner: "researcher" as const,
				isCompetenceClaim: false,
			})),
	]
	return [...statedWithoutSource, ...claimSourceIssues(dataset, quotedClaims)]
}
