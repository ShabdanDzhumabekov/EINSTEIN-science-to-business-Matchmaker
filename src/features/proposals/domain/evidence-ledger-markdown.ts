import type { SupportedClaim } from '../../../contracts/supported-claim'

export function evidenceLedgerMarkdown(facts: ReadonlyArray<SupportedClaim>): string {
  return [
    '## Evidence ledger', '', '| Fact | Record | Field | Quote |', '|---|---|---|---|',
    ...facts.flatMap((fact, index) => fact.sources.map(source => `| F${index + 1} | ${source.recordId} | ${source.field} | "${source.quote.replace(/\|/g, '\\|')}" |`)),
  ].join('\n')
}
