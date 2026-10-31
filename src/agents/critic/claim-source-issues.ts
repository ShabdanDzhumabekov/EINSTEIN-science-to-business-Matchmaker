import type { CriticIssue } from "../../contracts/critic-issue"
import type { SourceRef } from "../../contracts/source-ref"
import type { SupportedClaim } from "../../contracts/supported-claim"
import type { Dataset } from "../../data/dataset"
import { verifyAuthorship } from "../../evidence/verify-authorship"
import { verifyQuote } from "../../evidence/verify-quote"

export type CheckedClaim = {
	claim: SupportedClaim
	owner: CriticIssue["owner"]
	researcherId?: string
	isCompetenceClaim: boolean
}

export function claimSourceIssues(dataset: Dataset, checkedClaims: ReadonlyArray<CheckedClaim>): ReadonlyArray<CriticIssue> {
	return checkedClaims.flatMap((checked) => {
		const sourceIssues = checked.claim.sources.flatMap((source) => issuesOfSource(dataset, checked, source))
		const isTitleOnly = checked.claim.sources.every((source) => source.field === "title")
		if (sourceIssues.length === 0 && checked.isCompetenceClaim && isTitleOnly) {
			return [
				anIssue(checked, "title_only_evidence", checked.claim.sources, "A title names a topic; it does not show the method or result."),
			]
		}
		return sourceIssues
	})
}

function issuesOfSource(dataset: Dataset, checked: CheckedClaim, source: SourceRef): ReadonlyArray<CriticIssue> {
	const quoteStatus = verifyQuote(dataset, source)
	if (quoteStatus === "not_found") {
		return [anIssue(checked, "quote_not_found", [source], `The quote is not in ${source.recordId}.${source.field}.`)]
	}
	if (quoteStatus !== "exact" && quoteStatus !== "normalized") {
		return [anIssue(checked, "unknown_source", [source], unresolvedExplanation(source, quoteStatus))]
	}
	if (checked.researcherId === undefined) {
		return []
	}
	const authorship = verifyAuthorship(dataset, checked.researcherId, source.recordId)
	if (authorship === "unknown_record" || authorship === "confirmed") {
		return []
	}
	return [
		anIssue(checked, "authorship_conflict", [source], `Authorship of ${source.recordId} by ${checked.researcherId} is ${authorship}.`),
	]
}

function anIssue(
	checked: CheckedClaim,
	category: CriticIssue["category"],
	sources: ReadonlyArray<SourceRef>,
	explanation: string,
): CriticIssue {
	return { category, severity: "blocking", claim: checked.claim.text, sources: [...sources], explanation, owner: checked.owner }
}

function unresolvedExplanation(source: SourceRef, quoteStatus: string): string {
	if (quoteStatus === "unknown_record") return `"${source.recordId}" is not a record id in the dataset.`
	if (quoteStatus === "unknown_field") return `"${source.field}" is not a quotable field of ${source.recordId}.`
	return `The source cites dataset version "${source.datasetVersion}", not the loaded one.`
}
