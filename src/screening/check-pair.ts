import type { ArtifactRef } from "../contracts/artifact-ref"
import type { BusinessCard } from "../contracts/business-card"
import type { Decision, NoulQuestion } from "../contracts/decision"
import { questionText } from "./question-text"
import type { PairAssessment } from "../contracts/pair-assessment"
import type { PairCheck } from "../contracts/pair-check"
import type { ScholarCard } from "../contracts/scholar-card"

const QUESTION: NoulQuestion = {
	key: "rationale_supports_fit",
	instructions: "Do the quotes in `rationale` show that the researcher's own methods address the core technical problem in `task`, so that `jointProblem` is a credible joint research question to start? Gaps that are named in `risks` (another protocol, device or dataset) are expected for a new collaboration and are tested in the first experiment.",
	whenTrue: "The quoted evidence shows a method that addresses this task",
	whenFalse: "The quotes do not show a method that addresses this task",
}

/* Stage 4: Jev judges whether the quotes behind the Matchmaker's rationale show that this researcher's method fits this task.
   The wording matches the Matchmaker rule that a stated transfer gap is a risk to test, not missing evidence. */
export async function checkPair(decision: Decision, business: BusinessCard, scholar: ScholarCard, assessment: PairAssessment, subject: ArtifactRef, threshold: number): Promise<PairCheck> {
	if (assessment.outcome !== "pair") {
		throw new Error(`checkPair: assessment ${subject.artifactId}@${subject.version} is "${assessment.outcome}", not a pair`)
	}
	const answers = await decision.probabilities(
		{
			task: { challenge: business.challenge.text.text, detail: business.challenge.detail.text },
			researcher: { fields: scholar.fields, keywords: scholar.keywords },
			jointProblem: assessment.jointProblem,
			rationale: assessment.rationale.map((claim) => ({ claim: claim.text, quotes: claim.sources.map((source) => source.quote) })),
			risks: assessment.risks,
		},
		[QUESTION],
	)
	const jev = answers.get(QUESTION.key)
	if (jev === undefined) throw new Error(`checkPair: no Jev answer for ${QUESTION.key}`)
	return { taskId: business.taskId, researcherId: scholar.researcherId, assessment: subject, jev, isKept: jev >= threshold, threshold, model: "typesafe/jev-1.14", question: questionText(QUESTION) }
}
