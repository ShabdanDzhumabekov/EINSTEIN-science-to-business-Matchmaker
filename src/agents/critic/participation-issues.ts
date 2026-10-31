import type { CollaborationFormat } from "../../contracts/collaboration-format"
import type { CriticIssue } from "../../contracts/critic-issue"
import type { ScholarCard } from "../../contracts/scholar-card"

export function participationIssues(
	format: CollaborationFormat,
	card: Pick<ScholarCard, "researcherId" | "participation">,
	owner: CriticIssue["owner"],
): ReadonlyArray<CriticIssue> {
	const willingness =
		format === "industrial_phd" ? card.participation.industrialPhdSupervision : card.participation.jointProject
	const issues: CriticIssue[] = []
	if (willingness.status === "declined") {
		issues.push({
			category: "participation_misstated",
			severity: "blocking",
			claim: `format: ${format}`,
			sources: willingness.sources,
			explanation: `The researcher explicitly declined this role; choose another format or another researcher.`,
			owner,
		})
	}
	if (card.participation.availability.status === "unavailable") {
		issues.push({
			category: "participation_misstated",
			severity: "blocking",
			claim: `researcher ${card.researcherId} is available`,
			sources: card.participation.availability.sources,
			explanation: "The researcher material says they are unavailable for such work.",
			owner,
		})
	}
	return issues
}
