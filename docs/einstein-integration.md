# How this plugs into the EINSTEIN network and EINSTEIN Stars

## What EINSTEIN is (public sources)

- **EINSTEIN** ("Excellence Initiative for Nutrifood-based Theranostics for Healthy European Society") is a Horizon Europe project, grant 101136377, running 2024 to 2028 and coordinated by the University of Novi Sad ([CORDIS](https://cordis.europa.eu/project/id/101136377), [project site](https://einsteineuproject.com/)). Its stated mission includes technology transfer.
- **Network entry points** include the project consortium: the University of Novi Sad, Science and Technology Park Novi Sad, Vojvodina ICT Cluster, Vojvodina Organic Agriculture Cluster, Biznis na štiklama, General Hospital "New Hospital", and the partner universities JKU Linz, Wageningen University & Research and DTU.
- **EINSTEIN Stars** is the project's competitive programme for PhD students at the University of Novi Sad and researchers within five years of their PhD whose research has industrial potential. Selected candidates get workshops, consultations on technology transfer, contacts with industry partners and investors, and a final pitch at Science and Technology Park Novi Sad ([2025 call](https://einsteineuproject.com/2025/09/04/call-for-applications-einstein-stars-program-2025/)). The 2025 edition received 8 applications ([results](https://einsteineuproject.com/2025/12/15/einstein-stars-2025-competition-successfully-concluded/)).

The Stars facts above describe the published 2025 programme, not unverified rules for a 2026 call. We describe how the system would plug in. We have not been given, and do not assume, any EINSTEIN or Stars API or supported import/export schema.

## Input, output and version boundary

An integration would import stable researcher/company IDs, task descriptions, resource limits, evidence sources, explicit participation preferences and update timestamps. Identity links should use a verified, explicitly supplied identifier such as ORCID; never match synthetic names to real people. The output is a source-linked project draft, facts versus inferences, unresolved questions, artifact versions and Critic decisions. Markdown is readable by participants; JSON supports a portal connector. A changed task, participation statement or source invalidates affected approvals and requires new review.

The network owner would confirm the supported data exchange format, eligibility rules and coordinator approval points. This is a proposed connector boundary; the repository implements the reverse search for one researcher (`npm run stars`) but no connection to Stars systems.

## Into the network: a coordinator's tool

Who uses it: the technology-transfer coordinator at UNS or the innovation team at NTP Novi Sad.

1. **Input.** A company in the network (an NTP tenant, a Vojvodina ICT Cluster member) writes down a challenge, as in the hackathon dataset: what is wrong, what they have, what they need.
2. **Run.** Code builds a card for the challenge and for every researcher; Jev screens the whole researcher table and checks that the challenge is a research problem; the Matchmaker examines the best screened pairs one at a time and proposes a format (industrial PhD or joint project); Jev checks the Matchmaker's quoted rationale; the Writer drafts the proposal, including what each side could gain, and the Critic checks every claim against its source.
3. **Human approval.** The coordinator reads each proposal with its sources and the Critic's record, then decides whether to introduce the two sides. Nothing is sent to a company or researcher automatically.
4. **Outcome.** An approved proposal becomes a first meeting agenda: the problem in the company's words, what each side brings, the first experiment, and the open questions, including whether the researcher wants the role.

Data exchange needed (all existing kinds of records, no new ones): researcher profiles and publication lists from the university, company challenges from NTP and the clusters. Partner universities (JKU, WUR, DTU) could add their researchers in the same format and widen the pool beyond Novi Sad.

## Into EINSTEIN Stars: industry contacts for each candidate

The programme promises its candidates contacts with industry partners. The same agents run in the reverse direction for one researcher with `RUN_SCHOLAR=<id> npm run stars` (two demonstration runs in [submission/README.md](../submission/README.md#reverse-search-for-einstein-stars)):

1. Take the applicant's own research (their profile and publications) as the query.
2. Screen all the network's company challenges against that work with Jev (two questions per challenge, both at 0.5 or more), then run the same Matchmaker, Jev check, Writer and Critic on the first three kept challenges, checked against the company's own words.
3. Give the candidate and the programme team a short list of concrete company problems their work could address, each with a draft one-page joint project and the open questions.

This turns "meet industry" into specific, checkable conversations before the final pitch, and gives the jury evidence of industrial potential that can be traced to sources.

It can also widen the applicant pool (8 in 2025) without ranking people: when a company challenge fits early-career researchers who state they are open to industry work, the programme team can tell them about the call. The researcher decides; the system never scores candidates or predicts winners.

## Cost and scale

Measured on 31.10.2026 with GPT-6.1 Sol and Jev 1.14 through OpenRouter: one challenge costs $0.10–0.25 and 1–3 minutes (Jev screening of all 1,047 researchers about $0.02 of that; Writer and Critic about 80%); one researcher against all 489 challenges (Stars) about $0.30. The whole dataset, 489 challenges, is an estimated $50–120, and the screening is cached, so a changed challenge or profile re-screens only itself.

The screening is the step that grows with the network: 489 × 1,047 ≈ 512,000 pair questions today. A larger network could put a company-level pre-filter in front of it: ask Jev once per researcher and company (153 × 1,047 ≈ 160,000 questions) whether the researcher's methods could matter to anything this company does, and screen challenges only within the pairs that survive. We measured it on 31.10 against the cached screenings of 15 challenges ([docs/company-prefilter-test.md](company-prefilter-test.md)): at a threshold of 0.4 it removes 46% of the researchers and loses none of the 166 kept pairs, the welding researcher behind C003-CH1 included; at 0.5 it loses three borderline pairs. It is not enabled, because at this size it saves about $1.7 per full screening after paying for itself; it becomes worthwhile when companies carry many challenges or screenings are repeated, and it would be switched on at 0.3 after the same measurement on the network's own data.

## What exists today and what would be new

| Today, in this repository | Needed for EINSTEIN |
|---|---|
| Company challenge in, researchers searched, pair proposed and checked | Same flow on the network's real records, with consent from the people in them |
| Researcher willingness read only from their own statements | A short opt-in form so researchers state willingness explicitly |
| Search from a challenge to researchers, and reverse search from one researcher to challenges (three attempts in depth) | Running the reverse search for each Stars applicant who consents, with the programme team reviewing the list |
| Proposals checked by Critic; human review required before submission/outreach | The coordinator's approval step as the gate before any introduction |
