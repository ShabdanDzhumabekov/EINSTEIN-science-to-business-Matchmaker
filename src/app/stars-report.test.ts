import { expect, it } from 'vitest'
import type { ScholarScreening } from '../contracts/scholar-screening'
import { starsReport } from './stars-report'

function aScreening(): ScholarScreening {
  const question = { instructions: 'asked', whenTrue: 'yes', whenFalse: 'no' }
  return { researcherId: 'R0349', threshold: 0.5, batches: 1, model: 'typesafe/jev-1.14', questions: { pairFit: question, researchProblem: question }, challenges: [
    { taskId: 'C009-CH1', companyId: 'C009', fit: 0.95, researchFit: 0.9, isKept: true },
    { taskId: 'C020-CH2', companyId: 'C020', fit: 0.8, researchFit: 0.7, isKept: true },
    { taskId: 'C030-CH1', companyId: 'C030', fit: 0.6, researchFit: 0.8, isKept: true },
    { taskId: 'C040-CH1', companyId: 'C040', fit: 0.55, researchFit: 0.9, isKept: true },
    { taskId: 'C050-CH1', companyId: 'C050', fit: 0.2, researchFit: 0.9, isKept: false },
  ] }
}

function aReport() {
  return starsReport({ researcherName: 'Stefan Dragić', screening: aScreening(), companyNames: new Map([['C009', 'LinguaBot d.o.o.']]),
    attempts: [
      { taskId: 'C009-CH1', status: 'ready', proposalPath: 'proposals/C009-CH1.md' },
      { taskId: 'C020-CH2', status: 'check_failed' },
      { taskId: 'C030-CH1', status: 'execution_failed' },
    ] })
}

it('states how many challenges were screened and how many passed both filters', () => {
  expect(aReport()).toContain('Screened 5 challenges; 4 passed both Jev filters; the first 3 were checked in depth.')
})

it('links a ready proposal', () => {
  expect(aReport()).toContain('| C009-CH1 | LinguaBot d.o.o. | 0.95 | 0.9 | proposal ready: [C009-CH1](proposals/C009-CH1.md) |')
})

it('names the stage that dropped a pair', () => {
  expect(aReport()).toContain('| C020-CH2 | C020 | 0.8 | 0.7 | dropped: Jev check of the rationale below 0.9 |')
})

it('shows a technical failure as an error, not as a refusal', () => {
  expect(aReport()).toContain('| C030-CH1 | C030 | 0.6 | 0.8 | technical error, not assessed |')
})

it('marks a kept challenge beyond the attempted ones as not checked in depth', () => {
  expect(aReport()).toContain('| C040-CH1 | C040 | 0.55 | 0.9 | passed screening, not checked in depth |')
})
