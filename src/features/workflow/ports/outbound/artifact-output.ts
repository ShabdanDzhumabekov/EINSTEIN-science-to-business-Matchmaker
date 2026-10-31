import type { SavedArtifact } from '../../domain/saved-artifact'

export interface ArtifactOutput {
  save(artifact: SavedArtifact<unknown>): void
  event(type: string, details: Readonly<Record<string, unknown>>): void
}
