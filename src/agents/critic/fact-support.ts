import type { CriticIssue } from "../../contracts/critic-issue"
import type { Decision, QuestionText } from "../../contracts/decision"
import type { SupportedClaim } from "../../contracts/supported-claim"
import type { Dataset } from "../../data/dataset"
import { quotedSentences } from "../../evidence/quoted-sentences"

const MIN_SUPPORT_PROBABILITY = 0.5

export type FactSupport = { support: ReadonlyArray<number>; threshold: number; question: QuestionText; issues: ReadonlyArray<CriticIssue> }

const keyOf = (index: number) => `fact_${index + 1}`

function question(key: string): QuestionText {
	return {
		instructions: `Does the \`evidence\` of \`${key}\` in \`facts\` directly support its \`claim\`? Judge only against that evidence; missing evidence is not support.`,
		whenTrue: "The evidence directly supports the claim",
		whenFalse: "The evidence does not establish the claim or contradicts it",
	}
}

/* Jev checks meaning claim by claim in one request; quote existence and authorship are already checked by code. */
export async function factSupport(decision: Decision, dataset: Dataset, facts: ReadonlyArray<SupportedClaim>): Promise<FactSupport> {
	const probabilities = await decision.probabilities(
		{ facts: Object.fromEntries(facts.map((fact, index) => [keyOf(index), { claim: fact.text, evidence: fact.sources.flatMap((source) => quotedSentences(dataset, source)) }])) },
		facts.map((_, index) => ({ key: keyOf(index), ...question(keyOf(index)) })),
	)
	const support = facts.map((_, index) => {
		const supportProbability = probabilities.get(keyOf(index))
		if (supportProbability === undefined) throw new Error(`factSupport: no Jev answer for ${keyOf(index)}`)
		return supportProbability
	})
	const issues = facts.flatMap((fact, index) => {
		const supportProbability = support[index] ?? 0
		return supportProbability >= MIN_SUPPORT_PROBABILITY ? [] : [{
			category: "unsupported_claim" as const,
			severity: "blocking" as const,
			claim: fact.text,
			sources: fact.sources,
			explanation: `Jev rates the support of this fact by its source sentences at ${supportProbability}. Keep in the fact only what the source states; move any condition, requirement or next step into proposedActions or questions.`,
			owner: "proposal_writer" as const,
		}]
	})
	return { support, threshold: MIN_SUPPORT_PROBABILITY, question: question("fact_<n>"), issues }
}
