import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CollaborationWorkflow } from '../features/workflow/application/collaboration-workflow'
import type { WorkflowResult } from '../features/workflow/domain/workflow-result'
import { screenScholar } from '../screening/screen-scholar'
import { renderRun } from './render-run'
import { runEnvironment } from './run-environment'
import { starsReport, type StarsAttempt } from './stars-report'

/* Reverse search for the EINSTEIN Stars scenario: one researcher against every challenge, then the usual checks on the first few. */
const PAIRS_CHECKED_IN_DEPTH = 3
const SCREENING = { threshold: 0.5, maxBatchChallenges: 25, maxBatchBytes: 96 * 1024 }

const { dataset, runId, directory, output, decision, stages, writeProposal, failure } = runEnvironment('stars-')
const researcherId = process.env.RUN_SCHOLAR ?? ''
const researcher = dataset.researchers.get(researcherId)
if (researcher === undefined) throw new Error('RUN_SCHOLAR must be one researcher ID from the dataset')
console.log(`Stars search for ${researcherId} (${directory})`)
const businesses = [...dataset.challenges.keys()].map(taskId => stages.businessCard(taskId))
const screening = await screenScholar(decision, stages.scholarCard(researcherId), businesses, SCREENING)
const kept = screening.challenges.filter(challenge => challenge.isKept)
writeFileSync(join(directory, 'stars-screening.json'), JSON.stringify({ ...screening, provenance: { screenedAt: new Date().toISOString(), isFromCache: false } }, null, 2))
output.event('stars.screened', { researcherId, screened: screening.challenges.length, kept: kept.length, batches: screening.batches })
console.log(`Screened ${screening.challenges.length} challenges, ${kept.length} kept`)
const attempts: StarsAttempt[] = await Promise.all(kept.slice(0, PAIRS_CHECKED_IN_DEPTH).map(async ({ taskId }) => {
  let result: WorkflowResult
  try { result = await new CollaborationWorkflow(runId, dataset.version, stages, output).runPair(taskId, researcherId) }
  catch (error) { result = failure(taskId, error) }
  if (result.status === 'ready') writeProposal(taskId, result.proposal)
  console.log(`${taskId}: ${result.status}`)
  return { taskId, status: result.status, ...(result.status === 'ready' ? { proposalPath: `proposals/${taskId}.md` } : {}) }
}))
writeFileSync(join(directory, 'stars-report.md'), starsReport({ researcherName: researcher.name, screening,
  companyNames: new Map([...dataset.companies.values()].map(company => [company.id, company.name])), attempts }))
writeFileSync(join(directory, 'summary.json'), JSON.stringify({ runId, datasetVersion: dataset.version, researcherId, screened: screening.challenges.length, kept: kept.length, attempts }, null, 2))
renderRun(directory)
console.log(`Run saved: ${directory}`)
