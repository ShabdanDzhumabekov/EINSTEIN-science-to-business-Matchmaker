import { mkdtempSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import type { TaskScreening } from '../contracts/task-screening'
import { ScreeningFiles } from './screening-files'

function aScreening(): TaskScreening {
  return { taskId: 'C001-CH1', researchFit: 0.9, isResearchProblem: true, threshold: 0.5, model: 'typesafe/jev-1.14',
    pairs: [{ taskId: 'C001-CH1', researcherId: 'R0007', jev: 0.9, isKept: true }] }
}

it('stamps a fresh screening with when it was made and that it is not from the cache', () => {
  const files = new ScreeningFiles(mkdtempSync(join(tmpdir(), 'screening-')), () => new Date('2026-10-31T10:00:00Z'))

  const saved = files.save(aScreening())

  expect(saved.provenance).toEqual({ screenedAt: '2026-10-31T10:00:00.000Z', isFromCache: false })
})

it('marks a screening read back from the cache with its original time', () => {
  const files = new ScreeningFiles(mkdtempSync(join(tmpdir(), 'screening-')), () => new Date('2026-10-31T10:00:00Z'))
  files.save(aScreening())

  const found = files.find('C001-CH1')

  expect(found?.provenance).toEqual({ screenedAt: '2026-10-31T10:00:00.000Z', isFromCache: true })
})

it('dates a cache file written before provenance existed by its modification time', () => {
  const directory = mkdtempSync(join(tmpdir(), 'screening-'))
  const path = join(directory, 'C001-CH1.json')
  writeFileSync(path, JSON.stringify(aScreening()))
  utimesSync(path, new Date('2026-10-30T22:58:00Z'), new Date('2026-10-30T22:58:00Z'))

  const found = new ScreeningFiles(directory).find('C001-CH1')

  expect(found?.provenance).toEqual({ screenedAt: '2026-10-30T22:58:00.000Z', isFromCache: true })
})
