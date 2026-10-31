import { z } from "zod"

export const ArtifactRef = z.object({
	artifactId: z.string().min(1),
	version: z.number().int().positive(),
})

export type ArtifactRef = z.infer<typeof ArtifactRef>
