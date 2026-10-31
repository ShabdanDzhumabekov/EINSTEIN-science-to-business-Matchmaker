# Critic calibration

The first section (30.10) calibrated the pair Critic of the earlier route, which no longer exists; it is kept for history. The section at the end (31.10) calibrates the proposal Critic that runs today.

A Critic that blocks everything is as useless as one that passes everything. Before the full run we checked both directions on controlled inputs. These inputs are hand-written test assessments, labelled as such; they are not part of any submission trace.

## Setup

- Task `C001-CH1` (anomaly detection on Modbus/BACnet without labelled attacks) and researcher `R1015`, using the task and researcher cards produced by the real Industry Analyst and Researcher roles (`fixtures/dev/`).
- **Good pair:** joint project that carries all four task constraints (no labels, on-device inference, plain-language explanations, no six-month data collection), with honest risks (BACnet untested, hardware limits unknown) and open questions (availability, hardware).
- **Flawed pair:** the same, but with only one of the four constraints, a narrowed problem ("Modbus anomalies with a deep autoencoder") and no risks or questions.
- `critiquePair` through the project's Mozaik `RoleInference` adapter, live OpenRouter calls, 2026-10-30.

## Results

| Critic model | Prompt | Good pair passed | Flawed pair blocked |
|---|---|---|---|
| `google/gemini-2.5-flash` | v1 | 2 / 2 | 2 / 2 |
| `deepseek/deepseek-v4-pro` | v1 | 1 / 2 | 2 / 2 |
| `google/gemini-2.5-flash` | v2 | 2 / 3 | not re-run |
| `deepseek/deepseek-v4-pro` | v2 | 3 / 3 | 2 / 2 |

"Blocked" means the verdict contained `constraint_omitted` for the dropped constraints; both blocked runs of each model named the explainability and on-device constraints.

- v1 → v2: the false block by DeepSeek (v1) argued that a cited abstract was "not linked to the researcher". Authorship is verified by code before the model sees the claim, so the prompt now says so explicitly.
- Gemini's false block (v2) claimed the explainability constraint was missing although it was in the constraints list.

**Outcome of the calibration:** among the two models tried, `deepseek/deepseek-v4-pro` gave no false blocks after the prompt fix (about $0.012 per review).

**Team decision for the build:** every role runs on `deepseek/deepseek-v4.1-flash-1017` while the product is assembled end to end. The table above covers other models; the selected model has only the smaller check below. Model choice is revisited after the full pipeline works.

## Merge check on the selected model

During integration on 2026-10-30, a smaller live check used `deepseek/deepseek-v4.1-flash-1017` with low reasoning effort on the same task and researcher. The deliberately incomplete assessment was blocked for omitted constraints and an unjustified narrowing to Modbus.

The intended positive control was also blocked: its researcher availability was too confident, and its device constraints were insufficiently linked to evidence. After those inputs were corrected, another review identified a genuine task-card omission: the original challenge requires learning a site's normal behaviour and detecting drift from that baseline. A final control added that constraint with an exact quotation from the challenge, retained unknown availability and explicit hardware questions, and passed with zero issues across 11 checked claims.

These are successive revisions of a hand-written control, not independent benchmark successes. They demonstrate useful rejection and acceptance on this example; they are not a full workflow run or a submission trace. The failed controls and final inputs are retained in local, ignored `runs/merge-calibration-*` artifacts.

## What this does not show

Two or three runs per cell are far too few for a rate; they show the Critic can tell a complete pair from one that drops hard constraints, on one task. The full run's trace is the real evidence.

## 31.10: the proposal Critic with a checklist

Across the seven Sol runs bundled before this change, the LLM layer of the proposal Critic raised one content issue in 32 reviews, while the external reader found gaps in approved texts. Commit `13db5ec` makes the Critic fill a ten-item checklist first (`checks` in the verdict); a `pass` needs the proposal span that satisfies the item, a `fail` becomes an issue, and `plan_underspecified` covers the first experiment, the metric and causal claims.

Calibration before the live run: the new Critic (GPT-6.1 Sol, the Writer's model) reviewed six saved proposals through `critiqueProposal`, with their real cards and pair assessments, live OpenRouter calls, no Writer involved. Three come from `11-31-02`, whose review had named one gap per proposal; three from the main run `12-39-58`, reviewed `accept` ×3.

| Proposal | Known state | New Critic | Matches the human-style review? |
|---|---|---|---|
| `11-31-02` C001-CH1 / R1008 v2 | gap: false-alert rate from sampled windows undefined | blocking `plan_underspecified`: alert grouping, sampled-count weighting, exposure and uncertain labels undefined, "permitting a false pass by excluding difficult windows"; second issue on the explanation test | yes, the known gap |
| `11-31-02` C009-CH1 / R0288 v2 | gap: no separate acceptance for the original bank | blocking `plan_underspecified`: "a pooled miss rate below 5% can conceal continued failure on the original bank client" | yes, the known gap |
| `11-31-02` C003-CH1 / R0365 v1 | gap: factor design cannot separate interactions | blocking `plan_underspecified`: single-factor arms plus one combined arm cannot separate the pairwise and three-way interactions; second issue on the crack-initiation criterion | yes, the known gap |
| `12-39-58` C001-CH1 / R1008 v1 | accept | one blocking issue: what counts as a correct plant-manager interpretation and how repeated ratings enter the 80% target are undefined | stricter than the reviewer; the point is real |
| `12-39-58` C009-CH1 / R0349 v1 | accept | no issues, ten checks pass with quoted spans | yes |
| `12-39-58` C003-CH1 / R0365 v1 | accept | Jev rated one fact at 0.48 (threshold 0.5, the same fact passed at 0.94 in the run); one blocking issue on the share of matching replicates and the life statistic | stricter than the reviewer |

No invented quotation in any of the six reviews; every `pass` cites a span of the proposal. The Critic now finds the three gaps that previously only the external reader found, at the price of stricter demands on accepted texts. Whether the Writer can satisfy those demands within its limits is what the live run after this commit tests.

### Live runs after the calibration

- `14-07-56` (`13db5ec`): 3 × `ready`, one Critic intervention per challenge, all three judged justified by the external reviewer. The revisions, however, dropped conditions the issues had not mentioned: the Writer saw only the issues and rewrote from scratch.
- `778c2a1`: the Writer now receives its rejected draft with the rule to keep every target, threshold, uncertainty rule, population-specific acceptance and control condition; the metric item of the checklist asks for the quoted statistical condition.
- `14-15-54` (`778c2a1`): 3 × `ready` with the main run's pairs, one justified intervention per challenge, and the reviewer confirmed that every condition of each first draft survived its revision. The main run stays `12-39-58` because its first drafts set stricter targets; see `submission/README.md`.
- `14-26-54` (`778c2a1`), the fixed sample of ten unselected challenges: 5 `ready` against 6 with the earlier Critic; two challenges ended `proposal_needs_revision` after three rejected drafts; 12 interventions in 17 reviews, none with an unverified quote; $3.40 against $2.26. The stricter Critic costs one `ready` and half as much again; its rejections in the sample were not externally checked.
- `14-27-00` (`778c2a1`), the three main challenges again: 3 × `ready`, five interventions (two for C001, two for C003, one for C009), all five judged justified and none a nitpick by the external reviewer; in C001 the Critic itself caught a condition the v2 revision had dropped and v3 restored it. Across the three checklist runs on the main challenges: 11 interventions, 11 confirmed, 0 invented quotes.
