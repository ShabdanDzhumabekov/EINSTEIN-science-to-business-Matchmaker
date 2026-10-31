import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { renderRun } from './render-run'

it('renders a run that made no model request', () => {
  const directory = mkdtempSync(join(tmpdir(), 'render-run-'))
  writeFileSync(join(directory, 'trace.jsonl'), `${JSON.stringify({ seq: 1, at: '2026-10-31T00:00:00Z', type: 'task.screened_out', details: { taskId: 'C001-CH1' } })}\n`)

  renderRun(directory)

  expect(JSON.parse(readFileSync(join(directory, 'metrics.json'), 'utf8'))).toMatchObject({ dispatchedRequests: 0 })
})

it('shows a validation repair as its violations without the rejected draft', () => {
  const directory = mkdtempSync(join(tmpdir(), 'render-run-'))
  const issue = { category: 'unsupported_claim', severity: 'blocking', owner: 'proposal_writer', sources: [],
    claim: '{"title":"DRAFT_BODY"}', explanation: 'constraint "No labels." has no source cited in facts' }
  writeFileSync(join(directory, 'trace.jsonl'), `${JSON.stringify({ seq: 7, at: '2026-10-31T00:00:00Z', type: 'validation.revise', details: { owner: 'proposal_writer', issues: [issue] } })}\n`)

  renderRun(directory)

  const report = readFileSync(join(directory, 'trace.md'), 'utf8')
  expect([report.includes('proposal_writer: constraint "No labels." has no source cited in facts'), report.includes('DRAFT_BODY')]).toEqual([true, false])
})

it('lists the Jev model among the models of a run', () => {
  const directory = mkdtempSync(join(tmpdir(), 'render-run-'))
  writeFileSync(join(directory, 'trace.jsonl'), `${JSON.stringify({ seq: 1, at: '2026-10-31T00:00:00Z', type: 'task.screened_out', details: { taskId: 'C001-CH1' } })}\n`)
  writeFileSync(join(directory, 'inference.jsonl'), [
    { event: 'inference.started', details: { model: 'openai/gpt-6.1-sol' } },
    { event: 'request.dispatched', details: { model: 'typesafe/jev-1.14', questions: 3 } },
  ].map(entry => JSON.stringify(entry)).join('\n') + '\n')

  renderRun(directory)

  expect(JSON.parse(readFileSync(join(directory, 'metrics.json'), 'utf8')).models).toEqual(['openai/gpt-6.1-sol', 'typesafe/jev-1.14'])
})
