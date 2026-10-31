import type { BusinessCard } from "../contracts/business-card"
import type { Decision, NoulQuestion } from "../contracts/decision"
import type { ScholarCard } from "../contracts/scholar-card"
import type { ScholarScreening } from "../contracts/scholar-screening"
import { questionText } from "./question-text"

export type ScholarScreeningOptions = { threshold: number; maxBatchChallenges: number; maxBatchBytes: number }

type Batch = ReadonlyArray<BusinessCard>

/* Reverse screening for the Stars scenario: one researcher's full card against the network's challenges, in batches small
   enough for Jev to read closely. A challenge is kept only if it addresses the researcher's methods and is a research problem. */
export async function screenScholar(decision: Decision, scholar: ScholarCard, challenges: ReadonlyArray<BusinessCard>, options: ScholarScreeningOptions): Promise<ScholarScreening> {
	const researcher = fullScholar(scholar)
	const batches = batchesOf(researcher, scholar.researcherId, challenges, options)
	const answers = await Promise.all(batches.map((batch) => decision.probabilities(stateOf(researcher, batch), batch.flatMap(questionsOf))))
	const probability = (key: string) => {
		const found = answers.find((answer) => answer.has(key))?.get(key)
		if (found === undefined) throw new Error(`screenScholar: no Jev answer for ${key}`)
		return found
	}
	return {
		researcherId: scholar.researcherId,
		threshold: options.threshold,
		batches: batches.length,
		challenges: challenges
			.map((business) => {
				const fit = probability(fitKey(business.taskId))
				const researchFit = probability(researchKey(business.taskId))
				return { taskId: business.taskId, companyId: business.companyId, fit, researchFit, isKept: fit >= options.threshold && researchFit >= options.threshold }
			})
			.sort((left, right) => right.fit - left.fit || left.taskId.localeCompare(right.taskId)),
		model: "typesafe/jev-1.14",
		questions: { pairFit: questionText(fitQuestion("<taskId>")), researchProblem: questionText(researchQuestion("<taskId>")) },
	}
}

function batchesOf(researcher: ReturnType<typeof fullScholar>, researcherId: string, challenges: ReadonlyArray<BusinessCard>, options: ScholarScreeningOptions): ReadonlyArray<Batch> {
	const fits = (batch: Batch) => batch.length <= options.maxBatchChallenges && requestBytes(researcher, batch) <= options.maxBatchBytes
	return challenges.reduce<Batch[]>((batches, business) => {
		const current = batches.at(-1)
		if (current !== undefined && fits([...current, business])) return [...batches.slice(0, -1), [...current, business]]
		if (!fits([business])) throw new Error(`screenScholar: researcher ${researcherId} and challenge ${business.taskId} exceed ${options.maxBatchBytes} bytes`)
		return [...batches, [business]]
	}, [])
}

function requestBytes(researcher: ReturnType<typeof fullScholar>, batch: Batch): number {
	return Buffer.byteLength(JSON.stringify({ state: stateOf(researcher, batch), questions: batch.flatMap(questionsOf) }))
}

function fullScholar(scholar: ScholarCard) {
	return {
		fields: scholar.fields,
		keywords: scholar.keywords,
		bio: scholar.bio.text,
		industryExperience: scholar.industryExperience.text,
		works: scholar.works.map((work) => ({ title: work.title, summary: work.body.text })),
	}
}

function stateOf(researcher: ReturnType<typeof fullScholar>, batch: Batch) {
	return { researcher, challenges: Object.fromEntries(batch.map((business) => [business.taskId, { challenge: business.challenge.text.text, detail: business.challenge.detail.text }])) }
}

function questionsOf(business: BusinessCard): ReadonlyArray<NoulQuestion> {
	return [fitQuestion(business.taskId), researchQuestion(business.taskId)]
}

function fitQuestion(taskId: string): NoulQuestion {
	return {
		key: fitKey(taskId),
		instructions: `Do the methods shown in \`researcher\` (abstracts, bio, industry experience) address the technical problem of challenge \`${taskId}\` in \`challenges\`, so that a joint research project is plausible?`,
		whenTrue: "The researcher's methods directly address this challenge's problem",
		whenFalse: "The methods are unrelated or only share a broad field",
	}
}

function researchQuestion(taskId: string): NoulQuestion {
	return {
		key: researchKey(taskId),
		instructions: `Is challenge \`${taskId}\` in \`challenges\` an open technical or scientific question a university researcher could work on, rather than hiring, sales, fundraising, certification paperwork, training, buying an existing product or routine engineering?`,
		whenTrue: "The challenge contains an open technical or scientific question",
		whenFalse: "The challenge is not a research problem",
	}
}

const keySafe = (taskId: string) => taskId.replace(/-/g, "_")
const fitKey = (taskId: string) => `fit_${keySafe(taskId)}`
const researchKey = (taskId: string) => `research_${keySafe(taskId)}`
