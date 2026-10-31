import type { BusinessCard } from "../contracts/business-card"
import type { Dataset } from "../data/dataset"

/* Stand-in for A's card table: one deterministic BusinessCard per challenge, straight from the dataset. */
export function businessCard(dataset: Dataset, taskId: string): BusinessCard {
	const challenge = dataset.challenges.get(taskId)
	const company = challenge === undefined ? undefined : dataset.companies.get(challenge.companyId)
	if (challenge === undefined || company === undefined) {
		throw new Error(`businessCard: unknown task ${taskId}`)
	}
	const passage = (field: string, text: string) => ({ recordId: company.id, field, text })
	return {
		taskId,
		companyId: company.id,
		companyName: company.name,
		sector: company.sector,
		location: company.location,
		challenge: {
			text: { recordId: taskId, field: "text", text: challenge.text },
			detail: { recordId: taskId, field: "detail", text: challenge.detail },
		},
		company: {
			about: passage("about", company.about),
			products: company.products.map((item) => passage("products", item)),
			tech: company.tech.map((item) => passage("tech", item)),
			plans: passage("plans", company.plans),
			rdCapacity: passage("rd_capacity", company.rd_capacity),
			pastCollaborations: passage("past_collaborations", company.past_collaborations),
		},
	}
}
