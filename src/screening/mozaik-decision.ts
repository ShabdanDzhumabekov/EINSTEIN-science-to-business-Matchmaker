import {
	createAgent,
	defineRuntime,
	type InferenceInput,
	type InferenceOutput,
	ModelMessageItem,
	RuntimeState,
	type SemanticEvent,
	SituationSpecification,
} from "@mozaik-ai/core"
import { z } from "zod"
import type { Decision, NoulQuestion } from "../contracts/decision"

type PendingDecision = {
	agentId: string
	state: Readonly<Record<string, unknown>>
	questions: ReadonlyArray<NoulQuestion>
	resolve: (probabilities: ReadonlyMap<string, number>) => void
	reject: (error: unknown) => void
}

class ScreenerState extends RuntimeState {}

class EveryEvent extends SituationSpecification {
	isSatisfiedBy(): boolean {
		return true
	}
}

const ProbabilityAnswer = z.array(z.tuple([z.string(), z.number()]))

/* Each Jev request runs as its own Pair Screener agent on Mozaik; the agent's "model" is Jev, called by the runner.
   A Jev failure is settled only when the loop publishes the answer event: leaving the agent earlier makes the loop
   fail on a participant it can no longer find. */
export class MozaikDecision implements Decision {
	private readonly runtime = defineRuntime<ScreenerState>()
	private readonly pending = new Map<string, PendingDecision>()
	private readonly failures = new Map<string, unknown>()

	constructor(private readonly jev: Decision) {
		this.runtime.initializeRuntime({
			state: new ScreenerState(),
			inferenceRunnerConfig: {
				runner: {
					run: (input) => this.runJev(input),
					async *stream() {
						throw new Error("Streaming is not used by the Pair Screener")
					},
				},
			},
		})
	}

	probabilities(state: Readonly<Record<string, unknown>>, questions: ReadonlyArray<NoulQuestion>): Promise<ReadonlyMap<string, number>> {
		const agent = createAgent({
			name: "pair_screener",
			capabilities: ["pair_screening"],
			instruction: "Answer yes/no questions about researcher-company fit with Jev.",
			tools: [],
			handlers: [{ specification: new EveryEvent(), processor: { apply: ({ event }) => this.onEvent(event) } }],
		})
		const context = agent.getMemory().getContext()
		return new Promise((resolve, reject) => {
			const settle = () => {
				this.pending.delete(context.id)
				queueMicrotask(() => this.runtime.leave(agent))
			}
			this.pending.set(context.id, {
				agentId: agent.getId(),
				state,
				questions,
				resolve: (probabilities) => {
					settle()
					resolve(probabilities)
				},
				reject: (error) => {
					settle()
					reject(error)
				},
			})
			this.runtime.join(agent)
			this.runtime.runLoop(agent.getId(), `Answer ${questions.length} Jev questions`, { model: "typesafe/jev-1.14", context })
		})
	}

	private onEvent(event: SemanticEvent): void {
		if (event.type !== "model.answer") return
		const decision = [...this.pending.values()].find((pending) => pending.agentId === event.producerId)
		if (decision === undefined) return
		const { answer } = z.object({ answer: z.custom<ModelMessageItem>((item) => item instanceof ModelMessageItem) }).parse(event.payload)
		const failure = this.failures.get(event.producerId)
		if (failure !== undefined) {
			this.failures.delete(event.producerId)
			decision.reject(failure)
			return
		}
		decision.resolve(new Map(ProbabilityAnswer.parse(JSON.parse(answer.content.text))))
	}

	private async runJev(input: InferenceInput): Promise<InferenceOutput> {
		const decision = this.pending.get(input.context.id)
		if (decision === undefined) {
			throw new Error(`Pair Screener: no pending Jev request for context ${input.context.id}`)
		}
		try {
			const probabilities = await this.jev.probabilities(decision.state, decision.questions)
			return { items: [ModelMessageItem.rehydrate({ text: JSON.stringify([...probabilities]) })], tokenUsage: undefined, rowResponse: {} }
		} catch (error) {
			this.failures.set(decision.agentId, error)
			return { items: [ModelMessageItem.rehydrate({ text: "[]" })], tokenUsage: undefined, rowResponse: {} }
		}
	}
}
