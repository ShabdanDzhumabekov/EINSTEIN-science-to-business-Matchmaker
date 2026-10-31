import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { ArtifactRef } from '../contracts/artifact-ref'
import { CriticIssue } from '../contracts/critic-issue'

const TraceEntry = z.object({ seq: z.number(), at: z.string(), type: z.string(), details: z.record(z.string(), z.unknown()) })
const InferenceEntry = z.object({ event: z.string(), details: z.record(z.string(), z.unknown()) })
const textCell = (text: string) => text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')

/* A validation repair carries the rejected draft in its first issue; the table shows the violations, the JSONL keeps the draft. */
function eventDetail(entry: z.infer<typeof TraceEntry>): string {
  if (entry.type !== 'validation.revise') return JSON.stringify(entry.details)
  const issues = z.array(CriticIssue).parse(entry.details.issues)
  return `${String(entry.details.owner)}: ${issues.map(issue => issue.explanation).join('; ')}`
}

export function renderRun(directory: string): void {
  const entries = readFileSync(join(directory, 'trace.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(line => TraceEntry.parse(JSON.parse(line)))
  const inferencePath = join(directory, 'inference.jsonl')
  const inference = (existsSync(inferencePath) ? readFileSync(inferencePath, 'utf8') : '').trim().split('\n').filter(Boolean).map(line => InferenceEntry.parse(JSON.parse(line)))
  const lines = ['# Run trace', '', 'This report is generated from the adjacent JSONL logs. Artifact links identify immutable versions.', '',
    '| Seq | Time (UTC) | Event | Subject / detail |', '|---:|---|---|---|']
  for (const entry of entries) {
    const subject = ArtifactRef.safeParse(entry.details.subject)
    const detail = subject.success ? `${subject.data.artifactId}@${subject.data.version}` : eventDetail(entry)
    lines.push(`| ${entry.seq} | ${entry.at} | ${entry.type} | ${textCell(detail)} |`)
  }
  lines.push('', '## Critic interventions', '')
  const corrections = entries.filter(entry => entry.type === 'critic.revise')
  if (!corrections.length) lines.push('No Critic revision occurred in this run. Validation repairs, if present, are separate events.')
  for (const entry of corrections) {
    const subject = ArtifactRef.parse(entry.details.subject)
    const issues = z.array(CriticIssue).parse(entry.details.issues)
    const original = `artifacts/${subject.artifactId}.v${subject.version}.json`
    const revised = `artifacts/${subject.artifactId}.v${subject.version + 1}.json`
    lines.push(`### Event ${entry.seq}: ${subject.artifactId}@${subject.version}`, '', `[Before](${original})${existsSync(join(directory, revised)) ? ` · [Next version](${revised})` : ' · No next version was accepted in this run.'}`, '')
    for (const issue of issues) lines.push(`- **${issue.category} → ${issue.owner}:** ${issue.explanation}`)
    lines.push('')
  }
  const receipts = inference.filter(entry => entry.event === 'request.received')
  const costs = receipts.flatMap(entry => typeof entry.details.costUSD === 'number' ? [entry.details.costUSD] : [])
  const dispatched = inference.filter(entry => entry.event === 'request.dispatched').length
  const metrics = { dispatchedRequests: dispatched, reportedCostUSD: costs.reduce((sum, cost) => sum + cost, 0),
    requestsWithoutKnownBill: Math.max(0, dispatched - costs.length), criticInterventions: corrections.length,
    models: [...new Set(inference.flatMap(entry => (entry.event === 'inference.started' || entry.event === 'request.dispatched') && typeof entry.details.model === 'string' ? [entry.details.model] : []))] }
  lines.push('## Measured inference', '', `- HTTP requests dispatched: ${metrics.dispatchedRequests}`,
    `- Reported cost for known bills: $${metrics.reportedCostUSD.toFixed(6)}`,
    `- Requests without a known bill: ${metrics.requestsWithoutKnownBill}`,
    '- Missing bills are not treated as free. Failed prior runs are not included in this run total.')
  writeFileSync(join(directory, 'trace.md'), lines.join('\n') + '\n')
  writeFileSync(join(directory, 'metrics.json'), JSON.stringify(metrics, null, 2))
}
