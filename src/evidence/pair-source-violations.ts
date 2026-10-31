import type { BusinessCard } from "../contracts/business-card"
import type { CriticIssue } from "../contracts/critic-issue"
import type { ScholarCard } from "../contracts/scholar-card"
import type { SupportedClaim } from "../contracts/supported-claim"
import type { Dataset } from "../data/dataset"
import { claimSourceIssues } from "../agents/critic/claim-source-issues"

/* Until A supplies pairSourceIssues: quotes are checked against the dataset, and every source must belong to one side of the pair. */
export function pairSourceViolations(
	dataset: Dataset,
	business: BusinessCard,
	scholar: ScholarCard,
	claims: ReadonlyArray<SupportedClaim>,
	owner: CriticIssue["owner"],
): ReadonlyArray<string> {
	const scholarRecordIds = new Set([scholar.researcherId, ...scholar.works.map((work) => work.recordId)])
	const businessRecordIds = new Set([business.taskId, business.companyId])
	const isForeign = (source: { recordId: string }) => !scholarRecordIds.has(source.recordId) && !businessRecordIds.has(source.recordId)
	const foreignSources = claims.flatMap((claim) => claim.sources).filter(isForeign)
		.map((source) => `source ${source.recordId}.${source.field} belongs to neither ${business.taskId} nor ${scholar.researcherId}`)
	const sourceIssues = claimSourceIssues(dataset, claims.filter((claim) => !claim.sources.some(isForeign)).map((claim) => ({
		claim, owner,
		researcherId: claim.sources.some((source) => scholarRecordIds.has(source.recordId)) ? scholar.researcherId : undefined,
		isCompetenceClaim: claim.sources.every((source) => scholarRecordIds.has(source.recordId)),
	}))).map((issue) => `${issue.category}: ${issue.explanation}${companyFieldHint(business, issue)}`)
	return [...foreignSources, ...sourceIssues]
}

/* Roles often cite a company field under the task id; the fix is to name the company record, so say it. */
function companyFieldHint(business: BusinessCard, issue: CriticIssue): string {
	const source = issue.sources[0]
	const isCompanyFieldOnTask = issue.category === "unknown_source" && source?.recordId === business.taskId && !["text", "detail"].includes(source.field)
	return isCompanyFieldOnTask ? ` Company fields belong to the company record: use recordId "${business.companyId}", field "${source.field}"` : ""
}
