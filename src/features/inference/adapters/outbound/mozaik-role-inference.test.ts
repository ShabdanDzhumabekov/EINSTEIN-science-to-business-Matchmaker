import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { PairAssessment } from '../../../../contracts/pair-assessment'
import { analyzeIndustry } from '../../../../agents/industry/analyze-industry'
import { aCompany, aDataset } from '../../../../test-support/dataset-builders'
import type { Clock } from '../../ports/outbound/clock'
import type { Completion } from '../../ports/outbound/completion'
import type { Journal } from '../../ports/outbound/journal'
import { MozaikRoleInference } from './mozaik-role-inference'

function controlledClock() {
  let timestamp = 0
  const timers = new Set<() => void>()
  return {
    now: () => timestamp,
    schedule(callback: () => void) { timers.add(callback); return () => { timers.delete(callback) } },
    advance(milliseconds: number, shouldFire = true) { timestamp += milliseconds; if (shouldFire) [...timers].forEach(callback => callback()) },
  }
}
function inference(completion: Completion, clock: Clock, journal: Journal = { record() {} }, budgetUSD = 1) {
  process.env.MOZAIK_API_KEY = ''
  return new MozaikRoleInference({ modelFast: 'offline', modelStrong: 'offline', modelCritic: 'reviewer', timeoutMs: 10,
    concurrency: 2, budgetUSD, reserveUSD: 0.1, maxOutputTokens: 100 }, completion, clock, journal)
}
function request() {
  return { role: 'researcher' as const, instruction: 'Offline test', input: 'one task', output: { name: 'test', schema: z.strictObject({ answer: z.string() }) } }
}

describe('RoleInference contract through real Mozaik loops with synthetic completions', () => {
  it('lets the real Industry role repair a source quote through Mozaik', async () => {
    const dataset = aDataset({ companies: [aCompany({ challenges: [{ id: 'C001-CH1', text: 'Detect anomalies', detail: 'We have no attack examples.' }] })] })
    let requests = 0
    const runtime = inference({ async infer() {
      requests++
      const claim = { text: 'The company has no attack examples.', sources: [{ recordId: 'C001-CH1', field: 'detail',
        quote: requests === 1 ? 'Invented quote' : 'We have no attack examples.', datasetVersion: 'model-value' }] }
      return { text: JSON.stringify({ result: { problem: claim, goal: claim, constraints: [], resources: [], unknowns: [],
        researchFit: { kind: 'research_problem', reason: 'Requires method research' }, searchQueries: [{ kind: 'methods', text: 'unsupervised detection' }] } }), costUSD: 0 }
    } }, controlledClock())

    const card = await analyzeIndustry(runtime, dataset, 'C001-CH1')

    expect(card.problem.sources[0]?.quote).toBe('We have no attack examples.')
    expect(card.problem.sources[0]?.datasetVersion).toBe(dataset.version)
    expect(requests).toBe(2)
  })
  it('sends the Critic to its own model and the Writer to the strong one', async () => {
    const models: string[] = []
    const runtime = inference({ async infer(completionRequest) { models.push(completionRequest.model); return { text: '{"result":{"answer":"ok"}}', costUSD: 0 } } }, controlledClock())

    await runtime.infer({ ...request(), role: 'critic' })
    await runtime.infer({ ...request(), role: 'proposal_writer' })

    expect(models).toEqual(['reviewer', 'offline'])
  })
  it('rejects configuration whose request reservation exceeds the whole budget', () => {
    const clock = controlledClock()

    const construct = () => inference({ async infer() { return { text: '{}' } } }, clock, undefined, 0.05)

    expect(construct).toThrow(RangeError)
  })
  it('rejects an unsupported output schema through the Promise contract', async () => {
    const runtime = inference({ async infer() { return { text: '{}' } } }, controlledClock())

    const pending = runtime.infer({ ...request(), output: { name: 'transform', schema: z.string().transform(text => text.length) } })

    await expect(pending).rejects.toMatchObject({ code: 'invalid_output' })
  })
  it('returns the schema-validated output to A', async () => {
    const runtime = inference({ async infer() { return { text: '{"result":{"answer":"supported"}}', costUSD: 0 } } }, controlledClock())

    const result = await runtime.infer(request())

    expect(result).toEqual({ answer: 'supported' })
  })
  it('supports the discriminated union used by Matchmaker', async () => {
    const runtime = inference({ async infer() { return { text: '{"result":{"outcome":"no_fit","taskId":"C001-CH1","researcherId":"R0007","reason":"Method requires absent labels","inputs":[{"artifactId":"task","version":1}]}}', costUSD: 0 } } }, controlledClock())

    const result = await runtime.infer({ ...request(), output: { name: 'pair', schema: PairAssessment } })

    expect(result.outcome).toBe('no_fit')
  })
  it('rejects malformed model output as invalid_output', async () => {
    const runtime = inference({ async infer() { return { text: '{"result":{"wrong":true}}', costUSD: 0 } } }, controlledClock())

    const pending = runtime.infer(request())

    await expect(pending).rejects.toMatchObject({ code: 'invalid_output' })
  })
  it('rejects a response after deadline even before its timer has fired', async () => {
    const clock = controlledClock()
    const started = Promise.withResolvers<void>()
    const response = Promise.withResolvers<{ text: string; costUSD: number }>()
    const runtime = inference({ async infer() { started.resolve(); return response.promise } }, clock)
    const pending = runtime.infer(request())
    const rejected = expect(pending).rejects.toMatchObject({ code: 'timeout' })
    await started.promise

    clock.advance(11, false)
    response.resolve({ text: '{"result":{"answer":"late"}}', costUSD: 0 })

    await rejected
  })
  it('rejects immediately when the deadline timer fires', async () => {
    const clock = controlledClock()
    const response = Promise.withResolvers<{ text: string }>()
    const runtime = inference({ async infer() { return response.promise } }, clock)
    const pending = runtime.infer(request())
    const rejected = expect(pending).rejects.toMatchObject({ code: 'timeout' })

    clock.advance(11)
    response.resolve({ text: '{"result":{"answer":"late"}}' })

    await rejected
  })
  it('runs independent tasks concurrently', async () => {
    const firstStarted = Promise.withResolvers<void>()
    const secondStarted = Promise.withResolvers<void>()
    const response = Promise.withResolvers<{ text: string; costUSD: number }>()
    let requests = 0
    const runtime = inference({ async infer() { requests++; if (requests === 1) firstStarted.resolve(); else secondStarted.resolve(); return response.promise } }, controlledClock())
    const first = runtime.infer(request())
    const second = runtime.infer({ ...request(), role: 'industry_analyst', input: 'separate task' })
    await Promise.all([firstStarted.promise, secondStarted.promise])

    response.resolve({ text: '{"result":{"answer":"checked"}}', costUSD: 0 })
    const results = await Promise.all([first, second])

    expect(results).toEqual([{ answer: 'checked' }, { answer: 'checked' }])
  })
  it('retains uncertain spend after a provider failure', async () => {
    let requests = 0
    const runtime = inference({ async infer() { requests++; throw new Error('Provider failed') } }, controlledClock(), undefined, 0.1)
    await expect(runtime.infer(request())).rejects.toMatchObject({ code: 'provider' })

    const pending = runtime.infer(request())

    await expect(pending).rejects.toMatchObject({ code: 'budget' })
    expect(requests).toBe(1)
  })
  it('reports an actual bill that exceeds the reserved budget', async () => {
    const runtime = inference({ async infer() { return { text: '{"result":{"answer":"checked"}}', costUSD: 2 } } }, controlledClock())

    const pending = runtime.infer(request())

    await expect(pending).rejects.toMatchObject({ code: 'budget' })
  })
  it('stops subsequent requests after journal failure', async () => {
    const runtime = inference({ async infer() { return { text: '{"result":{"answer":"checked"}}' } } }, controlledClock(), { record() { throw new Error('Disk failed') } })
    await expect(runtime.infer(request())).rejects.toMatchObject({ code: 'journal' })

    const pending = runtime.infer(request())

    await expect(pending).rejects.toMatchObject({ code: 'journal' })
  })
})
