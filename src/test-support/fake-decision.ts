import type { Decision, NoulQuestion } from "../contracts/decision"

/* Answers each question by key; a list gives one probability per call in order. An unlisted or exhausted key is a test bug. */
export class FakeDecision implements Decision {
	readonly calls: Array<{ state: Readonly<Record<string, unknown>>; questions: ReadonlyArray<NoulQuestion> }> = []
	private readonly answers: Map<string, number | number[]>

	constructor(probabilityByKey: Readonly<Record<string, number | ReadonlyArray<number>>>) {
		this.answers = new Map(Object.entries(probabilityByKey).map(([key, answer]) => [key, typeof answer === "number" ? answer : [...answer]]))
	}

	async probabilities(state: Readonly<Record<string, unknown>>, questions: ReadonlyArray<NoulQuestion>): Promise<ReadonlyMap<string, number>> {
		this.calls.push({ state, questions })
		return new Map(questions.map((question) => [question.key, this.answer(question.key)]))
	}

	private answer(key: string): number {
		const scripted = this.answers.get(key)
		const probability = typeof scripted === "number" ? scripted : scripted?.shift()
		if (probability === undefined) throw new Error(`FakeDecision: no probability left for ${key}`)
		return probability
	}
}
