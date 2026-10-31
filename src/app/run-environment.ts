import { evidenceLedgerMarkdown } from '../features/proposals/domain/evidence-ledger-markdown'
import 'dotenv/config'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadDataset } from '../data/load-dataset'
import type { Proposal } from '../contracts/proposal'
import { MozaikRoleInference } from '../features/inference/adapters/outbound/mozaik-role-inference'
import { OpenRouterCompletion } from '../features/inference/adapters/outbound/openrouter-completion'
import { OpenRouterDecision } from '../features/inference/adapters/outbound/openrouter-decision'
import { MozaikDecision } from '../screening/mozaik-decision'
import { SystemClock } from '../features/inference/adapters/outbound/system-clock'
import { FileJournal } from '../features/inference/adapters/outbound/file-journal'
import { RoleInferenceError } from '../features/inference/domain/role-inference-error'
import { FileArtifacts } from '../features/workflow/adapters/outbound/file-artifacts'
import type { SavedArtifact } from '../features/workflow/domain/saved-artifact'
import type { WorkflowResult } from '../features/workflow/domain/workflow-result'
import { createStages, prefilterThresholdOf } from './create-stages'
import { verifyDataset } from './verify-dataset'
import { ScreeningFiles } from './screening-files'

/* Shared by the challenge run and the Stars run: dataset check, journal, LLM runtime, Jev agent and stages for one run directory. */
export function runEnvironment(directoryPrefix: string) {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('OPENROUTER_API_KEY required')
  process.env.MOZAIK_API_KEY = ''
  const datasetDirectory = process.env.DATASET_DIR ?? 'data/data'
  verifyDataset(datasetDirectory)
  const dataset = loadDataset(datasetDirectory)
  const runId = new Date().toISOString().replace(/[:.]/g, '-')
  const directory = join('runs', `${directoryPrefix}${runId}`)
  mkdirSync(join(directory, 'proposals'), { recursive: true })
  const output = new FileArtifacts(directory, runId)
  const journal = new FileJournal(directory, runId)
  const inference = new MozaikRoleInference({
    modelFast: process.env.MODEL_FAST ?? 'openai/gpt-6.1-sol', modelStrong: process.env.MODEL_STRONG ?? 'openai/gpt-6.1-sol',
    modelCritic: process.env.MODEL_CRITIC ?? process.env.MODEL_STRONG ?? 'openai/gpt-6.1-sol',
    timeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 240000), concurrency: Number(process.env.MAX_CONCURRENT ?? 4), budgetUSD: Number(process.env.BUDGET_USD ?? 4),
    reserveUSD: Number(process.env.REQUEST_RESERVE_USD ?? 0.05), maxOutputTokens: Number(process.env.MAX_OUTPUT_TOKENS ?? 32768),
  }, new OpenRouterCompletion(key), new SystemClock(), journal)
  const decision = new MozaikDecision(new OpenRouterDecision(key, journal))
  const prefilterThreshold = prefilterThresholdOf(process.env.PREFILTER_THRESHOLD)
  const stages = createStages(inference, decision, dataset, new ScreeningFiles(join('runs', 'screening', dataset.version)), { prefilterThreshold })
  const writeProposal = (taskId: string, proposal: SavedArtifact<Proposal>) => {
    const evidenceFile = `../artifacts/${proposal.ref.artifactId}.v${proposal.ref.version}.json`
    writeFileSync(join(directory, 'proposals', `${taskId}.md`), `${proposal.content.markdown}\n\n${evidenceLedgerMarkdown(proposal.content.facts)}\n\n[Full ledger with dataset version](${evidenceFile})\n\nDataset: ${dataset.version}. Synthetic profiles; human review and participant confirmation are required.\n`)
  }
  const failure = (taskId: string, error: unknown): WorkflowResult => {
    const code = error instanceof RoleInferenceError ? error.code : 'stage_failure'
    output.event('task.failed', { taskId, code, errorType: error instanceof Error ? error.constructor.name : 'unknown',
      message: error instanceof Error ? error.message.split(key).join('[REDACTED]') : 'Unexpected failure' })
    console.error(`${taskId}: failed (${code})`)
    return { status: code === 'budget' || code === 'timeout' ? 'limit_reached' : 'execution_failed', taskId, reason: `Execution failed: ${code}; see trace` }
  }
  return { dataset, runId, directory, output, decision, stages, writeProposal, failure }
}
