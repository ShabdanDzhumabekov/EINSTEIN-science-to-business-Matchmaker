import type { BusinessCard } from "../contracts/business-card"
import type { Decision, NoulQuestion } from "../contracts/decision"
import type { ScholarCard } from "../contracts/scholar-card"
import type { TaskScreening } from "../contracts/task-screening"
import { questionText } from "./question-text"

export type ScreeningOptions = { threshold: number; batchSize: number }

const RESEARCH_QUESTION: NoulQuestion = {
	key: "is_research_problem",
	instructions: "Is the company's need in `task` an open technical or scientific question that a university researcher could work on, rather than hiring, sales, fundraising, certification paperwork, training, buying an existing product or routine engineering?",
	whenTrue: "The need contains an open technical or scientific question",
	whenFalse: "The need is not a research problem",
}
const WORK_TITLES_SHOWN = 8

/* Stage 2: Jev forms the pairs itself from the task and the whole researcher table, split into batches that fit one request. */
export async function screenTask(decision: Decision, business: BusinessCard, scholars: ReadonlyArray<ScholarCard>, options: ScreeningOptions): Promise<TaskScreening> {
	const task = { challenge: business.challenge.text.text, detail: business.challenge.detail.text, company: business.company.about.text }
	const batches = Array.from({ length: Math.ceil(scholars.length / options.batchSize) }, (_, index) => scholars.slice(index * options.batchSize, (index + 1) * options.batchSize))
	const answers = await Promise.all(batches.map((batch, index) => decision.probabilities(
		{ task, researchers: Object.fromEntries(batch.map((scholar) => [scholar.researcherId, compactScholar(scholar)])) },
		[...(index === 0 ? [RESEARCH_QUESTION] : []), ...batch.map((scholar) => fitQuestion(scholar.researcherId))],
	)))
	const probability = (key: string) => {
		const found = answers.find((answer) => answer.has(key))?.get(key)
		if (found === undefined) throw new Error(`screenTask: no Jev answer for ${key}`)
		return found
	}
	const researchFit = probability(RESEARCH_QUESTION.key)
	return {
		taskId: business.taskId,
		researchFit,
		isResearchProblem: researchFit >= options.threshold,
		threshold: options.threshold,
		pairs: scholars
			.map((scholar) => {
				const jev = probability(fitQuestion(scholar.researcherId).key)
				return { taskId: business.taskId, researcherId: scholar.researcherId, jev, isKept: jev >= options.threshold }
			})
			.sort((left, right) => right.jev - left.jev || left.researcherId.localeCompare(right.researcherId)),
		model: "typesafe/jev-1.14",
		questions: { researchProblem: questionText(RESEARCH_QUESTION), pairFit: questionText(fitQuestion("<researcherId>")) },
	}
}

function compactScholar(scholar: ScholarCard) {
	return { fields: scholar.fields, keywords: scholar.keywords, works: scholar.works.slice(0, WORK_TITLES_SHOWN).map((work) => work.title) }
}

function fitQuestion(researcherId: string): NoulQuestion {
	return {
		key: `fit_${researcherId}`,
		instructions: `Do the methods of researcher \`${researcherId}\` in \`researchers\` address the technical problem in \`task\`, so that a joint research project is plausible?`,
		whenTrue: "The researcher's methods directly address the task's problem",
		whenFalse: "The methods are unrelated or only share a broad field",
	}
}
