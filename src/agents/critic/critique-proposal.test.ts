import { describe, expect, it } from "vitest"
import type { Proposal } from "../../contracts/proposal"
import type { ScholarCard } from "../../contracts/scholar-card"
import { aBusinessCard, aScholarCard } from "../../test-support/card-builders"
import { FakeDecision } from "../../test-support/fake-decision"
import { FakeRoleInference } from "../../test-support/fake-role-inference"
import { aPairAssessment, aProposal, aSourceRef } from "../../test-support/pair-builders"
import { aPairDataset } from "../../test-support/pair-dataset"
import { critiqueProposal } from "./critique-proposal"

const originalDetail = "We have no attack examples. Alerts must be explainable to a plant manager."

function aProposalDataset() {
	return aPairDataset()
}

function aRequest(overrides: { proposal?: Proposal; scholar?: ScholarCard } = {}) {
	return {
		subject: { artifactId: "proposal-C001-CH1-R0007", version: 1 },
		business: aBusinessCard(),
		scholar: overrides.scholar ?? aScholarCard(),
		assessment: aPairAssessment(),
		proposal: overrides.proposal ?? aProposal(),
	}
}

function supported() { return new FakeDecision({ fact_1: 1, fact_2: 1 }) }

const unknownProjectWillingness: ScholarCard["participation"] = {
	...aScholarCard().participation,
	jointProject: { status: "unknown", sources: [] },
}

describe("critiqueProposal", () => {
	it("records the checked proposal version and its fact count", async () => {
		const inference = new FakeRoleInference([{ issues: [] }])

		const verdict = await critiqueProposal(inference, supported(), aProposalDataset(), aRequest())

		expect([verdict.phase, verdict.subject.version, verdict.checkedClaimCount, verdict.issues]).toEqual(["proposal", 1, 2, []])
	})

	it("records Jev's support for every fact and the question it was asked", async () => {
		const inference = new FakeRoleInference([{ issues: [] }])

		const verdict = await critiqueProposal(inference, new FakeDecision({ fact_1: 0.97, fact_2: 0.61 }), aProposalDataset(), aRequest())

		expect(verdict.jevFactCheck).toEqual({
			support: [0.97, 0.61],
			threshold: 0.5,
			question: {
				instructions: "Does the `evidence` of `fact_<n>` in `facts` directly support its `claim`? Judge only against that evidence; missing evidence is not support.",
				whenTrue: "The evidence directly supports the claim",
				whenFalse: "The evidence does not establish the claim or contradicts it",
			},
		})
	})

	it("sets aside a Critic issue whose quote is not in the dataset and keeps the record of it", async () => {
		const invented = { category: "constraint_contradicted", severity: "blocking", owner: "proposal_writer", claim: "Alerts within 5 seconds.",
			explanation: "The company requires alerts within 5 seconds.", sources: [{ recordId: "C001-CH1", field: "detail", quote: "Alerts must reach the operator within 5 seconds.", datasetVersion: "model-value" }] }
		const inference = new FakeRoleInference([{ issues: [invented] }])

		const verdict = await critiqueProposal(inference, supported(), aProposalDataset(), aRequest())

		expect([verdict.issues, verdict.unverifiedIssues?.map((issue) => issue.claim)]).toEqual([[], ["Alerts within 5 seconds."]])
	})

	it("keeps a Critic issue whose quote is in the dataset", async () => {
		const grounded = { category: "constraint_contradicted", severity: "blocking", owner: "proposal_writer", claim: "Alerts need no explanation.",
			explanation: "The company requires explainable alerts.", sources: [{ recordId: "C001-CH1", field: "detail", quote: "Alerts must be explainable to a plant manager.", datasetVersion: "model-value" }] }
		const inference = new FakeRoleInference([{ issues: [grounded] }])

		const verdict = await critiqueProposal(inference, supported(), aProposalDataset(), aRequest())

		expect(verdict.issues.map((issue) => issue.claim)).toEqual(["Alerts need no explanation."])
	})

	it("keeps the Critic's checklist in the verdict and lets a failed check raise a plan issue", async () => {
		const review = {
			checks: [
				{ item: "metric", verdict: "fail", evidence: "The 90% target names no denominator." },
				{ item: "participation", verdict: "pass", evidence: "This proposal is conditional on R0007's confirmation." },
			],
			issues: [{ category: "plan_underspecified", severity: "advisory", owner: "proposal_writer", claim: "at least 90% detected",
				explanation: "State what is counted and over which population.", sources: [] }],
		}
		const inference = new FakeRoleInference([review])

		const verdict = await critiqueProposal(inference, supported(), aProposalDataset(), aRequest())

		expect([verdict.checklist, verdict.issues.map((issue) => `${issue.category}:${issue.severity}`)]).toEqual([review.checks, ["plan_underspecified:advisory"]])
	})

	it("gives the model the proposal text next to the company's original challenge", async () => {
		const inference = new FakeRoleInference([{ issues: [] }])

		await critiqueProposal(inference, supported(), aProposalDataset(), aRequest())

		expect([inference.requests[0]?.input.includes(`[C001-CH1.detail] ${originalDetail}`), inference.requests[0]?.input.includes("# Site baselines")]).toEqual([true, true])
	})

	it("blocks an unconditional proposal when the researcher's willingness is unknown", async () => {
		const inference = new FakeRoleInference([{ issues: [] }])

		const verdict = await critiqueProposal(inference, supported(), aProposalDataset(), aRequest({ scholar: aScholarCard({ participation: unknownProjectWillingness }) }))

		expect(verdict.issues.map((issue) => `${issue.category}:${issue.owner}`)).toEqual(["participation_misstated:proposal_writer"])
	})

	it("accepts a proposal marked conditional when willingness is unknown", async () => {
		const inference = new FakeRoleInference([{ issues: [] }])

		const verdict = await critiqueProposal(
			inference,
			supported(),
			aProposalDataset(),
			aRequest({ scholar: aScholarCard({ participation: unknownProjectWillingness }), proposal: aProposal({ isConditional: true }) }),
		)

		expect(verdict.issues).toEqual([])
	})

	it("sends a fact whose quote is not in its source back to the writer", async () => {
		const facts = [{ text: "They have attack labels.", sources: [aSourceRef("C001-CH1", "detail", "we have thousands of labelled attacks")] }]
		const inference = new FakeRoleInference([{ issues: [] }])

		const verdict = await critiqueProposal(inference, supported(), aProposalDataset(), aRequest({ proposal: aProposal({ facts }) }))

		expect(verdict.issues.map((issue) => `${issue.category}:${issue.owner}`)).toEqual(["quote_not_found:proposal_writer"])
	})

	it("sends a fact that Jev finds unsupported by its quote back to the writer", async () => {
		const inference = new FakeRoleInference([{ issues: [] }])

		const verdict = await critiqueProposal(inference, new FakeDecision({ fact_1: 0.2, fact_2: 1 }), aProposalDataset(), aRequest())

		expect(verdict.issues.map((issue) => `${issue.category}:${issue.owner}:${issue.claim}`)).toEqual(["unsupported_claim:proposal_writer:No attack labels."])
	})

	it("tells the writer to keep only sourced content in a weakly supported fact and move conditions out", async () => {
		const verdict = await critiqueProposal(new FakeRoleInference([{ issues: [] }]), new FakeDecision({ fact_1: 0.3, fact_2: 1 }), aProposalDataset(), aRequest())

		expect(verdict.issues[0]?.explanation).toBe("Jev rates the support of this fact by its source sentences at 0.3. Keep in the fact only what the source states; move any condition, requirement or next step into proposedActions or questions.")
	})

	it("asks Jev to check the fact against the whole sentence its quote comes from", async () => {
		const decision = supported()
		const facts = [{ text: "Alerts must be explainable to a plant manager.", sources: [aSourceRef("C001-CH1", "detail", "explainable to a plant manager")] }]

		await critiqueProposal(new FakeRoleInference([{ issues: [] }]), decision, aProposalDataset(), aRequest({ proposal: aProposal({ facts }) }))

		expect(decision.calls[0]?.state).toEqual({ facts: { fact_1: { claim: "Alerts must be explainable to a plant manager.", evidence: ["Alerts must be explainable to a plant manager."] } } })
	})

	it("refuses to review a proposal written for another researcher", async () => {
		const inference = new FakeRoleInference([])

		await expect(critiqueProposal(inference, supported(), aProposalDataset(), aRequest({ proposal: aProposal({ researcherId: "R0008" }) }))).rejects.toThrow(/R0008/)
	})
})
