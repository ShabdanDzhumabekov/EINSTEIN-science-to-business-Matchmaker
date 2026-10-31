import 'dotenv/config'
import { mkdirSync, writeFileSync } from 'node:fs'
import { z } from 'zod'
import { MozaikRoleInference } from '../features/inference/adapters/outbound/mozaik-role-inference'
import { OpenRouterCompletion } from '../features/inference/adapters/outbound/openrouter-completion'
import { SystemClock } from '../features/inference/adapters/outbound/system-clock'
import { FileJournal } from '../features/inference/adapters/outbound/file-journal'
import { RoleInferenceError } from '../features/inference/domain/role-inference-error'

const key = process.env.OPENROUTER_API_KEY
if (!key) throw new Error('OPENROUTER_API_KEY required')
process.env.MOZAIK_API_KEY = ''
const runId = `smoke-${new Date().toISOString().replace(/[:.]/g, '-')}`
const directory = `runs/${runId}`
mkdirSync(directory, { recursive: true })
const inference = new MozaikRoleInference({
  modelFast: process.env.MODEL_FAST ?? 'openai/gpt-6.1-sol', modelStrong: process.env.MODEL_STRONG ?? 'openai/gpt-6.1-sol',
    modelCritic: process.env.MODEL_CRITIC ?? process.env.MODEL_STRONG ?? 'openai/gpt-6.1-sol',
  timeoutMs: 60000, concurrency: 2, budgetUSD: 0.1, reserveUSD: 0.02, maxOutputTokens: 512,
}, new OpenRouterCompletion(key), new SystemClock(), new FileJournal(directory, runId))
try {
  const outputs = await Promise.all([
    inference.infer({ role: 'industry_analyst', instruction: 'Read only supplied evidence; return the copied record ID and number.', input: 'Record C034-CH1: outside-help budget is under 500 euros.',
      output: { name: 'budget_smoke', schema: z.object({ recordId: z.literal('C034-CH1'), limit: z.literal(500) }) } }),
    inference.infer({ role: 'researcher', instruction: 'Read only supplied evidence; do not infer a booking from an offer.', input: 'Record R0325: access to a scanner could be arranged. No booking is confirmed.',
      output: { name: 'availability_smoke', schema: z.object({ recordId: z.literal('R0325'), bookingConfirmed: z.literal(false) }) } }),
  ])
  writeFileSync(`${directory}/summary.json`, JSON.stringify({ kind: 'live_transport_smoke', passed: true, outputs }, null, 2))
  console.log(`Live smoke passed: ${directory}`)
} catch (error) {
  inference.cancel()
  const code = error instanceof RoleInferenceError ? error.code : 'unexpected'
  writeFileSync(`${directory}/summary.json`, JSON.stringify({ kind: 'live_transport_smoke', passed: false, code }, null, 2))
  console.error(`Live smoke failed (${code}); see ${directory}`)
  process.exitCode = 1
}
