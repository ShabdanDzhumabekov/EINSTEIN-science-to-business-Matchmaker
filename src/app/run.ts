import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CollaborationWorkflow } from '../features/workflow/application/collaboration-workflow'
import { renderRun } from './render-run'
import { runEnvironment } from './run-environment'
import type { WorkflowResult } from '../features/workflow/domain/workflow-result'

const { dataset, runId, directory, output, stages, writeProposal, failure } = runEnvironment('')
const requestedTasks = process.env.RUN_TASKS ?? 'C001-CH1'
const taskIds = requestedTasks === 'all' ? [...dataset.challenges.keys()] : requestedTasks.split(',')
if (new Set(taskIds).size !== taskIds.length || taskIds.some(id => !dataset.challenges.has(id))) throw new Error('RUN_TASKS must be "all" or unique challenge IDs from the dataset')
const taskConcurrency = Number(process.env.TASK_CONCURRENCY ?? 3)
/* Tasks run at the same time: each has its own workflow and artifact IDs; the shared runtime bounds requests and budget. */
const runTask = async (taskId: string): Promise<WorkflowResult> => {
  try {
    console.log(`Processing ${taskId} (${directory})`)
    const workflow = new CollaborationWorkflow(runId, dataset.version, stages, output)
    const result = await workflow.run(taskId)
    if (result.status === 'ready') writeProposal(taskId, result.proposal)
    console.log(`${taskId}: ${result.status}`)
    return result
  } catch (error) {
    return failure(taskId, error)
  }
}
/* Up to TASK_CONCURRENCY tasks are in flight at once; a request's deadline starts when it is made, so the rest wait here, not in the runtime queue. */
const results: WorkflowResult[] = new Array(taskIds.length)
let nextTask = 0
await Promise.all(Array.from({ length: Math.min(taskConcurrency, taskIds.length) }, async () => {
  for (let position = nextTask++; position < taskIds.length; position = nextTask++) {
    const taskId = taskIds[position]
    if (taskId !== undefined) results[position] = await runTask(taskId)
  }
}))
writeFileSync(join(directory, 'summary.json'), JSON.stringify({ runId, datasetVersion: dataset.version, results }, null, 2))
renderRun(directory)
console.log(`Run saved: ${directory}`)
if (results.some(result => result.status !== 'ready')) process.exitCode = 1
