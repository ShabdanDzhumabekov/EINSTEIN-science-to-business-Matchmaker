import { expect, it } from 'vitest'
import { aCompany, aDataset, aPublication, aResearcher } from '../test-support/dataset-builders'
import { aPairAssessment, aProposal, aSourceRef } from '../test-support/pair-builders'
import { FakeDecision } from '../test-support/fake-decision'
import { FakeRoleInference } from '../test-support/fake-role-inference'
import type { TaskScreening } from '../contracts/task-screening'
import type { RoleInference, RoleInferenceRequest } from '../contracts/role-inference'
import type { ScreeningStore } from '../screening/screening-store'
import { CollaborationWorkflow } from '../features/workflow/application/collaboration-workflow'
import type { ArtifactOutput } from '../features/workflow/ports/outbound/artifact-output'
import type { SavedArtifact } from '../features/workflow/domain/saved-artifact'
import { createStages } from './create-stages'
import { RoleInferenceError } from '../features/inference/domain/role-inference-error'

class MemoryArtifacts implements ArtifactOutput {
  readonly artifacts: SavedArtifact<unknown>[] = []
  readonly events: Array<{ type: string; details: Readonly<Record<string, unknown>> }> = []
  save(artifact: SavedArtifact<unknown>) {
    if (this.artifacts.some(saved => saved.ref.artifactId === artifact.ref.artifactId && saved.ref.version === artifact.ref.version)) throw new Error(`Artifact file exists: ${artifact.ref.artifactId}`)
    this.artifacts.push(structuredClone(artifact))
  }
  event(type: string, details: Readonly<Record<string, unknown>>) { this.events.push({ type, details }) }
}

class MemoryScreenings implements ScreeningStore {
  constructor(private readonly screenings: Map<string, TaskScreening> = new Map()) {}
  find(taskId: string) { return this.screenings.get(taskId) }
  save(screening: TaskScreening) { this.screenings.set(screening.taskId, screening); return screening }
}

function twoResearcherDataset() {
  return aDataset({ companies: [aCompany()], researchers: [
    aResearcher({ id: 'R0007', publications: ['SYN-PUB-00001'], open_to: ['joint projects with companies', 'industrial PhD supervision'] }),
    aResearcher({ id: 'R0008', bio: 'She audits Modbus deployments.', open_to: ['joint projects with companies'] }),
  ], publications: [aPublication({ abstract: 'We learn a baseline of normal Modbus traffic.', authors: [{ name: 'A', researcher_id: 'R0007', affiliation: 'UNS' }] })] })
}

function aSecondPairAssessment() {
  return aPairAssessment({ researcherId: 'R0008', rationale: [{ text: 'R0008 audits Modbus deployments.', sources: [aSourceRef('R0008', 'bio', 'She audits Modbus deployments.')] }] })
}

function fits() { return { fits: true, reason: 'Her baseline modelling of Modbus traffic addresses the task.' } }

function dropped(reason: string) { return { fits: false, reason } }

function aSecondProposal() {
  return aProposal({ researcherId: 'R0008', facts: [{ text: 'No attack labels.', sources: [aSourceRef('C001-CH1', 'detail', 'We have no attack examples.')] },
    { text: 'R0008 audits Modbus deployments.', sources: [aSourceRef('R0008', 'bio', 'She audits Modbus deployments.')] }] })
}

function blockingIssue(explanation: string) {
  return { category: 'unsupported_claim', severity: 'blocking', claim: 'Already validated', sources: [], explanation, owner: 'proposal_writer' }
}

function inferenceByRole(outputs: Partial<Record<RoleInferenceRequest<unknown>['role'], unknown[]>>) {
  const models = new Map(Object.entries(outputs).map(([role, scripted]) => [role, new FakeRoleInference(scripted)]))
  const inference: RoleInference = {
    infer<Output>(request: RoleInferenceRequest<Output>): Promise<Output> {
      const model = models.get(request.role)
      if (!model) throw new Error(`No scripted model for ${request.role}`)
      return model.infer(request)
    },
  }
  return { inference, requests: (role: RoleInferenceRequest<unknown>['role']) => models.get(role)?.requests ?? [] }
}

function jev(overrides: Record<string, number | number[]> = {}) {
  return new FakeDecision({ is_research_problem: 0.9, fit_R0007: 0.9, fit_R0008: 0.1, rationale_supports_fit: 0.95, fact_1: 1, fact_2: 1, ...overrides })
}

function aWorkflow(inference: RoleInference, decision: FakeDecision, output = new MemoryArtifacts(), screenings = new MemoryScreenings()) {
  const dataset = twoResearcherDataset()
  return new CollaborationWorkflow('test-run', dataset.version, createStages(inference, decision, dataset, screenings), output)
}

function artifactVersions(output: MemoryArtifacts, kind: SavedArtifact<unknown>['kind']) {
  return output.artifacts.filter(artifact => artifact.kind === kind).map(artifact => `${artifact.ref.artifactId}@${artifact.ref.version}`)
}

it('returns a Critic-approved proposal for a pair that passed both Jev stages and Matchmaker', async () => {
  const { inference } = inferenceByRole({ matchmaker: [fits(), aPairAssessment()], proposal_writer: [aProposal()], critic: [{ issues: [] }] })

  const result = await aWorkflow(inference, jev()).run('C001-CH1')

  expect(result).toMatchObject({ status: 'ready', proposal: { content: { researcherId: 'R0007' } } })
})

it('screens out a task that Jev does not rate as a research problem', async () => {
  const { inference, requests } = inferenceByRole({})

  const result = await aWorkflow(inference, jev({ is_research_problem: 0.4 })).run('C001-CH1')

  expect([result.status, requests('matchmaker').length]).toEqual(['screened_out', 0])
})

it('screens out a task when no researcher passes the Jev threshold', async () => {
  const { inference } = inferenceByRole({})

  const result = await aWorkflow(inference, jev({ fit_R0007: 0.49, fit_R0008: 0.2 })).run('C001-CH1')

  expect(result).toMatchObject({ status: 'screened_out', reason: 'No researcher passed Jev screening' })
})

it('assesses screened pairs from the highest Jev probability down', async () => {
  const { inference, requests } = inferenceByRole({ matchmaker: [dropped('Auditing deployments does not address unlabelled anomaly detection.'), fits(), aPairAssessment()],
    proposal_writer: [aProposal()], critic: [{ issues: [] }] })

  await aWorkflow(inference, jev({ fit_R0007: 0.6, fit_R0008: 0.9 })).run('C001-CH1')

  expect(requests('matchmaker')[0]?.input).toContain('Researcher R0008')
})

it('moves to the next screened pair after Matchmaker rejects one', async () => {
  const { inference } = inferenceByRole({ matchmaker: [dropped('The material shows no traffic or anomaly modelling.'), fits(), aSecondPairAssessment()],
    proposal_writer: [aSecondProposal()], critic: [{ issues: [] }] })

  const result = await aWorkflow(inference, jev({ fit_R0008: 0.8 })).run('C001-CH1')

  expect(result).toMatchObject({ status: 'ready', proposal: { content: { researcherId: 'R0008' } } })
})

it('drops a pair below the 0.9 Jev check without calling Writer', async () => {
  const { inference, requests } = inferenceByRole({ matchmaker: [fits(), aPairAssessment()] })

  const result = await aWorkflow(inference, jev({ rationale_supports_fit: 0.89 })).run('C001-CH1')

  expect([result.status, requests('proposal_writer').length]).toEqual(['check_failed', 0])
})

it('reports the furthest stage any dropped pair reached', async () => {
  const { inference } = inferenceByRole({ matchmaker: [fits(), aPairAssessment(), dropped('Auditing deployments does not address unlabelled anomaly detection.')] })

  const result = await aWorkflow(inference, jev({ fit_R0008: 0.8, rationale_supports_fit: 0.5 })).run('C001-CH1')

  expect(result.status).toBe('check_failed')
})

it('reports no_fit when Matchmaker rejects every screened pair', async () => {
  const { inference } = inferenceByRole({ matchmaker: [dropped('The material shows no traffic or anomaly modelling.'), dropped('Auditing deployments does not address unlabelled anomaly detection.')] })

  const result = await aWorkflow(inference, jev({ fit_R0008: 0.8 })).run('C001-CH1')

  expect(result.status).toBe('no_fit')
})

it('revises the proposal with Writer after Critic rejects it', async () => {
  const { inference } = inferenceByRole({ matchmaker: [fits(), aPairAssessment()], proposal_writer: [aProposal(), aProposal({ title: 'Revised' })],
    critic: [{ issues: [blockingIssue('Present validation as proposed.')] }, { issues: [] }] })
  const output = new MemoryArtifacts()

  await aWorkflow(inference, jev(), output).run('C001-CH1')

  expect(artifactVersions(output, 'proposal')).toEqual(['proposal-C001-CH1-R0007@1', 'proposal-C001-CH1-R0007@2'])
})

it('hands the Writer its rejected draft when the Critic asks for a revision', async () => {
  const { inference, requests } = inferenceByRole({ matchmaker: [fits(), aPairAssessment()], proposal_writer: [aProposal(), aProposal({ title: 'Revised' })],
    critic: [{ issues: [blockingIssue('Present validation as proposed.')] }, { issues: [] }] })

  await aWorkflow(inference, jev(), new MemoryArtifacts()).run('C001-CH1')

  expect([requests('proposal_writer')[0]?.input.includes('# Site baselines'), requests('proposal_writer')[1]?.input.includes('# Site baselines')]).toEqual([false, true])
})

it('reports proposal_needs_revision after two rejected revisions of the only pair', async () => {
  const rejection = { issues: [blockingIssue('Still presented as achieved.')] }
  const { inference, requests } = inferenceByRole({ matchmaker: [fits(), aPairAssessment()], proposal_writer: [aProposal(), aProposal(), aProposal()],
    critic: [rejection, rejection, rejection] })

  const result = await aWorkflow(inference, jev()).run('C001-CH1')

  expect([result.status, requests('proposal_writer').length]).toEqual(['proposal_needs_revision', 3])
})

it('blocks a proposal whose fact Jev finds unsupported by its quote', async () => {
  const { inference } = inferenceByRole({ matchmaker: [fits(), aPairAssessment()], proposal_writer: [aProposal(), aProposal()], critic: [{ issues: [] }, { issues: [] }] })
  const output = new MemoryArtifacts()

  await aWorkflow(inference, jev({ fact_1: [0.2, 1] }), output).run('C001-CH1')

  expect(output.events.filter(event => event.type === 'critic.revise')).toHaveLength(1)
})

it('returns Writer validation violations to Writer instead of sending the proposal to Critic', async () => {
  const uncopiedFact = { text: 'The company builds hardware.', sources: [aSourceRef('C001', 'about', 'We build crop drones.')] }
  const { inference, requests } = inferenceByRole({ matchmaker: [fits(), aPairAssessment()],
    proposal_writer: [aProposal({ facts: [...aProposal().facts, uncopiedFact] }), aProposal()], critic: [{ issues: [] }] })

  await aWorkflow(inference, jev()).run('C001-CH1')

  expect(requests('proposal_writer')[1]?.input).toContain('quote_not_found: The quote is not in C001.about.')
})

it('shows Writer its rejected draft when requesting a correction', async () => {
  const uncopiedFact = { text: 'DRAFT_MARKER hardware.', sources: [aSourceRef('C001', 'about', 'We build crop drones.')] }
  const { inference, requests } = inferenceByRole({ matchmaker: [fits(), aPairAssessment()],
    proposal_writer: [aProposal({ facts: [...aProposal().facts, uncopiedFact] }), aProposal()], critic: [{ issues: [] }] })

  await aWorkflow(inference, jev()).run('C001-CH1')

  expect(requests('proposal_writer')[1]?.input).toContain('DRAFT_MARKER')
})

it('shows Matchmaker its rejected assessment when requesting a correction', async () => {
  const reworded = aSourceRef('SYN-PUB-00001', 'abstract', 'REWORDED_QUOTE of Modbus traffic')
  const { inference, requests } = inferenceByRole({ matchmaker: [fits(), aPairAssessment({ rationale: [{ text: 'R0007 learns baselines.', sources: [reworded] }] }), aPairAssessment()],
    proposal_writer: [aProposal()], critic: [{ issues: [] }] })

  await aWorkflow(inference, jev()).run('C001-CH1')

  expect(requests('matchmaker')[2]?.input).toContain('REWORDED_QUOTE')
})

it('drops the pair after three invalid Matchmaker answers', async () => {
  const invalid = aPairAssessment({ rationale: [{ text: 'R0007 learns baselines.', sources: [aSourceRef('SYN-PUB-00001', 'abstract', 'reworded')] }] })
  const { inference } = inferenceByRole({ matchmaker: [fits(), invalid, invalid, invalid] })

  const result = await aWorkflow(inference, jev()).run('C001-CH1')

  expect(result.status).toBe('no_fit')
})

it('reuses a stored screening instead of asking Jev again', async () => {
  const stored: TaskScreening = { taskId: 'C001-CH1', researchFit: 0.9, isResearchProblem: true, threshold: 0.5, model: 'typesafe/jev-1.14',
    pairs: [{ taskId: 'C001-CH1', researcherId: 'R0007', jev: 0.9, isKept: true }] }
  const { inference } = inferenceByRole({ matchmaker: [fits(), aPairAssessment()], proposal_writer: [aProposal()], critic: [{ issues: [] }] })
  const decision = jev()

  await aWorkflow(inference, decision, new MemoryArtifacts(), new MemoryScreenings(new Map([['C001-CH1', stored]]))).run('C001-CH1')

  expect(decision.calls.some(call => call.questions.some(question => question.key === 'is_research_problem'))).toBe(false)
})

it('saves a candidate shared by two tasks of one run under separate artifact ids', async () => {
  const dataset = aDataset({ companies: [aCompany({ challenges: [{ id: 'C001-CH1', text: 'Detect anomalies without labels.', detail: 'We have no attack examples.' },
    { id: 'C001-CH2', text: 'Explain alerts to managers.', detail: 'We have no attack examples.' }] })], researchers: [...twoResearcherDataset().researchers.values()],
    publications: [...twoResearcherDataset().publications.values()] })
  const { inference } = inferenceByRole({ matchmaker: [dropped('The material shows no traffic or anomaly modelling.'), dropped('The material shows no explanation methods for alerts.')] })
  const output = new MemoryArtifacts()
  const stages = createStages(inference, jev(), dataset, new MemoryScreenings())

  await new CollaborationWorkflow('run', dataset.version, stages, output).run('C001-CH1')
  const second = new CollaborationWorkflow('run', dataset.version, stages, output).run('C001-CH2')

  await expect(second).resolves.toMatchObject({ status: 'no_fit' })
})

it('asks Matchmaker again after a truncated answer instead of failing the task', async () => {
  const truncatingInference: RoleInference = {
    async infer<Output>(request: RoleInferenceRequest<Output>): Promise<Output> {
      if (request.output.name === 'pair_assessment' && !request.input.includes('cut off')) throw new RoleInferenceError('invalid_output', 'Output truncated by maxOutputTokens')
      return scripted.inference.infer(request)
    },
  }
  const scripted = inferenceByRole({ matchmaker: [fits(), aPairAssessment()], proposal_writer: [aProposal()], critic: [{ issues: [] }] })

  const result = await aWorkflow(truncatingInference, jev()).run('C001-CH1')

  expect(result.status).toBe('ready')
})

it('asks Critic again after a truncated review instead of failing the task', async () => {
  let isTruncated = true
  const truncatingInference: RoleInference = {
    async infer<Output>(request: RoleInferenceRequest<Output>): Promise<Output> {
      if (request.role === 'critic' && isTruncated) { isTruncated = false; throw new RoleInferenceError('invalid_output', 'Output truncated by maxOutputTokens') }
      return scripted.inference.infer(request)
    },
  }
  const scripted = inferenceByRole({ matchmaker: [fits(), aPairAssessment()], proposal_writer: [aProposal()], critic: [{ issues: [] }] })

  const result = await aWorkflow(truncatingInference, jev()).run('C001-CH1')

  expect(result.status).toBe('ready')
})

it('runs a fixed pair to a proposal for that researcher without screening the researcher table', async () => {
  const { inference } = inferenceByRole({ matchmaker: [fits(), aSecondPairAssessment()], proposal_writer: [aSecondProposal()], critic: [{ issues: [] }] })
  const decision = jev()

  const result = await aWorkflow(inference, decision).runPair('C001-CH1', 'R0008')

  expect([result.status, result.status === 'ready' && result.proposal.content.researcherId, decision.calls.some(call => call.questions.some(question => question.key === 'is_research_problem'))])
    .toEqual(['ready', 'R0008', false])
})

it('reports a fixed pair below the 0.9 Jev check as check_failed', async () => {
  const { inference } = inferenceByRole({ matchmaker: [fits(), aPairAssessment()] })

  const result = await aWorkflow(inference, jev({ rationale_supports_fit: 0.89 })).runPair('C001-CH1', 'R0007')

  expect(result.status).toBe('check_failed')
})

it('does not report a fixed pair as ready when Critic keeps rejecting it', async () => {
  const rejection = { issues: [blockingIssue('Still presented as achieved.')] }
  const { inference } = inferenceByRole({ matchmaker: [fits(), aPairAssessment()], proposal_writer: [aProposal(), aProposal(), aProposal()], critic: [rejection, rejection, rejection] })

  const result = await aWorkflow(inference, jev()).runPair('C001-CH1', 'R0007')

  expect(result.status).toBe('proposal_needs_revision')
})

it('fails the run when Writer inference fails technically', async () => {
  const { inference } = inferenceByRole({ matchmaker: [fits(), aPairAssessment()], proposal_writer: [] })

  const run = aWorkflow(inference, jev()).run('C001-CH1')

  await expect(run).rejects.toThrow('no scripted output left for proposal_writer')
})
