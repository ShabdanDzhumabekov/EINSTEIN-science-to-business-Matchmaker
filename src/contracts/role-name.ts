import { z } from "zod"

export const RoleName = z.enum(["industry_analyst", "researcher", "matchmaker", "proposal_writer", "critic"])

export type RoleName = z.infer<typeof RoleName>
