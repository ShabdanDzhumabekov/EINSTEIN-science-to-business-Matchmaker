import { z } from "zod"
import { SourceRef } from "./source-ref"

export const SupportedClaim = z.object({
	text: z.string().min(1),
	sources: z.array(SourceRef).min(1),
})

export type SupportedClaim = z.infer<typeof SupportedClaim>
