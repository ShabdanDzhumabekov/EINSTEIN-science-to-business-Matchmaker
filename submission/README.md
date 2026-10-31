# Submission bundle

Everything here is copied from real runs by `scripts/bundle-run.sh` (the `runs/` directory itself is not committed). Data: synthetic EINSTEIN dataset `einstein-matchmaker-data@4fb99b3`. Names are invented.

## Main run: `2026-10-31T12-39-58-110Z`

One run on commit `ad28c36`, three challenges processed at the same time, three different researcher–company pairs, all `ready`. Matchmaker, Writer and Critic run on `openai/gpt-6.1-sol` with `medium` reasoning effort; Jev is `typesafe/jev-1.14`. 18 requests, $0.308 reported cost, about 1 min 15 s, no schema failures, no Critic intervention: all three proposals were approved on their first version. The Jev screening of all 1,047 researchers per challenge was loaded from the cache written on 30.10; cost and time above exclude it. A cold Jev pass costs about $0.02 per challenge.

| Challenge | Company | Researcher | Proposal | Jev stage 2 |
|---|---|---|---|---|
| [C001-CH1](2026-10-31T12-39-58-110Z/proposals/C001-CH1.md) | ArmaturaSec d.o.o. (Cybersecurity) | R1008 Krisztina Kiss | Explainable, site-specific anomaly detection for ProtoSense | 22 of 1047 kept, this pair 0.95 |
| [C009-CH1](2026-10-31T12-39-58-110Z/proposals/C009-CH1.md) | LinguaBot d.o.o. (Conversational AI) | R0349 Stefan Dragić | Reducing Serbian support-search misses without full re-indexing | 20 of 1047 kept, this pair 0.96 |
| [C003-CH1](2026-10-31T12-39-58-110Z/proposals/C003-CH1.md) | AutomVoj a.d. (Robotics and industrial automation) | R0365 Bojan Erić | Investigating chilled-service cracking in AutomVoj conveyor welds | 14 of 1047 kept, this pair 0.94 |

What changed against the previous main run (`11-58-04`): two Writer rules. An operational rate used in go/no-go must define the counted event, merging of repeats and the exposure denominator (`7ff60f2`); C001 now counts merged alert episodes and divides false plus unresolved episodes by observed site-days. A fact holds only what its source says, with conditions moved to actions or questions (`ad28c36`); this removes the cause of the false Jev block in `11-58-04`. The external review rates all three `accept`, against C001 `accept with fixes` before.

- **Trace:** [trace.md](2026-10-31T12-39-58-110Z/trace.md) and [trace.jsonl](2026-10-31T12-39-58-110Z/trace.jsonl).
- **Trace with a Critic intervention:** [`11-58-04` trace.md](2026-10-31T11-58-04-042Z/trace.md). Jev rated a C001 fact at 0.24 against its source sentences, the Critic blocked it and the Writer revised it; version 2 was approved. The reviewer judged this block unjustified: the fact had a recommendation appended to it. We report it as a false block of the Jev fact check.
- **Jev screening, artifacts, model calls:** [screening/](2026-10-31T12-39-58-110Z/screening/), [artifacts/](2026-10-31T12-39-58-110Z/artifacts/), [inference.jsonl](2026-10-31T12-39-58-110Z/inference.jsonl), [metrics.json](2026-10-31T12-39-58-110Z/metrics.json).

**Why the model changed.** On the same code and challenges, DeepSeek V4.1 Flash reached 3 × `ready` in one run of six on 31.10, with many Writer and Critic rounds; GPT-6.1 Sol reached it in both of its runs (this one and `runs/2026-10-31T10-59-42-189Z`, not bundled, on `ff905f2` without explicit effort). Claude Sonnet 5.5, DeepSeek V4 Pro and GLM 5.3 were tried and stopped for cost, speed or schema failures. Part of the quality gain over the earlier bundles comes from Writer rules added on 31.10 (`4915c5b`, `7c88db3`), not from the model.

## Full run with cold screening: `2026-10-31T13-11-35-673Z`

The same three challenges on commit `41933a2`, with the screening cache set aside so that the whole route, Jev screening included, is in one run's journal: 39 requests (21 Jev screening batches with 3,144 questions, 18 further LLM and Jev requests), $0.396, 1 min 19 s, 3 × `ready` with the same pairs (C001/R1008, C009/R0349, C003/R0365), 0 Critic interventions. Since this commit every screening and check artifact records the wording of its Jev questions (`questions`, `question`), and every proposal Markdown ends with its evidence ledger (fact, record, field, quote).

The external reviewer confirmed 52 of 52 quotes, the cold screening and that all earlier findings stay closed, but did not accept it as a replacement for `12-39-58`: the C001 draft loosened two proposed parameters (detection 90% → 80%, alert merge 60 s → 5 min) and the C003 draft dropped the explicit room-temperature loaded control ([review](reviews/codex-review-run-2026-10-31T13-11-35.md)). The variation between two runs on identical inputs is the model's; we keep both runs unchanged and point to this one for provenance of the screening.

## Checklist Critic: `14-07-56`, `14-15-54` and `14-27-00`

Since `13db5ec` the Critic fills a ten-item checklist (`checklist` in every review artifact) before it may approve; a `pass` needs the proposal span that satisfies the item, a failed item becomes an issue, and `plan_underspecified` covers the first experiment, the metric and causal claims. Since `778c2a1` the Writer receives its rejected draft and the rule not to drop any acceptance condition. All LLM roles on GPT-6.1 Sol, screening from cache.

| Run | Result | Critic | Reviewer | Cost |
|---|---|---|---|---|
| [`14-07-56`](2026-10-31T14-07-56-861Z/) on `13db5ec` | 3 × `ready`, all v2; C009 with R0288 (R0349 scored 0.89 at the Jev check) | 3 interventions, one per challenge, all `plan_underspecified` | 45/45 quotes; all three interventions justified; not accepted as main because the revisions dropped conditions the issues had not mentioned (confidence bounds, the bank threshold after an update, the improvement gate): [review](reviews/codex-review-run-2026-10-31T14-07-56.md). That finding produced `778c2a1`. | 30 requests, $0.63 |
| [`14-15-54`](2026-10-31T14-15-54-356Z/) on `778c2a1` | 3 × `ready`, all v2, the main run's pairs | 3 interventions, one per challenge | 49/49 quotes; all three interventions justified, every condition of each first draft preserved in its revision; not accepted as main because the first drafts set weaker targets than `12-39-58` (80% vs 90% detection, no overall <5% threshold, no ≥25% gate): [review](reviews/codex-review-run-2026-10-31T14-15-54.md) | 28 requests, $0.70 |
| [`14-27-00`](2026-10-31T14-27-00-166Z/) on `778c2a1` | 3 × `ready` (C001 v3, C003 v3, C009 v2 with R0288; R0349 scored 0.87 at the Jev check) | 5 interventions | 41/41 quotes; all five interventions justified, none a nitpick; one condition dropped in C001 v2 was restored by the Critic in v3; not accepted as main (C001 again at 80%): [review](reviews/codex-review-run-2026-10-31T14-27-00.md) | 36 requests, $0.81 |

This is the trace we point to for the Critic's work: the interventions are real and confirmed. The main run stays `12-39-58` under the rule that a replacement must not be weaker on any acceptance condition; the difference lies in the Writer's first drafts, which vary between runs on identical inputs. Calibration before the live runs: [docs/critic-calibration.md](../docs/critic-calibration.md).

## Critic on a second model: `2026-10-31T13-48-14-687Z` and `2026-10-31T13-53-23-732Z`

Across the seven bundled Sol runs the LLM layer of the Critic raised one content issue in 32 reviews, while the external reader found substantive gaps in approved proposals (the C001 rate, the C009 bank, the C003 matrix), which were then closed by Writer rules. A reviewer that is also the author shares its blind spots, so commit `33a9cb3` gives the Critic its own model route (`MODEL_CRITIC`) and two runs put DeepSeek V4.1 Flash there with Matchmaker and Writer on Sol.

| Run | Result | Critic | Cost |
|---|---|---|---|
| [`13-48-14`](2026-10-31T13-48-14-687Z/) on `33a9cb3` | 3 × `ready`, same pairs as the main run | one block of C003 v1 for a go/no-go "at 2–10 °C" against a company quote "between 2 °C and 5 °C"; neither text exists (the draft and the record both say 2–6 °C). A false block with an invented quote, confirmed by the [review](reviews/codex-review-run-2026-10-31T13-48-14.md), which also found the C001 detection target loosened to 80% | 22 requests, $0.43 |
| [`13-53-23`](2026-10-31T13-53-23-732Z/) on `810ab83` | 3 × `ready`; C009 paired with R0288 because R0349 scored 0.89 at the Jev check | no issues, nothing unverified | 21 requests, $0.24 |

What the experiment changed in the code (`810ab83`): the Critic's quoted sources are now verified against the dataset by the same check as the Writer's facts; an issue whose quote is not found is kept in the verdict as `unverifiedIssues` and does not block. The verdict also records Jev's support probability for every fact (`jevFactCheck`). `MODEL_CRITIC` stays available but defaults to the Writer's model; the main run is unchanged.

## Reverse search for EINSTEIN Stars

`npm run stars` with `RUN_SCHOLAR`, on commit `6572f81`. One researcher's full card against all 489 challenges; Jev answers two questions per challenge (do the methods address it, is it a research problem), in batches of at most 25 challenges and 96 KiB; a challenge is kept if both are at least 0.5. The first three kept, in Jev order, run through Matchmaker, Jev 0.9 check, Writer and Critic for that fixed pair. Both researchers were chosen before running because their main-run pairs were known; finding those again is a check of a familiar case, not independent validation.

| Run | Researcher | Kept of 489 | Checked in depth | Requests, cost |
|---|---|---|---|---|
| [`stars-2026-10-31T12-43-03-800Z`](stars-2026-10-31T12-43-03-800Z/stars-report.md) | R0349 | 17 (20 Jev batches) | C009-CH1 `ready`, C132-CH4 `ready` (Lex Automatika, outside the main set), C114-CH2 `check_failed` | 35, $0.32 |
| [`stars-2026-10-31T12-44-29-257Z`](stars-2026-10-31T12-44-29-257Z/stars-report.md) | R0365 | 8 | C003-CH1 `ready`, C086-CH4 and C068-CH2 `check_failed` | 32, $0.21 |

Each run keeps `stars-screening.json` with both Jev values for all 489 challenges, the trace and every artifact. Limits written in each report: the Jev values are filters, not success probabilities; comparability across batches was not tested; a challenge not found was not shown to be unrelated; profiles are synthetic and Stars membership is unknown. The external reviewer checked the new C132-CH4 proposal (15 of 15 quotes exact, no inflated commitments, `accept` as a conditional proposal) and the dropped C114-CH2 (16 of 16 quotes exact; the drop is a conservative one, the researcher's works support normalisation and search but not the company's required daily indicator extraction): [review](reviews/codex-review-stars-2026-10-31T12-43-03.md). The other Stars proposals were not reviewed.

## Sample of ten unselected challenges

To show behaviour beyond the three chosen challenges, ten challenges were drawn once with Python `random.seed(7)` from all 489, excluding the five already used (C001-CH1, C003-CH1, C005-CH1, C009-CH1, C064-CH3), and run unchanged. Every outcome is kept. The same ten ran on both models; the code differs (DeepSeek on `6e568e3`, Sol on `572d60a`, which adds the Writer rules of 31.10 and role-specific availability), so the difference is not the model alone. Ten challenges is a small sample, not a success rate.

| Challenge | GPT-6.1 Sol, checklist Critic, [`2026-10-31T14-26-54-981Z`](2026-10-31T14-26-54-981Z/) | GPT-6.1 Sol, earlier Critic, [`2026-10-31T11-36-32-189Z`](2026-10-31T11-36-32-189Z/) | DeepSeek V4.1 Flash, [`2026-10-31T01-44-53-297Z`](2026-10-31T01-44-53-297Z/) |
|---|---|---|---|
| C008-CH3 | `screened_out` (not a research problem) | `screened_out` (not a research problem) | `screened_out` |
| C013-CH2 | `proposal_needs_revision` (Critic rejected three drafts) | `check_failed` (8 pairs below Jev 0.9) | `check_failed` |
| C017-CH1 | `ready` | `ready` | `proposal_needs_revision` |
| C026-CH3 | `ready` | `ready` | `ready` |
| C053-CH1 | `check_failed` (8 pairs below Jev 0.9) | `ready` | `ready` |
| C060-CH2 | `ready` | `ready` | `ready` |
| C065-CH2 | `ready` | `proposal_needs_revision` | `ready` |
| C086-CH1 | `ready` | `ready` | `check_failed` |
| C105-CH2 | `check_failed` (3 pairs below Jev 0.9) | `check_failed` (3 pairs below Jev 0.9) | `check_failed` |
| C132-CH4 | `proposal_needs_revision` (Critic rejected three drafts) | `ready` | `check_failed` |
| **Total** | **5 ready**, 155 requests, $3.40, 15 min 4 s, 12 Critic interventions, no schema failures | **6 ready**, 118 requests, $2.26, 8 min 25 s, no schema failures | **4 ready**, 137 requests, $0.25, 11 min 13 s |

All three runs loaded the Jev screening from the cache written by the first DeepSeek sample run; cold screening of these ten cost $0.19. The checklist Critic (`778c2a1`) is stricter: it rejected three drafts in a row for C013-CH2 and C132-CH4, which the earlier Critic had passed, intervened 12 times in 17 reviews, and the run cost 50% more; whether its rejections were right was not checked by an external reader. The `ready` proposals of the sample were not reviewed either; only the three main proposals were.

## Earlier runs

- [`2026-10-31T11-58-04-042Z`](2026-10-31T11-58-04-042Z/): the previous main run, on `655f754` with GPT-6.1 Sol, before the rules on operational rates and facts without conditions. 3 × `ready` with the same pairs, 21 requests, $0.377, 1 Critic intervention (a false Jev fact block, see above); reviewed C001 `accept with fixes`, C009 and C003 `accept`.
- [`2026-10-31T11-31-02-552Z`](2026-10-31T11-31-02-552Z/): the previous main run, on `e503254` with GPT-6.1 Sol, before the rules on population-specific targets and full factor matrices. 3 × `ready` (C001 with R1008, C009 with R0288, C003 with R0365), 27 requests, $0.548, 2 Critic interventions; reviewed `accept with fixes` ×3.
- [`2026-10-31T09-46-59-649Z`](2026-10-31T09-46-59-649Z/): the previous main run, on commit `c360f5b` with `deepseek/deepseek-v4.1-flash-1017`, before the Writer rules on a researcher-sourced fact, labelling all evaluation windows, the best configuration and the factor matrix. 3 × `ready` (C001-CH1 with R0773, C009-CH1 with R0349, C003-CH1 with R0365), 48 requests, $0.100, 4 Critic interventions; for C001-CH1 the Critic and the Jev 0.9 check dropped four pairs before the fifth became `ready`.
- [`2026-10-31T02-53-36-065Z`](2026-10-31T02-53-36-065Z/): run on commit `e33b91f`, before the Writer rules on unlabelled data, separate samples, the company's metric and combined causes. 3 × `ready`, 3 Critic interventions; its review findings led to those rules.
- [`2026-10-30T23-59-47-335Z`](2026-10-30T23-59-47-335Z/): the previous main run on earlier code, also 3 × `ready` (C001-CH1 paired with R0416), 1 Critic intervention.
- [`2026-10-31T00-38-00-194Z`](2026-10-31T00-38-00-194Z/): C064-CH3 (sales coaching) `screened_out`, Jev research-problem probability 0.03.

## Independent review

[reviews/](reviews/) holds reviews by Codex `gpt-6-astra`, used as a stand-in for a human reader. Each checked every ledger quote against the dataset and judged the proposals from the company's and the researcher's side.

| Review | Covers | Quotes checked | "Would both sit down?" | Verdict |
|---|---|---|---|---|
| [codex-review-run-2026-10-31T14-27-00.md](reviews/codex-review-run-2026-10-31T14-27-00.md) | the repeated checklist-Critic run | 41: all exact | yes, yes, yes | 5/5 interventions justified; revisions mostly preserve conditions, one lapse caught by the Critic itself |
| [codex-review-run-2026-10-31T14-15-54.md](reviews/codex-review-run-2026-10-31T14-15-54.md) | the checklist-Critic run on `778c2a1` | 49: all exact | yes, yes, yes | 3/3 interventions justified, revisions keep every condition; not the main run (weaker first-draft targets) |
| [codex-review-run-2026-10-31T14-07-56.md](reviews/codex-review-run-2026-10-31T14-07-56.md) | the checklist-Critic run on `13db5ec` | 45: all exact | yes, yes, yes | 3/3 interventions justified; revisions dropped unrelated conditions, fixed in `778c2a1` |
| [codex-review-run-2026-10-31T13-48-14.md](reviews/codex-review-run-2026-10-31T13-48-14.md) | the first run with the Critic on DeepSeek | 49: all exact | yes, yes, yes | not accepted as the main run (C001 target loosened); the Critic's block confirmed false, its quote invented |
| [codex-review-run-2026-10-31T13-11-35.md](reviews/codex-review-run-2026-10-31T13-11-35.md) | the cold-screening run | 52: all exact | yes, yes, yes | facts and provenance pass; not accepted as the main run (two loosened parameters in C001, missing room-temperature control in C003) |
| [codex-review-stars-2026-10-31T12-43-03.md](reviews/codex-review-stars-2026-10-31T12-43-03.md) | the Stars run for R0349 | 31: all exact | yes (C132-CH4) | C132-CH4 accept; the C114-CH2 drop judged conservative but defensible |
| [codex-review-run-2026-10-31T12-39-58.md](reviews/codex-review-run-2026-10-31T12-39-58.md) | **the main run above** | 47: all exact | yes, yes, yes | accept ×3, no required fixes; no false Critic blocks |
| [codex-review-run-2026-10-31T11-58-04.md](reviews/codex-review-run-2026-10-31T11-58-04.md) | the previous main run (`655f754`) | 47: all exact | yes, yes, yes | C001 accept with fixes (false-alarm rate from sampled labels), C009 accept, C003 accept; one false Critic block |
| [codex-review-run-2026-10-31T11-31-02.md](reviews/codex-review-run-2026-10-31T11-31-02.md) | the previous main run (GPT-6.1 Sol) | 41: all exact | yes, yes, yes | accept with fixes (operational false-alarm rate from sampled labels; a separate below-5% acceptance on the original bank's queries; pairwise factor conditions) |
| [codex-review-run-2026-10-31T09-46-59.md](reviews/codex-review-run-2026-10-31T09-46-59.md) | the previous main run (DeepSeek) | 34: all exact | yes, yes, yes | accept with fixes (on-device latency check, evaluate on the original bank's queries, pairwise interactions) |
| [codex-review-run-2026-10-31T02-53-36.md](reviews/codex-review-run-2026-10-31T02-53-36.md) | the run on `e33b91f` | 41: 40 exact, 1 differs only in letter case | yes, yes, yes | accept with fixes (unlabelled archives are not ground truth, gate on the company metric, investigate combined causes) |
| [codex-review-run-2026-10-30T23-59-47.md](reviews/codex-review-run-2026-10-30T23-59-47.md) | the previous main run | 47: 46 exact, 1 differs only in letter case | yes, yes, yes | accept with fixes (experimental design, one assumed crack location) |
| [codex-review-run-2026-10-30T23-49-37.md](reviews/codex-review-run-2026-10-30T23-49-37.md) | an earlier run, not bundled | 29: 28 exact, 1 letter case | maybe, yes, yes | accept with fixes |

Findings were turned into general Writer rules (test every company target, change one suspected cause at a time, keep quotes at their strength, bound list sizes), not hand edits of any text. A person from the team still reads the final proposals before submission.
