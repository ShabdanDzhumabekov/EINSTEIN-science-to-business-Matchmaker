export interface InferenceSettings {
  readonly modelFast: string
  readonly modelStrong: string
  /* The Critic reviews on its own model so that it does not share the Writer's blind spots. */
  readonly modelCritic: string
  readonly timeoutMs: number
  readonly concurrency: number
  readonly budgetUSD: number
  readonly reserveUSD: number
  readonly maxOutputTokens: number
}
