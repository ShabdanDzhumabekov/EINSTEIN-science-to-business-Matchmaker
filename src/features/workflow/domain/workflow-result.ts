import type { Proposal } from '../../../contracts/proposal'
import type { SavedArtifact } from './saved-artifact'

export type WorkflowResult =
  | { status: 'ready'; taskId: string; proposal: SavedArtifact<Proposal> }
  | { status: 'screened_out' | 'no_fit' | 'check_failed' | 'proposal_needs_revision' | 'limit_reached' | 'execution_failed'; taskId: string; reason: string }
