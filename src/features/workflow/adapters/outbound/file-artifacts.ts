import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SavedArtifact } from '../../domain/saved-artifact'
import type { ArtifactOutput } from '../../ports/outbound/artifact-output'

export class FileArtifacts implements ArtifactOutput {
  private sequence = 0
  constructor(private readonly directory: string, private readonly runId: string) {
    mkdirSync(join(directory, 'artifacts'), { recursive: true })
  }
  save(artifact: SavedArtifact<unknown>): void {
    if (!/^[a-zA-Z0-9_-]+$/.test(artifact.ref.artifactId)) throw new Error('Unsafe artifact ID')
    const file = `artifacts/${artifact.ref.artifactId}.v${artifact.ref.version}.json`
    writeFileSync(join(this.directory, file), JSON.stringify(artifact, null, 2), { flag: 'wx' })
    this.event('artifact.saved', { subject: artifact.ref, kind: artifact.kind, inputs: artifact.inputs, file })
  }
  event(type: string, details: Readonly<Record<string, unknown>>): void {
    const entry = { runId: this.runId, seq: this.sequence++, at: new Date().toISOString(), type, details }
    appendFileSync(join(this.directory, 'trace.jsonl'), JSON.stringify(entry) + '\n')
  }
}
