import { describe, expect, it } from "vitest"
import { aCompany, aDataset } from "../../test-support/dataset-builders"
import { FakeRoleInference } from "../../test-support/fake-role-inference"
import { UnverifiedSourcesError } from "../verified-inference"
import { analyzeIndustry } from "./analyze-industry"

const detail = "We have plenty of normal traffic but nothing labelled as malicious."

function aCompanyDataset() {
	return aDataset({
		companies: [aCompany({ id: "C001", challenges: [{ id: "C001-CH1", text: "Detect anomalies without labels.", detail }] })],
	})
}

function aModelCard(quote: string) {
	const source = { recordId: "C001-CH1", field: "detail", quote, datasetVersion: "made-up" }
	const claim = { text: "No labelled attacks exist.", sources: [source] }
	return {
		problem: claim,
		goal: claim,
		constraints: [claim],
		resources: [],
		unknowns: ["budget"],
		researchFit: { kind: "research_problem", reason: "Open method question." },
		searchQueries: [{ kind: "methods", text: "unsupervised anomaly detection" }],
	}
}

describe("analyzeIndustry", () => {
	it("sends the challenge detail to the model as citable material", async () => {
		const inference = new FakeRoleInference([aModelCard("nothing labelled as malicious")])

		await analyzeIndustry(inference, aCompanyDataset(), "C001-CH1")

		expect(inference.requests[0]?.input).toContain(`[C001-CH1.detail] ${detail}`)
	})

	it("stamps the card with the task, company and dataset version from the dataset", async () => {
		const dataset = aCompanyDataset()
		const inference = new FakeRoleInference([aModelCard("nothing labelled as malicious")])

		const card = await analyzeIndustry(inference, dataset, "C001-CH1")

		expect([card.taskId, card.companyId, card.problem.sources[0]?.datasetVersion]).toEqual(["C001-CH1", "C001", dataset.version])
	})

	it("asks the model once more when a quote is not in the source and keeps the repaired card", async () => {
		const inference = new FakeRoleInference([aModelCard("invented sentence"), aModelCard("plenty of normal traffic")])

		const card = await analyzeIndustry(inference, aCompanyDataset(), "C001-CH1")

		expect([inference.requests.length, card.problem.sources[0]?.quote]).toEqual([2, "plenty of normal traffic"])
	})

	it("fails when the repaired card still cites a quote that is not in the source", async () => {
		const inference = new FakeRoleInference([aModelCard("invented sentence"), aModelCard("still invented")])

		await expect(analyzeIndustry(inference, aCompanyDataset(), "C001-CH1")).rejects.toThrow(UnverifiedSourcesError)
	})

	it("rejects a task id that is not in the dataset", async () => {
		const inference = new FakeRoleInference([])

		await expect(analyzeIndustry(inference, aCompanyDataset(), "C001-CH9")).rejects.toThrow(/C001-CH9/)
	})
})
