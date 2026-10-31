import { describe, expect, it } from "vitest"
import type { ScholarCard } from "../../../../contracts/scholar-card"
import { aBusinessCard, aScholarCard } from "../../../../test-support/card-builders"
import { FakeRoleInference } from "../../../../test-support/fake-role-inference"
import { aPairAssessment, aSourceRef } from "../../../../test-support/pair-builders"
import { aPairDataset } from "../../../../test-support/pair-dataset"
import { writeProposal } from "./write-proposal"

function aModelProposal(overrides: Record<string, unknown> = {}) {
	return {
		title: "Site baselines for Modbus anomaly detection",
		facts: [{ text: "No attack labels.", sources: [{ recordId: "C001-CH1", field: "detail", quote: "We have no attack examples." }] },
			{ text: "R0007 learns baselines of normal Modbus traffic.", sources: [{ recordId: "SYN-PUB-00001", field: "abstract", quote: "We learn a baseline of normal Modbus traffic." }] }],
		inferences: ["Baseline learning fits a setting without labels."],
		proposedActions: ["Pilot on one site; detection rate is a hypothesis to measure."],
		questions: [],
		benefits: { company: "Detection tuned to its own sites without attack labels.", researcher: "A test of whether site baselines transfer to new OT traffic." },
		...overrides,
	}
}

type WillingnessStatus = ScholarCard["participation"]["jointProject"]["status"]

function aParticipation(phdStatus: WillingnessStatus, jointStatus: WillingnessStatus, availability: ScholarCard["participation"]["availability"]["status"] = "active"): ScholarCard["participation"] {
	const willingness = (status: WillingnessStatus) => ({ status, sources: status === "unknown" ? [] : [aSourceRef("R0007", "open_to", "joint projects with companies")] })
	return { industrialPhdSupervision: willingness(phdStatus), jointProject: willingness(jointStatus), availability: { status: availability, sources: [] } }
}

function aWriteRequest(overrides: Record<string, unknown> = {}) {
	return {
		business: aBusinessCard(),
		scholar: aScholarCard({ participation: aParticipation("open", "open") }),
		assessment: aPairAssessment({ format: "joint_project" }),
		inputs: [{ artifactId: "pair-C001-CH1-R0007", version: 3 }],
		...overrides,
	}
}

describe("writeProposal", () => {
	it("stamps the proposal with the pair's ids, format and the inputs given by code", async () => {
		const proposal = await writeProposal(new FakeRoleInference([aModelProposal()]), aPairDataset(), aWriteRequest())

		expect([proposal.taskId, proposal.researcherId, proposal.format, proposal.inputs]).toEqual(["C001-CH1", "R0007", "joint_project", [{ artifactId: "pair-C001-CH1-R0007", version: 3 }]])
	})

	it("stamps fact sources with the dataset version", async () => {
		const proposal = await writeProposal(new FakeRoleInference([aModelProposal()]), aPairDataset(), aWriteRequest())

		expect(proposal.facts[0]?.sources[0]).toEqual(aSourceRef("C001-CH1", "detail", "We have no attack examples."))
	})

	it.each([
		["joint_project", "open", "unknown", "active", true],
		["joint_project", "unknown", "open", "active", false],
		["industrial_phd", "unknown", "open", "active", true],
		["joint_project", "unknown", "open", "unknown", true],
		["joint_project", "unknown", "open", "limited", true],
	] as const)("marks a %s proposal conditional when that format or availability is unknown (phd %s, joint %s, availability %s)",
		async (format, phdStatus, jointStatus, availability, expectedIsConditional) => {
			const request = aWriteRequest({ scholar: aScholarCard({ participation: aParticipation(phdStatus, jointStatus, availability) }), assessment: aPairAssessment({ format }) })

			const proposal = await writeProposal(new FakeRoleInference([aModelProposal()]), aPairDataset(), request)

			expect(proposal.isConditional).toBe(expectedIsConditional)
		})

	it("refuses to write a proposal for a format the researcher declined", async () => {
		const request = aWriteRequest({ scholar: aScholarCard({ participation: aParticipation("open", "declined") }) })

		const writing = writeProposal(new FakeRoleInference([aModelProposal()]), aPairDataset(), request)

		await expect(writing).rejects.toMatchObject({ name: "DeclinedParticipationError", message: "R0007 declined joint_project" })
	})

	it("refuses a pair written for another task", async () => {
		const writing = writeProposal(new FakeRoleInference([aModelProposal()]), aPairDataset(), aWriteRequest({ assessment: aPairAssessment({ taskId: "C002-CH1" }) }))

		await expect(writing).rejects.toThrow("pair C002-CH1/R0007")
	})

	it("shows the model labelled passages and the pair assessment", async () => {
		const inference = new FakeRoleInference([aModelProposal()])

		await writeProposal(inference, aPairDataset(), aWriteRequest())

		expect([inference.requests[0]?.input.includes("[C001-CH1.detail] We have no attack examples."), inference.requests[0]?.input.includes('"jointProblem"')]).toEqual([true, true])
	})

	it("rejects a fact whose quote is not in the dataset field", async () => {
		const modelProposal = aModelProposal({ facts: [{ text: "No attack labels.", sources: [{ recordId: "C001-CH1", field: "detail", quote: "We have no attack example." }] }, aModelProposal().facts[1]] })

		const writing = writeProposal(new FakeRoleInference([modelProposal]), aPairDataset(), aWriteRequest())

		await expect(writing).rejects.toMatchObject({ name: "InvalidProposalError", violations: ["quote_not_found: The quote is not in C001-CH1.detail.", 'constraint "No attack labels." has no source cited in facts; add a fact with the source recordId "C001-CH1", field "detail", quote "We have no attack examples."'] })
	})

	it("tells Writer which record a company field belongs to when it is cited under the task id", async () => {
		const modelProposal = aModelProposal({ facts: [...aModelProposal().facts, { text: "One engineer.", sources: [{ recordId: "C001-CH1", field: "rd_capacity", quote: "One engineer part-time." }] }] })

		const writing = writeProposal(new FakeRoleInference([modelProposal]), aPairDataset(), aWriteRequest())

		await expect(writing).rejects.toMatchObject({ violations: ['unknown_source: "rd_capacity" is not a quotable field of C001-CH1. Company fields belong to the company record: use recordId "C001", field "rd_capacity"'] })
	})

	it("rejects a fact citing a record outside the pair", async () => {
		const modelProposal = aModelProposal({ facts: [...aModelProposal().facts, { text: "Crops.", sources: [{ recordId: "SYN-PUB-00002", field: "abstract", quote: "crop images" }] }] })

		const writing = writeProposal(new FakeRoleInference([modelProposal]), aPairDataset(), aWriteRequest())

		await expect(writing).rejects.toMatchObject({ violations: ["source SYN-PUB-00002.abstract belongs to neither C001-CH1 nor R0007"] })
	})

	it("rejects a proposal that drops a constraint of the pair", async () => {
		const constraints = [{ text: "No attack labels.", sources: [aSourceRef("C001-CH1", "detail", "We have no attack examples.")] },
			{ text: "Explainable alerts.", sources: [aSourceRef("C001-CH1", "detail", "Alerts must be explainable to a plant manager.")] }]

		const writing = writeProposal(new FakeRoleInference([aModelProposal()]), aPairDataset(), aWriteRequest({ assessment: aPairAssessment({ constraints }) }))

		await expect(writing).rejects.toMatchObject({ violations: ['constraint "Explainable alerts." has no source cited in facts; add a fact with the source recordId "C001-CH1", field "detail", quote "Alerts must be explainable to a plant manager."'] })
	})

	it.each([
		["questions glued into one item", { questions: ["Who owns the lexicon? How often can linguists validate it? What latency applies?"] }, "questions item 1 must be one separate point without leading punctuation, at most 80 words"],
		["a first experiment longer than its limit", { proposedActions: ["Measure drift on site. ".repeat(46)] }, "proposedActions item 1 must be one separate point without leading punctuation, at most 180 words"],
		["a later action longer than its limit", { proposedActions: ["Pilot on one site.", "Measure drift on site. ".repeat(21)] }, "proposedActions item 2 must be one separate point without leading punctuation, at most 80 words"],
	])("rejects %s", async (_case, overrides, violation) => {
		const writing = writeProposal(new FakeRoleInference([aModelProposal(overrides)]), aPairDataset(), aWriteRequest())

		await expect(writing).rejects.toMatchObject({ violations: [violation] })
	})

	it("tells Writer how long an overlong proposal is", async () => {
		const longInference = "This collaboration could plausibly work because the methods overlap. ".repeat(7).trim()

		const writing = writeProposal(new FakeRoleInference([aModelProposal({ inferences: Array.from({ length: 18 }, () => longInference) })]), aPairDataset(), aWriteRequest())

		await expect(writing).rejects.toMatchObject({ violations: [expect.stringMatching(/^proposal has \d+ words, limit 1000: cut at least \d+ words, starting with inferences and later proposed actions$/)] })
	})

	it("rejects a proposal whose facts never cite the researcher's own material", async () => {
		const companyOnlyFacts = [{ text: "No attack labels.", sources: [{ recordId: "C001-CH1", field: "detail", quote: "We have no attack examples." }] }]

		const writing = writeProposal(new FakeRoleInference([aModelProposal({ facts: companyOnlyFacts })]), aPairDataset(), aWriteRequest())

		await expect(writing).rejects.toMatchObject({ violations: ["facts must include at least one claim quoted from the researcher's own material (profile or confirmed works)"] })
	})

	it("rejects more facts than the limit", async () => {
		const fact = { text: "No attack labels.", sources: [{ recordId: "C001-CH1", field: "detail", quote: "We have no attack examples." }] }

		const writing = writeProposal(new FakeRoleInference([aModelProposal({ facts: [...Array.from({ length: 10 }, () => fact), aModelProposal().facts[1]] })]), aPairDataset(), aWriteRequest())

		await expect(writing).rejects.toMatchObject({ violations: ["proposal has 11 facts, limit 10: merge related facts"] })
	})

	it("renders the potential benefits of both sides", async () => {
		const proposal = await writeProposal(new FakeRoleInference([aModelProposal()]), aPairDataset(), aWriteRequest())

		expect(proposal.markdown).toContain("## Potential benefits\n- For the company: Detection tuned to its own sites without attack labels.\n- For the researcher: A test of whether site baselines transfer to new OT traffic.")
	})

	it("rejects an empty benefit for either side", async () => {
		const writing = writeProposal(new FakeRoleInference([aModelProposal({ benefits: { company: "Fewer false alarms.", researcher: " " } })]), aPairDataset(), aWriteRequest())

		await expect(writing).rejects.toMatchObject({ violations: ["benefits.researcher must state what the researcher could gain"] })
	})

	it("removes the leading colon the model puts before list items", async () => {
		const proposal = await writeProposal(new FakeRoleInference([aModelProposal({ questions: [": Can the researcher confirm availability?"] })]), aPairDataset(), aWriteRequest())

		expect(proposal.questions).toEqual(["Can the researcher confirm availability?"])
	})

	it("accepts a detailed first experiment written as one action", async () => {
		const firstExperiment = `First experiment: ${"use held-out normal captures, compare against the current threshold, measure false alarms per site. ".repeat(10)}`

		const proposal = await writeProposal(new FakeRoleInference([aModelProposal({ proposedActions: [firstExperiment] })]), aPairDataset(), aWriteRequest())

		expect(proposal.proposedActions).toEqual([firstExperiment])
	})

	it("passes the critic's feedback to the model", async () => {
		const inference = new FakeRoleInference([aModelProposal()])
		const feedback = [{ category: "unsupported_claim" as const, severity: "blocking" as const, claim: "Detection above 94% is guaranteed.", sources: [],
			explanation: "A detection rate on this site is a hypothesis, not a result.", owner: "proposal_writer" as const }]

		await writeProposal(inference, aPairDataset(), aWriteRequest({ feedback }))

		expect(inference.requests[0]?.input).toContain("A detection rate on this site is a hypothesis, not a result.")
	})

	it("gives the model its rejected draft to revise, with the rule to keep every acceptance condition", async () => {
		const inference = new FakeRoleInference([aModelProposal()])
		const feedback = [{ category: "plan_underspecified" as const, severity: "blocking" as const, claim: "at least 90% detected", sources: [],
			explanation: "Define the counted episode.", owner: "proposal_writer" as const }]

		await writeProposal(inference, aPairDataset(), aWriteRequest({ feedback, previousDraft: "# Site baselines\nProposed go/no-go: at least 90% detected within 60 seconds." }))

		expect([inference.requests[0]?.input.includes("Proposed go/no-go: at least 90% detected within 60 seconds."),
			inference.requests[0]?.input.includes("keep every proposed go/no-go target, threshold, uncertainty rule, population-specific acceptance and control condition")]).toEqual([true, true])
	})
})
