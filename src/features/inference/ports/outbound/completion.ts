export interface Completion {
  infer(request: {
    model: string
    instruction: string
    input: string
    schemaName: string
    schema: Record<string, unknown>
    maxOutputTokens: number
    reasoningEffort?: 'low' | 'medium'
  }, signal: AbortSignal): Promise<{ text: string; costUSD?: number }>
}
