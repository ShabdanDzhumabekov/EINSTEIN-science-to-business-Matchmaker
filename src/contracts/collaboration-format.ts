import { z } from "zod"

export const CollaborationFormat = z.enum(["industrial_phd", "joint_project"])

export type CollaborationFormat = z.infer<typeof CollaborationFormat>
