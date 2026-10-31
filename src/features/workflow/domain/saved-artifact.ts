import type { ArtifactRef } from '../../../contracts/artifact-ref'

export interface SavedArtifact<Content> {
  readonly ref: ArtifactRef
  readonly kind: 'business' | 'scholar' | 'screening' | 'pair' | 'check' | 'proposal' | 'review'
  readonly runId: string
  readonly datasetVersion: string
  readonly inputs: ReadonlyArray<ArtifactRef>
  readonly content: Content
}
