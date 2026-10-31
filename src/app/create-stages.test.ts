import { expect, it } from 'vitest'
import type { CompanyScreening } from '../contracts/company-screening'
import type { TaskScreening } from '../contracts/task-screening'
import type { ScreeningStore } from '../screening/screening-store'
import { aCompany, aDataset, aResearcher } from '../test-support/dataset-builders'
import { FakeDecision } from '../test-support/fake-decision'
import { FakeRoleInference } from '../test-support/fake-role-inference'
import { createStages, prefilterThresholdOf } from './create-stages'

class MemoryScreenings implements ScreeningStore {
  readonly tasks = new Map<string, TaskScreening>()
  readonly companies = new Map<string, CompanyScreening>()
  find(taskId: string, prefilterThreshold?: number) { return this.tasks.get(`${taskId}@${prefilterThreshold ?? ''}`) }
  save(screening: TaskScreening) { this.tasks.set(`${screening.taskId}@${screening.prefilter?.threshold ?? ''}`, screening); return screening }
  findCompany(companyId: string) { return this.companies.get(companyId) }
  saveCompany(screening: CompanyScreening) { this.companies.set(screening.companyId, screening); return screening }
}

function aThreeResearcherDataset() {
  return aDataset({
    companies: [aCompany({ id: 'C001', challenges: [{ id: 'C001-CH1', text: 'Detect anomalies', detail: 'We have no attack examples.' }] })],
    researchers: [aResearcher({ id: 'R0001' }), aResearcher({ id: 'R0002' }), aResearcher({ id: 'R0003' })],
  })
}

it('screens the challenge only against the researchers the company pre-filter kept, and says so', async () => {
  const decision = new FakeDecision({ company_R0001: 0.9, company_R0002: 0.2, company_R0003: 0.5, is_research_problem: 0.9, fit_R0001: 0.8, fit_R0003: 0.3 })
  const stages = createStages(new FakeRoleInference([]), decision, aThreeResearcherDataset(), new MemoryScreenings(), { prefilterThreshold: 0.4 })

  const screening = await stages.screen(stages.businessCard('C001-CH1'))

  expect([screening.pairs.map(pair => pair.researcherId), screening.prefilter?.researchersScreened, screening.prefilter?.researchersRemoved]).toEqual([['R0001', 'R0003'], 2, 1])
})

it('still asks whether the challenge is a research problem when the pre-filter removed every researcher', async () => {
  const decision = new FakeDecision({ company_R0001: 0.1, company_R0002: 0.2, company_R0003: 0.3, is_research_problem: 0.9 })
  const stages = createStages(new FakeRoleInference([]), decision, aThreeResearcherDataset(), new MemoryScreenings(), { prefilterThreshold: 0.4 })

  const screening = await stages.screen(stages.businessCard('C001-CH1'))

  expect([screening.researchFit, screening.pairs, screening.prefilter?.researchersRemoved]).toEqual([0.9, [], 3])
})

it('keeps the full company screening inside the task screening so a missing researcher can be explained', async () => {
  const decision = new FakeDecision({ company_R0001: 0.9, company_R0002: 0.2, company_R0003: 0.5, is_research_problem: 0.9, fit_R0001: 0.8, fit_R0003: 0.3 })
  const stages = createStages(new FakeRoleInference([]), decision, aThreeResearcherDataset(), new MemoryScreenings(), { prefilterThreshold: 0.4 })

  const screening = await stages.screen(stages.businessCard('C001-CH1'))

  expect(screening.prefilter?.company.pairs.find(pair => pair.researcherId === 'R0002')).toEqual({ researcherId: 'R0002', jev: 0.2, isKept: false })
})

it('asks Jev about a company once when two of its challenges are screened at the same time', async () => {
  const decision = new FakeDecision({ company_R0001: 0.9, company_R0002: 0.9, company_R0003: 0.9, is_research_problem: [0.9, 0.9], fit_R0001: [0.8, 0.8], fit_R0002: [0.8, 0.8], fit_R0003: [0.8, 0.8] })
  const dataset = aDataset({ companies: [aCompany({ id: 'C001', challenges: [{ id: 'C001-CH1', text: 'Detect anomalies', detail: 'No labels.' }, { id: 'C001-CH2', text: 'Explain alerts', detail: 'Plain language.' }] })],
    researchers: [aResearcher({ id: 'R0001' }), aResearcher({ id: 'R0002' }), aResearcher({ id: 'R0003' })] })
  const stages = createStages(new FakeRoleInference([]), decision, dataset, new MemoryScreenings(), { prefilterThreshold: 0.4 })

  await Promise.all([stages.screen(stages.businessCard('C001-CH1')), stages.screen(stages.businessCard('C001-CH2'))])

  expect(decision.calls.filter(call => call.questions[0]?.key.startsWith('company_')).length).toBe(1)
})

it.each([
  [undefined, undefined], ['0', 0], ['0.4', 0.4],
])('reads PREFILTER_THRESHOLD %s as %s', (raw: string | undefined, expected: number | undefined) => {
  expect(prefilterThresholdOf(raw)).toBe(expected)
})

it.each([[''], ['abc'], ['1.5'], ['-0.1']])('rejects PREFILTER_THRESHOLD %s', (raw: string) => {
  expect(() => prefilterThresholdOf(raw)).toThrow(/PREFILTER_THRESHOLD/)
})

it('screens every researcher and records no pre-filter when none is configured', async () => {
  const decision = new FakeDecision({ is_research_problem: 0.9, fit_R0001: 0.8, fit_R0002: 0.6, fit_R0003: 0.3 })
  const stages = createStages(new FakeRoleInference([]), decision, aThreeResearcherDataset(), new MemoryScreenings())

  const screening = await stages.screen(stages.businessCard('C001-CH1'))

  expect([screening.pairs.length, screening.prefilter]).toEqual([3, undefined])
})
