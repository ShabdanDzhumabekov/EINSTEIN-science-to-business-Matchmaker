import { z } from "zod"

export const QualityFlag = z.enum(["authorship_conflict", "duplicate_name", "missing_bio", "stale_profile", "non_english"])

export type QualityFlag = z.infer<typeof QualityFlag>
