import type { ArtifactRef } from '../../../../contracts/artifact-ref'
import type { BusinessCard } from '../../../../contracts/business-card'
import type { CriticIssue } from '../../../../contracts/critic-issue'
import type { CriticVerdict } from '../../../../contracts/critic-verdict'
import type { PairAssessment } from '../../../../contracts/pair-assessment'
import type { PairCheck } from '../../../../contracts/pair-check'
import type { Proposal } from '../../../../contracts/proposal'
import type { ScholarCard } from '../../../../contracts/scholar-card'
import type { TaskScreening } from '../../../../contracts/task-screening'

export interface CollaborationStages {
  businessCard(taskId: string): BusinessCard
  scholarCard(researcherId: string): ScholarCard
  screen(business: BusinessCard): Promise<TaskScreening>
  assess(request: { business: BusinessCard; scholar: ScholarCard; inputs: ReadonlyArray<ArtifactRef>; feedback: ReadonlyArray<CriticIssue> }): Promise<PairAssessment>
  check(request: { business: BusinessCard; scholar: ScholarCard; assessment: PairAssessment; subject: ArtifactRef }): Promise<PairCheck>
  write(request: { business: BusinessCard; scholar: ScholarCard; assessment: PairAssessment; inputs: ReadonlyArray<ArtifactRef>; feedback: ReadonlyArray<CriticIssue>; previousDraft?: string }): Promise<Proposal>
  reviewProposal(request: { subject: ArtifactRef; business: BusinessCard; scholar: ScholarCard; assessment: PairAssessment; proposal: Proposal }): Promise<CriticVerdict>
}
