import type { BusinessCard } from "../contracts/business-card"
import type { CompanyScreening } from "../contracts/company-screening"
import type { Decision, NoulQuestion } from "../contracts/decision"
import type { ScholarCard } from "../contracts/scholar-card"
import { compactScholar } from "./compact-scholar"
import { questionText } from "./question-text"

export type CompanyScreeningOptions = { threshold: number; batchSize: number }

/* Optional pre-filter before stage 2: the company as a whole against the researcher table, without any challenge text.
   Measured on 31.10 (docs/company-prefilter-test.md): no challenge-kept pair lost up to a threshold of 0.4. */
export async function screenCompany(decision: Decision, business: BusinessCard, scholars: ReadonlyArray<ScholarCard>, options: CompanyScreeningOptions): Promise<CompanyScreening> {
	const company = {
		name: business.companyName,
		sector: business.sector,
		about: business.company.about.text,
		products: business.company.products.map((passage) => passage.text),
		tech: business.company.tech.map((passage) => passage.text),
		plans: business.company.plans.text,
	}
	const batches = Array.from({ length: Math.ceil(scholars.length / options.batchSize) }, (_, index) => scholars.slice(index * options.batchSize, (index + 1) * options.batchSize))
	const answers = await Promise.all(batches.map((batch) => decision.probabilities(
		{ company, researchers: Object.fromEntries(batch.map((scholar) => [scholar.researcherId, compactScholar(scholar)])) },
		batch.map((scholar) => companyQuestion(scholar.researcherId)),
	)))
	const probability = (key: string) => {
		const found = answers.find((answer) => answer.has(key))?.get(key)
		if (found === undefined) throw new Error(`screenCompany: no Jev answer for ${key}`)
		return found
	}
	return {
		companyId: business.companyId,
		threshold: options.threshold,
		pairs: scholars
			.map((scholar) => {
				const jev = probability(companyQuestion(scholar.researcherId).key)
				return { researcherId: scholar.researcherId, jev, isKept: jev >= options.threshold }
			})
			.sort((left, right) => right.jev - left.jev || left.researcherId.localeCompare(right.researcherId)),
		model: "typesafe/jev-1.14",
		question: questionText(companyQuestion("<researcherId>")),
	}
}

function companyQuestion(researcherId: string): NoulQuestion {
	return {
		key: `company_${researcherId}`,
		instructions: `Could the methods of researcher \`${researcherId}\` in \`researchers\` matter to anything \`company\` does or plans, judging from its products, technology and plans only?`,
		whenTrue: "The researcher's methods could matter to this company",
		whenFalse: "The methods are unrelated to this company's work",
	}
}
