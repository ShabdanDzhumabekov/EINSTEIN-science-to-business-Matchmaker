import { describe, expect, it } from "vitest"
import { FakeRoleInference } from "../../../../test-support/fake-role-inference"
import { aBusinessCard, aScholarCard } from "../../../../test-support/card-builders"
import { aPairDataset } from "../../../../test-support/pair-dataset"
import { assessPair } from "./assess-pair"

function aModelPair(overrides: Record<string, unknown> = {}) {
	return {
		outcome: "pair",
		format: "joint_project",
		jointProblem: "Learn a site baseline of Modbus traffic and flag drift.",
		rationale: [{ text: "R0007 learns baselines of normal traffic.", sources: [{ recordId: "SYN-PUB-00001", field: "abstract", quote: "baseline of normal Modbus traffic" }] }],
		constraints: [{ text: "No attack labels.", sources: [{ recordId: "C001-CH1", field: "detail", quote: "We have no attack examples." }] }],
		risks: [],
		questions: [],
		...overrides,
	}
}

function fits() { return { fits: true, reason: "Her baseline modelling of Modbus traffic addresses the unlabelled detection problem." } }

function aRequest(overrides: Partial<Parameters<typeof assessPair>[2]> = {}) {
	return { business: aBusinessCard(), scholar: aScholarCard(), inputs: [{ artifactId: "business-C001-CH1", version: 1 }], ...overrides }
}

describe("assessPair", () => {
	it("stamps the assessment with task, researcher, inputs and dataset version", async () => {
		const assessment = await assessPair(new FakeRoleInference([fits(), aModelPair()]), aPairDataset(), aRequest())

		expect([assessment.taskId, assessment.researcherId, assessment.inputs]).toEqual(["C001-CH1", "R0007", [{ artifactId: "business-C001-CH1", version: 1 }]])
		expect(assessment.outcome === "pair" && assessment.rationale[0]?.sources[0]?.datasetVersion).toBe("test-dataset@1")
	})

	it("returns a rejected pair with the researcher that was assessed", async () => {
		const assessment = await assessPair(new FakeRoleInference([{ fits: false, reason: "The material shows no traffic or anomaly modelling at all." }]), aPairDataset(), aRequest())

		expect(assessment).toMatchObject({ outcome: "no_fit", taskId: "C001-CH1", researcherId: "R0007" })
	})

	it("shows the model labelled passages of both cards", async () => {
		const inference = new FakeRoleInference([fits(), aModelPair()])

		await assessPair(inference, aPairDataset(), aRequest())

		expect(inference.requests[1]?.input).toContain("[SYN-PUB-00001.abstract] We learn a baseline of normal Modbus traffic.")
		expect(inference.requests[1]?.input).toContain("[C001-CH1.detail] We have no attack examples.")
	})

	it("rejects a rationale quote that is not in the dataset field", async () => {
		const modelPair = aModelPair({ rationale: [{ text: "R0007 learns baselines.", sources: [{ recordId: "SYN-PUB-00001", field: "abstract", quote: "baselines of BACnet traffic" }] }] })

		const assessment = assessPair(new FakeRoleInference([fits(), modelPair]), aPairDataset(), aRequest())

		await expect(assessment).rejects.toMatchObject({ name: "InvalidAssessmentError", violations: ["quote_not_found: The quote is not in SYN-PUB-00001.abstract."] })
	})

	it("rejects a rationale citing a record that belongs to neither side of the pair", async () => {
		const modelPair = aModelPair({ rationale: [{ text: "Audits deployments.", sources: [{ recordId: "R0008", field: "bio", quote: "She audits Modbus deployments." }] }] })

		const assessment = assessPair(new FakeRoleInference([fits(), modelPair]), aPairDataset(), aRequest())

		await expect(assessment).rejects.toMatchObject({ violations: expect.arrayContaining(["source R0008.bio belongs to neither C001-CH1 nor R0007"]) })
	})

	it("rejects a rationale claim backed only by the company's own words", async () => {
		const modelPair = aModelPair({ rationale: [{ text: "R0007 builds network security hardware.", sources: [{ recordId: "C001", field: "about", quote: "We build network security hardware." }] }] })

		const assessment = assessPair(new FakeRoleInference([fits(), modelPair]), aPairDataset(), aRequest())

		await expect(assessment).rejects.toMatchObject({ violations: ['rationale "R0007 builds network security hardware." must cite the researcher\'s own material'] })
	})

	it("rejects a format the researcher has declined", async () => {
		const scholar = aScholarCard({ participation: { ...aScholarCard().participation, jointProject: { status: "declined", sources: [] } } })

		const assessment = assessPair(new FakeRoleInference([fits(), aModelPair()]), aPairDataset(), aRequest({ scholar }))

		await expect(assessment).rejects.toMatchObject({ violations: ["format joint_project is declined in the researcher card"] })
	})

	it("rejects a pair with a researcher whose card says unavailable", async () => {
		const scholar = aScholarCard({ participation: { ...aScholarCard().participation, availability: { status: "unavailable", sources: [] } } })

		const assessment = assessPair(new FakeRoleInference([fits(), aModelPair()]), aPairDataset(), aRequest({ scholar }))

		await expect(assessment).rejects.toMatchObject({ violations: ["researcher R0007 is unavailable according to the card"] })
	})

	it("passes correction feedback to the model", async () => {
		const inference = new FakeRoleInference([aModelPair()])
		const feedback = [{ category: "unsupported_claim" as const, severity: "blocking" as const, claim: "R0007 learns baselines.", sources: [],
			explanation: "The quote was reworded.", owner: "matchmaker" as const }]

		await assessPair(inference, aPairDataset(), aRequest({ feedback }))

		expect(inference.requests[0]?.input).toContain("The quote was reworded.")
	})

	it("decides fit before filling the pair", async () => {
		const inference = new FakeRoleInference([fits(), aModelPair()])

		await assessPair(inference, aPairDataset(), aRequest())

		expect(inference.requests.map((request) => request.output.name)).toEqual(["pair_decision", "pair_assessment"])
	})

	it("keeps the decision's reason when the pair is dropped, without filling a pair", async () => {
		const inference = new FakeRoleInference([{ fits: false, reason: "The material shows no traffic or anomaly modelling at all." }])

		const assessment = await assessPair(inference, aPairDataset(), aRequest())

		expect([assessment.outcome === "no_fit" && assessment.reason, inference.requests.length]).toEqual(["The material shows no traffic or anomaly modelling at all.", 1])
	})

	it.each(["Placeholder", "TBD", "no fit"])("asks for the decision again after the template reason %j", async (reason) => {
		const inference = new FakeRoleInference([{ fits: false, reason }, fits(), aModelPair()])

		const assessment = await assessPair(inference, aPairDataset(), aRequest())

		expect(assessment.outcome).toBe("pair")
	})

	it("drops the pair when the repeated decision is still a template", async () => {
		const assessment = await assessPair(new FakeRoleInference([{ fits: false, reason: "Placeholder" }, { fits: false, reason: "TBD" }]), aPairDataset(), aRequest())

		expect(assessment).toMatchObject({ outcome: "no_fit", reason: "TBD" })
	})

	it("fills the pair directly when correcting a rejected pair", async () => {
		const feedback = [{ category: "unsupported_claim" as const, severity: "blocking" as const, claim: "x", sources: [], explanation: "Fix the quote.", owner: "matchmaker" as const }]
		const inference = new FakeRoleInference([aModelPair()])

		await assessPair(inference, aPairDataset(), aRequest({ feedback }))

		expect(inference.requests.map((request) => request.output.name)).toEqual(["pair_assessment"])
	})
})
