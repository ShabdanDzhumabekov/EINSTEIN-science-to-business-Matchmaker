import { expect, it } from 'vitest'
import { evidenceLedgerMarkdown } from './evidence-ledger-markdown'

it('lists every source of every fact with its record, field and quote', () => {
  const facts = [
    { text: 'The company has unlabelled captures.', sources: [{ recordId: 'C001', field: 'challenges[0].detail', quote: 'several terabytes of captures', datasetVersion: 'd@1' }] },
    { text: 'Kiss models Modbus timing.', sources: [
      { recordId: 'SYN-PUB-00001', field: 'abstract', quote: 'per-register timing', datasetVersion: 'd@1' },
      { recordId: 'R1008', field: 'bio', quote: 'Modbus baselines', datasetVersion: 'd@1' },
    ] },
  ]

  expect(evidenceLedgerMarkdown(facts)).toBe([
    '## Evidence ledger', '', '| Fact | Record | Field | Quote |', '|---|---|---|---|',
    '| F1 | C001 | challenges[0].detail | "several terabytes of captures" |',
    '| F2 | SYN-PUB-00001 | abstract | "per-register timing" |',
    '| F2 | R1008 | bio | "Modbus baselines" |',
  ].join('\n'))
})

it('escapes a pipe inside a quote so the table keeps its columns', () => {
  const facts = [{ text: 'A fact.', sources: [{ recordId: 'C001', field: 'tech', quote: 'Modbus | BACnet', datasetVersion: 'd@1' }] }]

  expect(evidenceLedgerMarkdown(facts)).toContain('| F1 | C001 | tech | "Modbus \\| BACnet" |')
})
