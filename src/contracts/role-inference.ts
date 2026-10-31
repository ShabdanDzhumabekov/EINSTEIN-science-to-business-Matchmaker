import type { z } from "zod"
import type { RoleName } from "./role-name"

export type RoleInferenceRequest<Output> = {
	role: RoleName
	instruction: string
	input: string
	output: { name: string; schema: z.ZodType<Output> }
}

/* Implemented by the runtime (developer B): one Mozaik agent loop per call, with timeout, budget and trace. */
export interface RoleInference {
	infer<Output>(request: RoleInferenceRequest<Output>): Promise<Output>
}
