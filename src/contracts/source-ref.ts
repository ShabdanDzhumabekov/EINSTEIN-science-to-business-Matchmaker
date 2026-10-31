import { z } from "zod"

export const SourceRef = z.object({
	recordId: z.string().min(1),
	field: z.string().min(1),
	quote: z.string().min(1),
	datasetVersion: z.string().min(1),
})

export type SourceRef = z.infer<typeof SourceRef>
