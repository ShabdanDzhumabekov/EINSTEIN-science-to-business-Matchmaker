import type { z } from "zod"
import type { RoleInference } from "../../contracts/role-inference"
import { TaskCard } from "../../contracts/task-card"
import type { Dataset } from "../../data/dataset"
import type { SourceLocation } from "../../evidence/resolve-source"
import { sourceMaterial } from "../../evidence/source-material"
import { claimSourceIssues } from "../critic/claim-source-issues"
import { verifiedInference } from "../verified-inference"
import { withDatasetVersion } from "../with-dataset-version"
import { INDUSTRY_INSTRUCTION } from "./industry-instruction"

const ModelTaskCard = TaskCard.omit({ taskId: true, companyId: true })

type ModelTaskCard = z.infer<typeof ModelTaskCard>

const COMPANY_FIELDS = ["about", "products", "tech", "plans", "rd_capacity", "past_collaborations"] as const

export async function analyzeIndustry(inference: RoleInference, dataset: Dataset, taskId: string): Promise<TaskCard> {
	const challenge = dataset.challenges.get(taskId)
	const company = challenge === undefined ? undefined : dataset.companies.get(challenge.companyId)
	if (challenge === undefined || company === undefined) {
		throw new Error(`analyzeIndustry: unknown task ${taskId}`)
	}
	const pageIds = [...dataset.companyPages.values()].filter((page) => page.company_id === company.id).map((page) => page.id)
	const locations: ReadonlyArray<SourceLocation> = [
		{ recordId: taskId, field: "text" },
		{ recordId: taskId, field: "detail" },
		...COMPANY_FIELDS.map((field) => ({ recordId: company.id, field })),
		...pageIds.flatMap((pageId) => [
			{ recordId: pageId, field: "title" },
			{ recordId: pageId, field: "text" },
		]),
	]
	const input = [
		`datasetVersion: ${dataset.version}`,
		`Company: ${company.name} (${company.sector}, ${company.employees} employees, ${company.location})`,
		`Challenge to analyse: ${taskId}`,
		"",
		"Material:",
		sourceMaterial(dataset, locations),
	].join("\n")
	const completed = (modelCard: ModelTaskCard): TaskCard => ({
		...modelCard,
		taskId,
		companyId: company.id,
		problem: withDatasetVersion(modelCard.problem, dataset.version),
		goal: withDatasetVersion(modelCard.goal, dataset.version),
		constraints: modelCard.constraints.map((claim) => withDatasetVersion(claim, dataset.version)),
		resources: modelCard.resources.map((claim) => withDatasetVersion(claim, dataset.version)),
	})
	const sourceIssues = (card: TaskCard) =>
		claimSourceIssues(
			dataset,
			[card.problem, card.goal, ...card.constraints, ...card.resources].map((claim) => ({
				claim,
				owner: "industry_analyst" as const,
				isCompetenceClaim: false,
			})),
		)
	return verifiedInference(
		inference,
		{ role: "industry_analyst", instruction: INDUSTRY_INSTRUCTION, input, output: { name: "task_card", schema: ModelTaskCard } },
		completed,
		sourceIssues,
	)
}
