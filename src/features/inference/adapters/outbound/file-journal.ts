import { appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Journal } from '../../ports/outbound/journal'

export class FileJournal implements Journal {
  private sequence = 0
  constructor(private readonly directory: string, private readonly runId: string) {
    mkdirSync(directory, { recursive: true })
  }
  record(event: string, details: Readonly<Record<string, unknown>>): void {
    const entry = { runId: this.runId, sequence: this.sequence++, event, details }
    appendFileSync(join(this.directory, 'inference.jsonl'), JSON.stringify(entry) + '\n')
  }
}
