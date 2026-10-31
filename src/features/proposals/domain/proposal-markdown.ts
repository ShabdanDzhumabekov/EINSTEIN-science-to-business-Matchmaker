import type { Proposal } from '../../../contracts/proposal'

export function proposalMarkdown(proposal: Pick<Proposal, 'title' | 'facts' | 'inferences' | 'proposedActions' | 'questions' | 'benefits'>): string {
  return [
    `# ${proposal.title}`, '', '## Verified facts',
    ...proposal.facts.map((fact, index) => `- ${fact.text} [F${index + 1}]`), '',
    '## Potential benefits', `- For the company: ${proposal.benefits.company}`, `- For the researcher: ${proposal.benefits.researcher}`, '',
    '## Our inference', ...proposal.inferences.map(text => `- ${text}`), '',
    '## Proposed next steps', ...proposal.proposedActions.map(text => `- ${text}`), '',
    '## Open questions', ...proposal.questions.map(text => `- ${text}`),
  ].join('\n')
}
