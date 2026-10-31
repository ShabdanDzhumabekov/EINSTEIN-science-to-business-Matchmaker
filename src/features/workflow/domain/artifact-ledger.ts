import type { ArtifactRef } from '../../../contracts/artifact-ref'
import type { CriticVerdict } from '../../../contracts/critic-verdict'
import type { CriticIssue } from '../../../contracts/critic-issue'
import type { SavedArtifact } from './saved-artifact'

export class ArtifactLedger {
  private readonly latest = new Map<string, SavedArtifact<unknown>>()
  private readonly history: SavedArtifact<unknown>[] = []
  private readonly approvals = new Map<string, ArtifactRef>()
  constructor(private readonly runId: string, private readonly datasetVersion: string) {}
  save<Content>(artifactId: string, kind: SavedArtifact<Content>['kind'], content: Content, inputs: ReadonlyArray<ArtifactRef>): SavedArtifact<Content> {
    if (inputs.some(input => input.artifactId === artifactId || !this.isCurrent(input))) throw new Error('Artifact has stale or cyclic dependencies')
    const artifact: SavedArtifact<Content> = {
      ref: { artifactId, version: (this.latest.get(artifactId)?.ref.version ?? 0) + 1 }, kind,
      runId: this.runId, datasetVersion: this.datasetVersion, inputs: structuredClone(inputs), content: structuredClone(content),
    }
    this.latest.set(artifactId, artifact); this.history.push(artifact)
    return structuredClone(artifact)
  }
  isCurrent(ref: ArtifactRef, ancestors = new Set<string>()): boolean {
    const artifact = this.latest.get(ref.artifactId)
    if (!artifact || artifact.ref.version !== ref.version || ancestors.has(ref.artifactId)) return false
    const next = new Set(ancestors).add(ref.artifactId)
    return artifact.inputs.every(input => this.isCurrent(input, next))
  }
  authorize(subject: SavedArtifact<unknown>, review: SavedArtifact<CriticVerdict>, expectedClaimCount: number): boolean {
    const verdict = review.content
    this.approvals.delete(subject.ref.artifactId)
    if (review.kind !== 'review' || subject.kind !== verdict.phase || verdict.subject.artifactId !== subject.ref.artifactId
      || verdict.subject.version !== subject.ref.version || verdict.checkedClaimCount !== expectedClaimCount || expectedClaimCount < 1
      || review.runId !== this.runId || subject.runId !== this.runId || review.datasetVersion !== this.datasetVersion
      || subject.datasetVersion !== this.datasetVersion || !this.isCurrent(subject.ref) || !this.isCurrent(review.ref)
      || !review.inputs.some(input => input.artifactId === subject.ref.artifactId && input.version === subject.ref.version)) {
      throw new Error('Critic review does not cover the current subject')
    }
    const mandatory: ReadonlySet<CriticIssue['category']> = new Set(['quote_not_found', 'unknown_source', 'authorship_conflict',
      'unsupported_claim', 'constraint_omitted', 'constraint_contradicted', 'participation_misstated', 'title_only_evidence'])
    if (verdict.issues.some(issue => issue.severity === 'blocking' || mandatory.has(issue.category))) return false
    this.approvals.set(subject.ref.artifactId, structuredClone(review.ref))
    return true
  }
  isApproved(ref: ArtifactRef): boolean {
    const review = this.approvals.get(ref.artifactId)
    return this.isCurrent(ref) && review !== undefined && this.isCurrent(review)
  }
  snapshots(): ReadonlyArray<SavedArtifact<unknown>> { return structuredClone(this.history) }
}
