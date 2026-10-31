import type { ScholarScreening } from '../contracts/scholar-screening'
import type { WorkflowResult } from '../features/workflow/domain/workflow-result'

export type StarsAttempt = { taskId: string; status: WorkflowResult['status']; proposalPath?: string }

export type StarsReportInput = {
  researcherName: string
  screening: ScholarScreening
  companyNames: ReadonlyMap<string, string>
  attempts: ReadonlyArray<StarsAttempt>
}

const STAGE_TEXT: Readonly<Record<Exclude<WorkflowResult['status'], 'ready'>, string>> = {
  screened_out: 'dropped at screening',
  no_fit: 'dropped: the Matchmaker found no fit',
  check_failed: 'dropped: Jev check of the rationale below 0.9',
  proposal_needs_revision: 'dropped: no Critic-approved proposal after revisions',
  limit_reached: 'technical error, not assessed',
  execution_failed: 'technical error, not assessed',
}

/* Lists challenges for one researcher; it compares challenges for that person and never compares people. */
export function starsReport({ researcherName, screening, companyNames, attempts }: StarsReportInput): string {
  const kept = screening.challenges.filter(challenge => challenge.isKept)
  const outcomeOf = (taskId: string) => {
    const attempt = attempts.find(candidate => candidate.taskId === taskId)
    if (attempt === undefined) return 'passed screening, not checked in depth'
    if (attempt.status === 'ready') return `proposal ready: [${taskId}](${attempt.proposalPath ?? ''})`
    return STAGE_TEXT[attempt.status]
  }
  return [
    `# Challenges in the network that ${researcherName}'s work may address`, '',
    `Demonstration of the reverse search for the EINSTEIN Stars scenario, researcher ${screening.researcherId}. The profile is synthetic; whether this person takes part in Stars is not known.`, '',
    `Screened ${screening.challenges.length} challenges; ${kept.length} passed both Jev filters; the first ${attempts.length} were checked in depth.`, '',
    '| Challenge | Company | Jev: methods address it | Jev: research problem | Outcome |', '|---|---|---:|---:|---|',
    ...kept.map(challenge => `| ${challenge.taskId} | ${companyNames.get(challenge.companyId) ?? challenge.companyId} | ${challenge.fit} | ${challenge.researchFit} | ${outcomeOf(challenge.taskId)} |`), '',
    '## How to read this', '',
    `- The two Jev values are screening filters (threshold ${screening.threshold}), not the probability that a collaboration succeeds. Whether scores from different request batches are comparable has not been tested.`,
    '- Only the first challenges by Jev order were checked in depth (Matchmaker, Jev 0.9 check, Writer and Critic). The rest passed screening only; a challenge missing here was not found by this search, which does not show that the work does not apply.',
    '- Willingness and availability come only from the researcher\'s own explicit statements; every proposal is a draft for the researcher and a coordinator to review before any contact.',
  ].join('\n') + '\n'
}
