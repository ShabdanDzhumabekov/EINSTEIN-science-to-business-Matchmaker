export class InvalidProposalError extends Error {
	override readonly name = "InvalidProposalError"

	constructor(readonly violations: ReadonlyArray<string>, readonly draft: unknown) {
		super(`Proposal Writer output rejected: ${violations.join("; ")}`)
	}
}
