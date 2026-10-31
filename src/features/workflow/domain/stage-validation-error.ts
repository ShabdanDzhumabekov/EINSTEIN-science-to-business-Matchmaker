import type { CriticIssue } from '../../../contracts/critic-issue'

export class StageValidationError extends Error {
  constructor(readonly issues: ReadonlyArray<CriticIssue>) {
    super('Generated artifact failed deterministic validation')
    this.name = 'StageValidationError'
  }
}
