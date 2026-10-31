import { expect, it } from "vitest"
import { aBusinessCard, aScholarCard } from "../test-support/card-builders"
import { FakeDecision } from "../test-support/fake-decision"
import { aPairAssessment } from "../test-support/pair-builders"
import { checkPair } from "./check-pair"

const subject = { artifactId: "pair-C001-CH1-R0007", version: 2 }

it.each([
	[0.95, true],
	[0.9, true],
	[0.89, false],
])("keeps a pair whose rationale Jev supports with probability %s: %s", async (probability, expectedIsKept) => {
	const check = await checkPair(new FakeDecision({ rationale_supports_fit: probability }), aBusinessCard(), aScholarCard(), aPairAssessment(), subject, 0.9)

	expect(check.isKept).toBe(expectedIsKept)
})

it("links the check to the assessment version it judged", async () => {
	const check = await checkPair(new FakeDecision({ rationale_supports_fit: 0.95 }), aBusinessCard(), aScholarCard(), aPairAssessment(), subject, 0.9)

	expect([check.taskId, check.researcherId, check.assessment]).toEqual(["C001-CH1", "R0007", subject])
})

it("shows Jev the Matchmaker rationale with its quotes", async () => {
	const decision = new FakeDecision({ rationale_supports_fit: 0.95 })

	await checkPair(decision, aBusinessCard(), aScholarCard(), aPairAssessment(), subject, 0.9)

	expect(decision.calls[0]?.state.rationale).toEqual([{ claim: "R0007 learns baselines of normal traffic.", quotes: ["baseline of normal Modbus traffic"] }])
})

it("shows Jev the risks the Matchmaker named, so a stated transfer gap is not read as missing evidence", async () => {
	const decision = new FakeDecision({ rationale_supports_fit: 0.95 })

	await checkPair(decision, aBusinessCard(), aScholarCard(), aPairAssessment({ risks: ["BACnet transfer is untested."] }), subject, 0.9)

	expect(decision.calls[0]?.state.risks).toEqual(["BACnet transfer is untested."])
})

it("records the question Jev was asked next to its answer", async () => {
	const check = await checkPair(new FakeDecision({ rationale_supports_fit: 0.95 }), aBusinessCard(), aScholarCard(), aPairAssessment(), subject, 0.9)

	expect(check.question).toEqual({
		instructions: "Do the quotes in `rationale` show that the researcher's own methods address the core technical problem in `task`, so that `jointProblem` is a credible joint research question to start? Gaps that are named in `risks` (another protocol, device or dataset) are expected for a new collaboration and are tested in the first experiment.",
		whenTrue: "The quoted evidence shows a method that addresses this task",
		whenFalse: "The quotes do not show a method that addresses this task",
	})
})
