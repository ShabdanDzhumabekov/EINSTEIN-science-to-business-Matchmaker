import { describe, expect, it } from "vitest"
import type { Decision, NoulQuestion } from "../contracts/decision"
import { MozaikDecision } from "./mozaik-decision"

function aQuestion(key: string): NoulQuestion {
	return { key, instructions: `Is ${key} true?`, whenTrue: "yes", whenFalse: "no" }
}

class EchoDecision implements Decision {
	readonly states: Array<Readonly<Record<string, unknown>>> = []
	async probabilities(state: Readonly<Record<string, unknown>>, questions: ReadonlyArray<NoulQuestion>) {
		this.states.push(state)
		return new Map(questions.map((question, position) => [question.key, position === 0 ? 0.9 : 0.2]))
	}
}

class FailingDecision implements Decision {
	async probabilities(): Promise<ReadonlyMap<string, number>> {
		throw new Error("Jev HTTP 503")
	}
}

describe("MozaikDecision", () => {
	it("answers concurrent Jev requests through Mozaik agent loops", async () => {
		const inner = new EchoDecision()
		const decision = new MozaikDecision(inner)

		const answers = await Promise.all([
			decision.probabilities({ task: "C001-CH1" }, [aQuestion("fit_R0001"), aQuestion("fit_R0002")]),
			decision.probabilities({ task: "C003-CH1" }, [aQuestion("fit_R0003")]),
		])

		expect([answers.map((answer) => [...answer]), inner.states.length]).toEqual([[[["fit_R0001", 0.9], ["fit_R0002", 0.2]], [["fit_R0003", 0.9]]], 2])
	})

	it("rejects when the Jev call fails", async () => {
		await expect(new MozaikDecision(new FailingDecision()).probabilities({}, [aQuestion("fit_R0001")])).rejects.toThrow(/Jev HTTP 503/)
	})
})
