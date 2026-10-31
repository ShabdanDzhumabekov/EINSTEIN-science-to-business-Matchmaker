import { expect, it } from "vitest"
import type { BusinessCard } from "../contracts/business-card"
import { aBusinessCard, aScholarCard } from "../test-support/card-builders"
import { FakeDecision } from "../test-support/fake-decision"
import { screenScholar } from "./screen-scholar"

function aChallenge(taskId: string, detail = "We have no attack examples."): BusinessCard {
	const base = aBusinessCard()
	return { ...base, taskId, companyId: taskId.split("-")[0] ?? "C001",
		challenge: { text: { recordId: taskId, field: "text", text: `Challenge ${taskId}.` }, detail: { recordId: taskId, field: "detail", text: detail } } }
}

const roomy = { threshold: 0.5, maxBatchChallenges: 25, maxBatchBytes: 96 * 1024 }

it("keeps a challenge only when both the fit and the research-problem probability reach the threshold", async () => {
	const decision = new FakeDecision({ fit_C001_CH1: 0.5, research_C001_CH1: 0.5, fit_C002_CH1: 0.9, research_C002_CH1: 0.49, fit_C003_CH1: 0.49, research_C003_CH1: 0.9 })

	const screening = await screenScholar(decision, aScholarCard(), [aChallenge("C001-CH1"), aChallenge("C002-CH1"), aChallenge("C003-CH1")], roomy)

	expect(screening.challenges.filter((challenge) => challenge.isKept).map((challenge) => challenge.taskId)).toEqual(["C001-CH1"])
})

it("orders challenges by fit, then by challenge id when fits are equal", async () => {
	const decision = new FakeDecision({ fit_C001_CH1: 0.7, research_C001_CH1: 0.9, fit_C002_CH1: 0.9, research_C002_CH1: 0.9, fit_C003_CH1: 0.7, research_C003_CH1: 0.9 })

	const screening = await screenScholar(decision, aScholarCard(), [aChallenge("C003-CH1"), aChallenge("C001-CH1"), aChallenge("C002-CH1")], roomy)

	expect(screening.challenges.map((challenge) => challenge.taskId)).toEqual(["C002-CH1", "C001-CH1", "C003-CH1"])
})

it("asks about every challenge exactly once across batches of at most the configured size", async () => {
	const decision = new FakeDecision(Object.fromEntries(["C001_CH1", "C002_CH1", "C003_CH1"].flatMap((key) => [[`fit_${key}`, 0.1], [`research_${key}`, 0.9]])))

	await screenScholar(decision, aScholarCard(), [aChallenge("C001-CH1"), aChallenge("C002-CH1"), aChallenge("C003-CH1")], { ...roomy, maxBatchChallenges: 2 })

	expect(decision.calls.map((call) => Object.keys(call.state.challenges as object))).toEqual([["C001-CH1", "C002-CH1"], ["C003-CH1"]])
})

it("starts a new batch before the request body would exceed the byte limit", async () => {
	const decision = new FakeDecision(Object.fromEntries(["C001_CH1", "C002_CH1"].flatMap((key) => [[`fit_${key}`, 0.1], [`research_${key}`, 0.9]])))
	const longDetail = "x".repeat(3000)

	await screenScholar(decision, aScholarCard(), [aChallenge("C001-CH1", longDetail), aChallenge("C002-CH1", longDetail)], { ...roomy, maxBatchBytes: 6500 })

	expect(decision.calls).toHaveLength(2)
})

it("shows Jev the researcher's full card, including work abstracts", async () => {
	const decision = new FakeDecision({ fit_C001_CH1: 0.9, research_C001_CH1: 0.9 })

	await screenScholar(decision, aScholarCard(), [aChallenge("C001-CH1")], roomy)

	expect(JSON.stringify(decision.calls[0]?.state.researcher)).toContain("We learn a baseline of normal Modbus traffic.")
})

it("fails when the researcher card and a single challenge exceed the byte limit", async () => {
	const screening = screenScholar(new FakeDecision({}), aScholarCard(), [aChallenge("C001-CH1")], { ...roomy, maxBatchBytes: 500 })

	await expect(screening).rejects.toThrow("screenScholar: researcher R0007 and challenge C001-CH1 exceed 500 bytes")
})

it("records the wording of both Jev questions, with the challenge id as a placeholder", async () => {
	const decision = new FakeDecision({ fit_C001_CH1: 0.9, research_C001_CH1: 0.9 })

	const screening = await screenScholar(decision, aScholarCard(), [aBusinessCard()], { threshold: 0.5, maxBatchChallenges: 25, maxBatchBytes: 96 * 1024 })

	expect(screening.questions).toEqual({
		pairFit: {
			instructions: "Do the methods shown in `researcher` (abstracts, bio, industry experience) address the technical problem of challenge `<taskId>` in `challenges`, so that a joint research project is plausible?",
			whenTrue: "The researcher's methods directly address this challenge's problem",
			whenFalse: "The methods are unrelated or only share a broad field",
		},
		researchProblem: {
			instructions: "Is challenge `<taskId>` in `challenges` an open technical or scientific question a university researcher could work on, rather than hiring, sales, fundraising, certification paperwork, training, buying an existing product or routine engineering?",
			whenTrue: "The challenge contains an open technical or scientific question",
			whenFalse: "The challenge is not a research problem",
		},
	})
})
