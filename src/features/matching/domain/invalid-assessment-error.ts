import type { PairAssessment } from "../../../contracts/pair-assessment"

export class InvalidAssessmentError extends Error {
	override readonly name = "InvalidAssessmentError"

	constructor(readonly violations: ReadonlyArray<string>, readonly assessment: PairAssessment) {
		super(`Matchmaker output rejected: ${violations.join("; ")}`)
	}
}
