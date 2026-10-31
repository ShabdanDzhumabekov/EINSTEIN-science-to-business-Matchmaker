import type { SupportedClaim } from "../contracts/supported-claim"

export function withDatasetVersion(claim: SupportedClaim, datasetVersion: string): SupportedClaim {
	return { ...claim, sources: claim.sources.map((source) => ({ ...source, datasetVersion })) }
}
