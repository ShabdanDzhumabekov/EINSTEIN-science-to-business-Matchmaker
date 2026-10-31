import { expect, it } from 'vitest'
import { ArtifactLedger } from './artifact-ledger'
import type { CriticVerdict } from '../../../contracts/critic-verdict'

it('invalidates a proposal approval when an upstream task changes', () => {
  const ledger = new ArtifactLedger('run', 'dataset')
  const task = ledger.save('business', 'business', {}, [])
  const pair = ledger.save('pair', 'pair', {}, [task.ref])
  const proposal = ledger.save('proposal', 'proposal', {}, [pair.ref])
  const verdict: CriticVerdict = { phase: 'proposal', subject: proposal.ref, checkedClaimCount: 1, issues: [] }
  const review = ledger.save('review', 'review', verdict, [proposal.ref])
  ledger.authorize(proposal, review, 1)

  ledger.save('business', 'business', { changed: true }, [])

  expect(ledger.isApproved(proposal.ref)).toBe(false)
})

it('blocks an unsupported claim even when a model labels it advisory', () => {
  const ledger = new ArtifactLedger('run', 'dataset')
  const pair = ledger.save('pair', 'pair', {}, [])
  const verdict: CriticVerdict = { phase: 'pair', subject: pair.ref, checkedClaimCount: 1, issues: [{
    category: 'unsupported_claim', severity: 'advisory', claim: 'Already validated', sources: [], owner: 'matchmaker', explanation: 'No evidence',
  }] }
  const review = ledger.save('review', 'review', verdict, [pair.ref])

  const approval = ledger.authorize(pair, review, 1)

  expect(approval).toBe(false)
})

it('rejects a Critic result for a different version', () => {
  const ledger = new ArtifactLedger('run', 'dataset')
  const pair = ledger.save('pair', 'pair', {}, [])
  const verdict: CriticVerdict = { phase: 'pair', subject: { ...pair.ref, version: 2 }, checkedClaimCount: 1, issues: [] }
  const review = ledger.save('review', 'review', verdict, [pair.ref])

  const approve = () => ledger.authorize(pair, review, 1)

  expect(approve).toThrow('Critic review does not cover the current subject')
})
