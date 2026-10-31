import type { Dataset } from "../data/dataset"
import { resolveSource, type SourceLocation } from "./resolve-source"

export function sourceMaterial(dataset: Dataset, locations: ReadonlyArray<SourceLocation>): string {
	return locations
		.flatMap((location) => {
			const source = resolveSource(dataset, location)
			if (source.status !== "resolved") return []
			return source.passages
				.filter((passage) => passage.trim() !== "")
				.map((passage) => `[${location.recordId}.${location.field}] ${passage}`)
		})
		.join("\n")
}
