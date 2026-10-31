import { describe, expect, it } from "vitest"
import type { SourceRef } from "../../contracts/source-ref"
import { aCompany, aDataset, aPublication, aResearcher, TEST_DATASET_VERSION } from "../../test-support/dataset-builders"
import { FakeRoleInference } from "../../test-support/fake-role-inference"
import { UnverifiedSourcesError } from "../verified-inference"
import { profileResearcher } from "./profile-researcher"

const confirmedAbstract = "We learn a baseline of normal Modbus traffic and flag drift."
const unconfirmedAbstract = "Deep learning for crop disease detection."

function aResearcherDataset() {
	return aDataset({
		companies: [aCompany({ challenges: [{ id: "C001-CH1", text: "Detect anomalies.", detail: "We have no attack examples." }] })],
		researchers: [
			aResearcher({
				id: "R0007",
				publications: ["SYN-PUB-00001", "SYN-PUB-00002"],
				open_to: ["joint projects with companies"],
				notes: "He is not available to supervise PhD students.",
			}),
		],
		publications: [
			aPublication({
				id: "SYN-PUB-00001",
				title: "Baselines for Modbus",
				abstract: confirmedAbstract,
				authors: [{ name: "A", researcher_id: "R0007", affiliation: "UNS" }],
			}),
			aPublication({ id: "SYN-PUB-00002", abstract: unconfirmedAbstract, authors: [] }),
		],
	})
}

function aSource(recordId: string, field: string, quote: string): SourceRef {
	return { recordId, field, quote, datasetVersion: TEST_DATASET_VERSION }
}

function aModelCard(methodSource: SourceRef, phdSources: ReadonlyArray<SourceRef> = [aSource("R0007", "notes", "not available to supervise PhD students")]) {
	return {
		methods: [{ text: "Learns baselines of normal industrial traffic.", sources: [methodSource] }],
		participation: {
			industrialPhdSupervision: { status: "declined", sources: phdSources },
			jointProject: { status: "open", sources: [aSource("R0007", "open_to", "joint projects with companies")] },
			availability: { status: "unknown", sources: [] },
		},
		unknowns: ["capacity in 2027"],
	}
}

const abstractSource = aSource("SYN-PUB-00001", "abstract", "learn a baseline of normal Modbus traffic")

function aRequest() {
	return { researcherId: "R0007", qualityFlags: ["authorship_conflict" as const] }
}

describe("profileResearcher", () => {
	it("shows the model abstracts of works whose authorship is confirmed", async () => {
		const inference = new FakeRoleInference([aModelCard(abstractSource)])

		await profileResearcher(inference, aResearcherDataset(), aRequest())

		expect(inference.requests[0]?.input).toContain(`[SYN-PUB-00001.abstract] ${confirmedAbstract}`)
	})

	it("withholds works the researcher is not confirmed to have authored", async () => {
		const inference = new FakeRoleInference([aModelCard(abstractSource)])

		await profileResearcher(inference, aResearcherDataset(), aRequest())

		expect(inference.requests[0]?.input).not.toContain(unconfirmedAbstract)
	})

	it("stamps the card with ids and the quality flags computed by code", async () => {
		const inference = new FakeRoleInference([aModelCard(abstractSource)])

		const card = await profileResearcher(inference, aResearcherDataset(), aRequest())

		expect([card.researcherId, card.qualityFlags]).toEqual(["R0007", ["authorship_conflict"]])
	})

	it("builds the card from the researcher's material without any company task", async () => {
		const inference = new FakeRoleInference([aModelCard(abstractSource)])

		await profileResearcher(inference, aResearcherDataset(), aRequest())

		expect(inference.requests[0]?.input).not.toContain("Task card")
	})

	it("sends a method backed only by a publication title back for repair", async () => {
		const titleSource = aSource("SYN-PUB-00001", "title", "Baselines for Modbus")
		const inference = new FakeRoleInference([aModelCard(titleSource), aModelCard(abstractSource)])

		const card = await profileResearcher(inference, aResearcherDataset(), aRequest())

		expect([inference.requests.length, card.methods[0]?.sources[0]?.field]).toEqual([2, "abstract"])
	})

	it("fails when a stated willingness still has no quoted source after repair", async () => {
		const inference = new FakeRoleInference([aModelCard(abstractSource, []), aModelCard(abstractSource, [])])

		await expect(profileResearcher(inference, aResearcherDataset(), aRequest())).rejects.toThrow(UnverifiedSourcesError)
	})

	it("rejects a researcher id that is not in the dataset", async () => {
		const inference = new FakeRoleInference([])

		await expect(
			profileResearcher(inference, aResearcherDataset(), { ...aRequest(), researcherId: "R9999" }),
		).rejects.toThrow(/R9999/)
	})
})
