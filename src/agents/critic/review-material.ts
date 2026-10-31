import type { SourceRef } from "../../contracts/source-ref"
import type { BusinessCard } from "../../contracts/business-card"
import type { Dataset } from "../../data/dataset"
import { sourceMaterial } from "../../evidence/source-material"

/* The Critic always sees the company's own words plus every passage the reviewed artifacts cite, never only their summaries. */
export function reviewMaterial(dataset: Dataset, task: Pick<BusinessCard, "taskId" | "companyId">, citedSources: ReadonlyArray<SourceRef>): string {
	const original = [
		{ recordId: task.taskId, field: "text" },
		{ recordId: task.taskId, field: "detail" },
		{ recordId: task.companyId, field: "rd_capacity" },
	]
	const cited = [...new Map(citedSources.map((source) => [`${source.recordId}.${source.field}`, source])).values()]
		.map((source) => ({ recordId: source.recordId, field: source.field }))
		.filter((location) => !original.some((known) => known.recordId === location.recordId && known.field === location.field))
	return [
		"Company's original challenge:",
		sourceMaterial(dataset, original),
		"",
		"Passages cited by the reviewed artifacts:",
		sourceMaterial(dataset, cited),
	].join("\n")
}
