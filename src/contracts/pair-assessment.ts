import { z } from "zod"
import { ArtifactRef } from "./artifact-ref"
import { CollaborationFormat } from "./collaboration-format"
import { SupportedClaim } from "./supported-claim"

const ProposedPair = z.object({
	outcome: z.literal("pair"),
	taskId: z.string().min(1),
	researcherId: z.string().min(1),
	format: CollaborationFormat,
	jointProblem: z.string().min(1),
	rationale: z.array(SupportedClaim).min(1),
	constraints: z.array(SupportedClaim),
	risks: z.array(z.string().min(1)),
	questions: z.array(z.string().min(1)),
	inputs: z.array(ArtifactRef).min(1),
})

const NoFit = z.object({
	outcome: z.literal("no_fit"),
	taskId: z.string().min(1),
	researcherId: z.string().min(1),
	reason: z.string().min(1),
	inputs: z.array(ArtifactRef).min(1),
})

export const PairAssessment = z.discriminatedUnion("outcome", [ProposedPair, NoFit])

export type PairAssessment = z.infer<typeof PairAssessment>
