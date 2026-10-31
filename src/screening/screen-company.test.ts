import { expect, it } from "vitest"
import { aBusinessCard, aScholarCard } from "../test-support/card-builders"
import { FakeDecision } from "../test-support/fake-decision"
import { screenCompany } from "./screen-company"

function threeScholars() {
	return [aScholarCard({ researcherId: "R0001" }), aScholarCard({ researcherId: "R0002" }), aScholarCard({ researcherId: "R0003" })]
}

it("keeps researchers at or above the threshold and orders them by Jev probability", async () => {
	const decision = new FakeDecision({ company_R0001: 0.3, company_R0002: 0.8, company_R0003: 0.4 })

	const screening = await screenCompany(decision, aBusinessCard(), threeScholars(), { threshold: 0.4, batchSize: 100 })

	expect(screening.pairs.map((pair) => `${pair.researcherId}:${pair.jev}:${pair.isKept}`)).toEqual(["R0002:0.8:true", "R0003:0.4:true", "R0001:0.3:false"])
})

it("shows Jev the company profile and never the challenge text", async () => {
	const decision = new FakeDecision({ company_R0001: 0.9, company_R0002: 0.9, company_R0003: 0.9 })

	await screenCompany(decision, aBusinessCard(), threeScholars(), { threshold: 0.4, batchSize: 100 })

	const state = JSON.stringify(decision.calls[0]?.state)
	expect([state.includes("We build network security hardware."), state.includes(aBusinessCard().challenge.text.text)]).toEqual([true, false])
})

it("splits the researchers into batches of the given size", async () => {
	const decision = new FakeDecision({ company_R0001: 0.9, company_R0002: 0.9, company_R0003: 0.9 })

	await screenCompany(decision, aBusinessCard(), threeScholars(), { threshold: 0.4, batchSize: 2 })

	expect(decision.calls.map((call) => call.questions.length)).toEqual([2, 1])
})

it("records the company id and the wording of the question", async () => {
	const decision = new FakeDecision({ company_R0001: 0.9, company_R0002: 0.9, company_R0003: 0.9 })

	const screening = await screenCompany(decision, aBusinessCard(), threeScholars(), { threshold: 0.4, batchSize: 100 })

	expect([screening.companyId, screening.threshold, screening.question.instructions]).toEqual(["C001", 0.4,
		"Could the methods of researcher `<researcherId>` in `researchers` matter to anything `company` does or plans, judging from its products, technology and plans only?"])
})
