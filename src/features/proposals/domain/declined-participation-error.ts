import type { CollaborationFormat } from "../../../contracts/collaboration-format"

export class DeclinedParticipationError extends Error {
	override readonly name = "DeclinedParticipationError"

	constructor(
		readonly researcherId: string,
		readonly format: CollaborationFormat,
	) {
		super(`${researcherId} declined ${format}`)
	}
}
