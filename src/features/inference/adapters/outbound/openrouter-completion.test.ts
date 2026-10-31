import { expect, it } from 'vitest'
import { z } from 'zod'
import { OpenRouterCompletion } from './openrouter-completion'
import { MozaikRoleInference } from './mozaik-role-inference'

it.each([
  { role: 'matchmaker', effort: 'medium' },
  { role: 'industry_analyst', effort: 'medium' },
  { role: 'researcher', effort: 'medium' },
  { role: 'proposal_writer', effort: 'medium' },
  { role: 'critic', effort: 'medium' },
] as const)('sends $effort reasoning to OpenRouter for $role', async ({ role, effort }) => {
  process.env.MOZAIK_API_KEY = ''
  const bodies: unknown[] = []
  const fetcher: typeof fetch = async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)))
    return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: '{"result":true}' } }], usage: { cost: 0 } }))
  }
  const runtime = new MozaikRoleInference({ modelFast: 'deepseek/deepseek-v4.1-flash-1017', modelStrong: 'deepseek/deepseek-v4.1-flash-1017', modelCritic: 'deepseek/deepseek-v4.1-flash-1017',
    timeoutMs: 1000, concurrency: 1, budgetUSD: 1, reserveUSD: 0.05, maxOutputTokens: 16384 },
    new OpenRouterCompletion('test-placeholder', fetcher), { now: () => 0, schedule: () => () => {} }, { record() {} })

  await runtime.infer({ role, instruction: 'Return true.', input: 'test', output: { name: 'reasoning_check', schema: z.boolean() } })

  expect(bodies).toEqual([expect.objectContaining({ reasoning: { effort } })])
})

it('preserves visible output budget by explicitly using low reasoning on DeepSeek Flash 1017', async () => {
  const bodies: unknown[] = []
  const fetcher: typeof fetch = async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)))
    return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: '{"result":true}' } }], usage: { cost: 0 } }))
  }
  const completion = new OpenRouterCompletion('test-placeholder', fetcher)

  await completion.infer({ model: 'deepseek/deepseek-v4.1-flash-1017', instruction: 'test', input: 'test', schemaName: 'test', schema: {}, maxOutputTokens: 6000 }, new AbortController().signal)

  expect(bodies[0]).toMatchObject({ reasoning: { effort: 'low' }, max_tokens: 6000 })
})

it('sends the requested reasoning effort to models other than DeepSeek', async () => {
  const bodies: unknown[] = []
  const fetcher: typeof fetch = async (_url, options) => {
    bodies.push(JSON.parse(String(options?.body)))
    return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: '{"result":true}' } }], usage: { cost: 0 } }))
  }
  const completion = new OpenRouterCompletion('test-placeholder', fetcher)

  await completion.infer({ model: 'openai/gpt-6.1-sol', instruction: 'test', input: 'test', schemaName: 'test', schema: {}, maxOutputTokens: 6000, reasoningEffort: 'medium' }, new AbortController().signal)

  expect(bodies[0]).toMatchObject({ model: 'openai/gpt-6.1-sol', reasoning: { effort: 'medium' } })
})

it('distinguishes output truncation from a provider outage', async () => {
  const fetcher: typeof fetch = async () => new Response(JSON.stringify({ choices: [{ finish_reason: 'length', message: { content: '{"result":' } }] }), { status: 200 })
  const completion = new OpenRouterCompletion('test-placeholder', fetcher)

  const pending = completion.infer({ model: 'offline', instruction: 'test', input: 'test', schemaName: 'test', schema: {}, maxOutputTokens: 1 }, new AbortController().signal)

  await expect(pending).rejects.toMatchObject({ code: 'invalid_output', message: 'Output truncated by maxOutputTokens' })
})

it('sends exactly one HTTP request when the provider rate limits', async () => {
  let requests = 0
  const bodies: unknown[] = []
  const fetcher: typeof fetch = async (_url, options) => {
    requests++; bodies.push(JSON.parse(String(options?.body)))
    return new Response('{}', { status: 429 })
  }
  const completion = new OpenRouterCompletion('test-placeholder', fetcher)

  const response = completion.infer({ model: 'offline', instruction: 'test', input: 'test', schemaName: 'test',
    schema: { type: 'object', properties: {} }, maxOutputTokens: 123 }, new AbortController().signal)

  await expect(response).rejects.toMatchObject({ code: 'provider', message: 'OpenRouter HTTP 429' })
  expect(requests).toBe(1)
  expect(z.object({ max_tokens: z.literal(123), response_format: z.object({ type: z.literal('json_schema') }) }).parse(bodies[0]).max_tokens).toBe(123)
})
