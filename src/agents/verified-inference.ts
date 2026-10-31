import type { CriticIssue } from "../contracts/critic-issue"
import type { RoleInference, RoleInferenceRequest } from "../contracts/role-inference"

export class UnverifiedSourcesError extends Error {
	constructor(
		readonly role: string,
		readonly issues: ReadonlyArray<CriticIssue>,
	) {
		super(`${role}: sources still unverified after repair: ${issues.map((issue) => issue.category).join(", ")}`)
	}
}

const MAX_REPAIRS = 1

/* A role's own output is quote-checked by code before it leaves the role; one repair round, then fail. */
export async function verifiedInference<ModelOutput, Output>(
	inference: RoleInference,
	request: RoleInferenceRequest<ModelOutput>,
	completed: (modelOutput: ModelOutput) => Output,
	sourceIssues: (output: Output) => ReadonlyArray<CriticIssue>,
): Promise<Output> {
	let output = completed(await inference.infer(request))
	for (let repair = 0; repair < MAX_REPAIRS; repair++) {
		const issues = sourceIssues(output)
		if (issues.length === 0) return output
		output = completed(await inference.infer({ ...request, input: repairInput(request.input, output, issues) }))
	}
	const issues = sourceIssues(output)
	if (issues.length > 0) throw new UnverifiedSourcesError(request.role, issues)
	return output
}

function repairInput(input: string, previousOutput: unknown, issues: ReadonlyArray<CriticIssue>): string {
	const problems = issues.map((issue) => `- ${issue.category}: "${issue.claim}" (${issue.explanation})`).join("\n")
	return [
		input,
		"",
		"Your previous answer had source problems. Fix each one: copy the quote exactly from a labelled passage, cite the right [recordId.field], or remove the claim.",
		problems,
		"",
		"Previous answer:",
		JSON.stringify(previousOutput),
	].join("\n")
}
