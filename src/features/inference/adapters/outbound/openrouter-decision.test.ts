import { expect, it } from 'vitest'
import { OpenRouterDecision } from './openrouter-decision'

function jevResponse(answers: Record<string, number>) {
  return new Response(JSON.stringify({ model: 'typesafe/jev-1.14-20261014',
    answers: Object.fromEntries(Object.entries(answers).map(([key, noul]) => [key, { type: 'noul', noul }])), usage: { cost: 0.00002 } }))
}

function fitQuestions() {
  return [{ key: 'fit_R1', instructions: 'Do the methods of R1 address the task?', whenTrue: 'relevant', whenFalse: 'unrelated' }]
}

it('returns the probability Jev assigns to each question', async () => {
  const decision = new OpenRouterDecision('test-placeholder', { record() {} }, async () => jevResponse({ fit_R1: 0.73 }))

  const probabilities = await decision.probabilities({ task: 'x' }, fitQuestions())

  expect([...probabilities]).toEqual([['fit_R1', 0.73]])
})

it('sends noul questions to the Jev decisions endpoint', async () => {
  const requests: Array<{ url: string; body: unknown }> = []
  const fetcher: typeof fetch = async (url, options) => {
    requests.push({ url: String(url), body: JSON.parse(String(options?.body)) })
    return jevResponse({ fit_R1: 1 })
  }
  const decision = new OpenRouterDecision('test-placeholder', { record() {} }, fetcher)

  await decision.probabilities({ task: 'x' }, fitQuestions())

  expect(requests).toEqual([{ url: 'https://openrouter.ai/api/alpha/decisions', body: { model: 'typesafe/jev-1.14', state: { task: 'x' },
    questions: { fit_R1: { type: 'noul', instructions: 'Do the methods of R1 address the task?', criteria: { true: 'relevant', false: 'unrelated' } } } } }])
})

it('records the reported cost of each Jev call', async () => {
  const records: Array<{ event: string; details: unknown }> = []
  const decision = new OpenRouterDecision('test-placeholder', { record: (event, details) => { records.push({ event, details }) } }, async () => jevResponse({ fit_R1: 1 }))

  await decision.probabilities({ task: 'x' }, fitQuestions())

  expect(records.find(record => record.event === 'request.received')?.details).toMatchObject({ model: 'typesafe/jev-1.14', costUSD: 0.00002 })
})

it('rejects an answer that misses a question', async () => {
  const decision = new OpenRouterDecision('test-placeholder', { record() {} }, async () => jevResponse({ other: 1 }))

  const pending = decision.probabilities({ task: 'x' }, fitQuestions())

  await expect(pending).rejects.toMatchObject({ code: 'provider', message: 'Jev returned no answer for fit_R1' })
})

it('reports an HTTP failure as a provider error', async () => {
  const decision = new OpenRouterDecision('test-placeholder', { record() {} }, async () => new Response('{}', { status: 503 }))

  const pending = decision.probabilities({ task: 'x' }, fitQuestions())

  await expect(pending).rejects.toMatchObject({ code: 'provider', message: 'Jev HTTP 503' })
})

it('reports a broken response body as a provider error', async () => {
  const decision = new OpenRouterDecision('test-placeholder', { record() {} }, async () => new Response('{"answers": {"fit_R1"'))

  const pending = decision.probabilities({ task: 'x' }, fitQuestions())

  await expect(pending).rejects.toMatchObject({ code: 'provider', message: 'Jev response could not be read' })
})

it('names the network cause when the Jev request itself fails', async () => {
  const decision = new OpenRouterDecision('test-placeholder', { record() {} }, async () => { throw new TypeError('fetch failed: ECONNRESET') })

  const pending = decision.probabilities({ task: 'x' }, fitQuestions())

  await expect(pending).rejects.toMatchObject({ code: 'provider', message: 'Jev request failed: fetch failed: ECONNRESET' })
})

it('sends at most six Jev requests at a time', async () => {
  let inFlight = 0; let peak = 0
  const fetcher: typeof fetch = async () => {
    inFlight++; peak = Math.max(peak, inFlight)
    await new Promise(resolve => setTimeout(resolve, 5))
    inFlight--
    return jevResponse({ fit_R1: 0.5 })
  }
  const decision = new OpenRouterDecision('test-placeholder', { record() {} }, fetcher)

  await Promise.all(Array.from({ length: 20 }, () => decision.probabilities({ task: 'x' }, fitQuestions())))

  expect(peak).toBe(6)
})
