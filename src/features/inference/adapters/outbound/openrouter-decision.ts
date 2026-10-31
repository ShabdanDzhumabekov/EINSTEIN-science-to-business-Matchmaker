import { z } from 'zod'
import type { Decision, NoulQuestion } from '../../../../contracts/decision'
import { RoleInferenceError } from '../../domain/role-inference-error'
import type { Journal } from '../../ports/outbound/journal'

const JEV_MODEL = 'typesafe/jev-1.14'

const JevAnswer = z.object({
  answers: z.record(z.string(), z.object({ noul: z.number().min(0).max(1) })),
  usage: z.object({ cost: z.number().finite().nonnegative().optional() }).optional(),
})

export class OpenRouterDecision implements Decision {
  constructor(private readonly apiKey: string, private readonly journal: Journal, private readonly fetcher: typeof fetch = fetch) {
    if (!apiKey) throw new TypeError('OPENROUTER_API_KEY is required')
  }
  async probabilities(state: Readonly<Record<string, unknown>>, questions: ReadonlyArray<NoulQuestion>): Promise<ReadonlyMap<string, number>> {
    this.journal.record('request.dispatched', { model: JEV_MODEL, questions: questions.length })
    let response: Response
    try {
      response = await this.fetcher('https://openrouter.ai/api/alpha/decisions', {
        method: 'POST', signal: AbortSignal.timeout(180000), headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: JEV_MODEL, state, questions: Object.fromEntries(questions.map(question => [question.key,
          { type: 'noul', instructions: question.instructions, criteria: { true: question.whenTrue, false: question.whenFalse } }])) }),
      })
    } catch (cause) {
      throw new RoleInferenceError(cause instanceof DOMException && cause.name === 'TimeoutError' ? 'timeout' : 'provider', 'Jev request failed', { cause })
    }
    if (!response.ok) {
      if (response.body) await response.body.cancel()
      throw new RoleInferenceError('provider', `Jev HTTP ${response.status}`)
    }
    let payload: unknown
    try { payload = await response.json() }
    catch (cause) {
      throw new RoleInferenceError(cause instanceof DOMException && cause.name === 'TimeoutError' ? 'timeout' : 'provider', 'Jev response could not be read', { cause })
    }
    const parsed = JevAnswer.safeParse(payload)
    if (!parsed.success) throw new RoleInferenceError('provider', 'Jev returned an unsupported response')
    this.journal.record('request.received', { model: JEV_MODEL, costUSD: parsed.data.usage?.cost ?? null })
    return new Map(questions.map(question => {
      const answer = parsed.data.answers[question.key]
      if (answer === undefined) throw new RoleInferenceError('provider', `Jev returned no answer for ${question.key}`)
      return [question.key, answer.noul]
    }))
  }
}
