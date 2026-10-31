import { expect, it } from "vitest"
import { aBusinessCard, aScholarCard } from "../test-support/card-builders"
import { FakeDecision } from "../test-support/fake-decision"
import { screenTask } from "./screen-task"

function threeScholars() {
	return [aScholarCard({ researcherId: "R0001" }), aScholarCard({ researcherId: "R0002" }), aScholarCard({ researcherId: "R0003" })]
}

it("keeps pairs at or above the threshold and orders them by Jev probability", async () => {
	const decision = new FakeDecision({ is_research_problem: 0.9, fit_R0001: 0.4, fit_R0002: 0.8, fit_R0003: 0.5 })

	const screening = await screenTask(decision, aBusinessCard(), threeScholars(), { threshold: 0.5, batchSize: 100 })

	expect(screening.pairs.map((pair) => `${pair.researcherId}:${pair.jev}:${pair.isKept}`)).toEqual(["R0002:0.8:true", "R0003:0.5:true", "R0001:0.4:false"])
})

it("asks whether the task is a research problem even when no researcher is left to screen", async () => {
	const decision = new FakeDecision({ is_research_problem: 0.8 })

	const screening = await screenTask(decision, aBusinessCard(), [], { threshold: 0.5, batchSize: 100 })

	expect([screening.researchFit, screening.pairs]).toEqual([0.8, []])
})

it("records whether Jev considers the task a research problem", async () => {
	const decision = new FakeDecision({ is_research_problem: 0.3, fit_R0001: 0.9, fit_R0002: 0.9, fit_R0003: 0.9 })

	const screening = await screenTask(decision, aBusinessCard(), threeScholars(), { threshold: 0.5, batchSize: 100 })

	expect([screening.researchFit, screening.isResearchProblem]).toEqual([0.3, false])
})

it("splits the researcher table into batches and asks the research question once", async () => {
	const decision = new FakeDecision({ is_research_problem: 0.9, fit_R0001: 0.1, fit_R0002: 0.1, fit_R0003: 0.1 })

	await screenTask(decision, aBusinessCard(), threeScholars(), { threshold: 0.5, batchSize: 2 })

	expect(decision.calls.map((call) => call.questions.map((question) => question.key))).toEqual([
		["is_research_problem", "fit_R0001", "fit_R0002"],
		["fit_R0003"],
	])
})

it("shows Jev the compact researcher table with fields, keywords and work titles", async () => {
	const decision = new FakeDecision({ is_research_problem: 0.9, fit_R0001: 0.1 })

	await screenTask(decision, aBusinessCard(), [aScholarCard({ researcherId: "R0001" })], { threshold: 0.5, batchSize: 100 })

	expect(decision.calls[0]?.state.researchers).toEqual({ R0001: { fields: ["Machine Learning"], keywords: ["Modbus", "traffic baselines"], works: ["Baselines for Modbus"] } })
})

it("records the wording of both Jev questions, with the researcher id as a placeholder", async () => {
	const decision = new FakeDecision({ is_research_problem: 0.9, fit_R0001: 0.9, fit_R0002: 0.9, fit_R0003: 0.9 })

	const screening = await screenTask(decision, aBusinessCard(), threeScholars(), { threshold: 0.5, batchSize: 100 })

	expect(screening.questions).toEqual({
		researchProblem: {
			instructions: "Is the company's need in `task` an open technical or scientific question that a university researcher could work on, rather than hiring, sales, fundraising, certification paperwork, training, buying an existing product or routine engineering?",
			whenTrue: "The need contains an open technical or scientific question",
			whenFalse: "The need is not a research problem",
		},
		pairFit: {
			instructions: "Do the methods of researcher `<researcherId>` in `researchers` address the technical problem in `task`, so that a joint research project is plausible?",
			whenTrue: "The researcher's methods directly address the task's problem",
			whenFalse: "The methods are unrelated or only share a broad field",
		},
	})
})
