import type { Completion } from '../../ports/outbound/completion'
import { z } from 'zod'
import { RoleInferenceError } from '../../domain/role-inference-error'

export class OpenRouterCompletion implements Completion {
  constructor(private readonly apiKey: string, private readonly fetcher: typeof fetch = fetch) {
    if (!apiKey) throw new TypeError('OPENROUTER_API_KEY is required')
  }
  async infer(request: Parameters<Completion['infer']>[0], signal: AbortSignal): ReturnType<Completion['infer']> {
    const response = await this.fetcher('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', signal, headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: request.model, max_tokens: request.maxOutputTokens,
        reasoning: { effort: request.reasoningEffort ?? 'low' },
        messages: [
          { role: 'system', content: `${request.instruction}\nReturn only a JSON object with one field named result containing the requested output.` },
          { role: 'user', content: request.input },
        ], provider: { require_parameters: true },
        /* A schemas have optional fields; validate their constraints locally without claiming strict provider support. */
        response_format: { type: 'json_schema', json_schema: { name: request.schemaName, strict: false, schema: request.schema } },
      }),
    })
    if (!response.ok) {
      if (response.body) await response.body.cancel()
      throw new RoleInferenceError('provider', `OpenRouter HTTP ${response.status}`)
    }
    const payload: unknown = await response.json()
    const termination = z.object({ choices: z.array(z.object({ finish_reason: z.string() })) }).safeParse(payload)
    if (termination.success && termination.data.choices[0]?.finish_reason === 'length') {
      throw new RoleInferenceError('invalid_output', 'Output truncated by maxOutputTokens')
    }
    const parsed = z.object({
      choices: z.array(z.object({ finish_reason: z.literal('stop'), message: z.object({ content: z.string().min(1),
        tool_calls: z.array(z.unknown()).max(0).optional() }) })).length(1),
      usage: z.object({ cost: z.number().finite().nonnegative().optional() }).optional(),
    }).safeParse(payload)
    if (!parsed.success) throw new RoleInferenceError('provider', 'Provider returned an incomplete or unsupported response')
    const choice = parsed.data.choices[0]
    if (!choice) throw new RoleInferenceError('provider', 'Provider returned no choice')
    return { text: choice.message.content, costUSD: parsed.data.usage?.cost }
  }
}
