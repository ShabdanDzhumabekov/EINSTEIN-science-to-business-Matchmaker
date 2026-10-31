I checked all **24 fact statements and 41 ledger quotations** against the synthetic dataset. Forty quotations match exactly; one has a capitalization mismatch. The substantive concerns are about interpretation and experiment design.

**[C001-CH1](../2026-10-31T02-53-36-065Z/proposals/C001-CH1.md): ArmaturaSec × Krisztina Kiss (R1008)**

**1. Would both sit down? Yes.** ArmaturaSec needs site-specific detection without attack labels, and Kiss has directly relevant methods plus an expressed preference for deployment on real infrastructure.

**2. Fact checks**

| Fact | Dataset check | Assessment |
|---|---|---|
| F1: No confirmed attacks; “only normal-traffic archives” | Both quotes exist in `C001-CH1.detail`. | **Overstatement:** no confirmed attacks does not establish that the archives contain exclusively benign traffic; the same field explicitly acknowledges potentially unnoticed compromise. |
| F3: Public-data supervised classifier caused excessive false positives | Quote exists in `C001-CH1.detail`; surrounding text confirms supervised training on public ICS datasets. | Supported. |
| F4: Company “requires” no forwarding-latency impact | Quote exists in `C001.plans`. | **Scope overstatement:** this is an objective for a planned hardware variant, not an explicitly stated hard constraint in CH1. |
| F6: One to two part-time engineers and NDA access | Both quotes exist in `C001.rd_capacity`. | Supported as stated capacity, not an allocation already agreed for this project. |
| F8: Modbus baselines, Mahalanobis detector, unlabelled calibration | All three quotes exist in `SYN-PUB-10472.abstract` and `SYN-PUB-10480.abstract`; Kiss is an author. | Supported. These records do not establish BACnet performance. |

**3. Hard constraints:** The proposal covers both protocols, learning without attack examples, site-specific baselines, on-device inference and plain-language explanation. BACnet availability is appropriately unresolved. Engineer review is a useful preliminary check, but cannot establish that plant managers understand the alerts. The proposed latency “agreed bound” also needs reconciliation with the stronger roadmap objective quoted in F4.

**4. Inventions or premature results:** The 12 weeks, alarm/recall targets and two pilot clients are clearly proposals or conditions, not achieved results or secured resources. However, **“Kiss proposes” and “ArmaturaSec proposes” attribute actions to participants without evidence that either proposed them**. The late-2025 hardware date comes from `C001.plans`; its actual delivery remains unconfirmed.

**5. Willingness/availability:** Mostly honest. `R1008.open_to` supports interest in this collaboration format; the proposal explicitly leaves availability and data-sharing approval open. The participant-attribution wording above needs correction.

**6. Most important fix:** Treat the archives as **presumed normal, unlabelled traffic**, and require review of evaluation windows and alerts before interpreting the result as “false alarms per day.” Otherwise the main acceptance metric assumes ground truth the company explicitly lacks.

**[C009-CH1](../2026-10-31T02-53-36-065Z/proposals/C009-CH1.md): LinguaBot × Stefan Dragić (R0349)**

**1. Would both sit down? Yes.** LinguaBot has a measured retrieval problem and a substantial Serbian corpus, while Dragić offers closely matched expertise and notes capacity for a small industrial engagement.

**2. Fact checks**

| Fact | Dataset check | Assessment |
|---|---|---|
| F1: 12,000 queries, approximately 18% misses, over half linked to morphology/script | Both quotes exist in `C009-CH1.detail`. | Supported. The 12,000 are **all sampled queries**, not 12,000 misses. |
| F3: Approximately €8,000 and something testable within six months | Exact quote exists in `C009-CH1.detail`. | Supported; the budget specifically concerns tooling or data work. |
| F4: Automatic script mixing and vocabulary updates without full re-indexing | Exact quote exists in `C009-CH1.detail`. | Supported. |
| F6: Research focus and capacity for one small contract | Exact Serbian quotes exist in `R0349.bio` and `R0349.notes`. | Translation is faithful. Capacity is not commitment to this six-month project. |
| F7: F1 0.81, improvement of 14 percentage points | Both quotes exist in `SYN-PUB-04278.abstract`; Dragić is an author. | Supported for its newspaper-corpus experiment, not LinguaBot support queries. |
| F8: Stemming after normalisation performs better | Both quotes exist in `SYN-PUB-00225.abstract`. | Supported, but the paper compares **stemming after versus before normalisation**. It does not establish the proposal’s comparison against stem-only. |

**3. Hard constraints:** Serbian accuracy, automatic script mixing, vocabulary updates without full re-indexing, the below-5% target, budget and six-month testability are all represented. Manageable maintenance remains weakly operationalised: override rules could repeat the manual-upkeep problem in `C009-CH1.detail`. Budget feasibility is acknowledged but not demonstrated.

The experiment also introduces an unnecessary condition: stem-after-normalisation must beat stem-only even if another variant delivers the required business improvement. That condition comes from neither the company challenge nor the cited paper.

**4. Inventions or premature results:** No achieved improvement or participant commitment is invented. However, **“12,000-query miss sample” misdescribes the source population**, and the dataset does not establish that the 85,000 labelled pairs are independent of those queries. Calling them held-out validation requires an explicit disjoint split. Proposed milestones and code contributions are appropriately labelled.

**5. Willingness/availability:** Honest. `R0349.open_to` supports search customisation and joint projects; `R0349.notes` limits capacity to a smaller engagement and excludes generic software work without research. The comparative experiment supplies a research component, but the six-month scope still requires confirmation.

**6. Most important fix:** Make the go/no-go depend on **company miss-rate improvement**, allowing whichever variant works best, rather than requiring a particular normalisation/stemming hypothesis to win. Evaluate that improvement on the correctly defined, disjoint query samples.

**[C003-CH1](../2026-10-31T02-53-36-065Z/proposals/C003-CH1.md): AutomVoj × Bojan Erić (R0365)**

**1. Would both sit down? Yes.** AutomVoj has failed components and an expensive unresolved failure, while Erić offers the fatigue-testing capability and welded-joint expertise the company lacks.

**2. Fact checks**

| Fact | Dataset check | Assessment |
|---|---|---|
| F2: 2–6 °C service, suspected combined loading, room-temperature testing | First two quotes match `C003-CH1.detail`; the third says “we test…” whereas the source says **“We test…”**. | Substantively supported; the third quotation is not exact because of capitalization. |
| F3: Photos, measurements and two failed sections | Both quotes exist in `C003-CH1.detail`. | Supported; their availability for destructive testing remains subject to agreement. |
| F4: Mild-steel hollow sections, paint, MIG/MAG welding, connection location | Quotes exist in `C003-CH1.detail` and `C003.tech`. | Materials and location are directly supported. MIG/MAG is documented as company fabrication technology; applying it specifically to the failed assemblies is a reasonable but unconfirmed inference. |
| F5: Fatigue machines, −60 °C chamber, Abaqus and shared access | Both quotes exist in `R0365.bio` and `R0365.notes`. | Supported. Neither humidity control nor a booked testing window is established. |
| F7: Openness to relevant contract/joint research | Both quotes exist in `R0365.open_to`. | Supported as interest, not acceptance. |
| F8: 22% fatigue-ductility-coefficient decrease at −40 °C | Both quotes exist in `SYN-PUB-04474.abstract`; Erić is an author. | Accurate. It is not a 22% reduction in frame life, and the proposal correctly avoids that claim. |

**3. Hard constraints:** Service temperature, material, connection geometry and the desired production changes are retained. The challenge specifies no budget or delivery deadline, so the proposed ten months contradicts neither.

The important mismatch is the gate: `C003-CH1.detail` suspects **combined thermal cycling, condensation and vibration**, but mechanism investigation is conditioned on a significant cold/thermal life reduction. Testing vibration or condensation separately after a negative result does not resolve their possible interaction. The company needs the actual cause, whether or not a standalone thermal effect appears.

**4. Inventions or premature results:** No fabricated achieved result, budget or secured equipment access. New specimens, humidity-controlled testing and the schedule are proposed or conditional. The chief engineer is supported by `C003.rd_capacity`. The 22% published result is explicitly separated from performance at AutomVoj’s service conditions.

**5. Willingness/availability:** Honest. Relevant interest is documented, shared-equipment scheduling is disclosed, and personal availability is explicitly unknown.

**6. Most important fix:** Remove the **cold-effect prerequisite for root-cause investigation**. Keep the investigation capable of identifying the combined service mechanism even when the isolated temperature comparison is negative.

| Proposal | Verdict | Most important fix |
|---|---|---|
| C001-CH1 | Accept with fixes | Establish reviewed evaluation ground truth before reporting false-alarm performance. |
| C009-CH1 | Accept with fixes | Gate on company miss-rate improvement, not a preferred method winning. |
| C003-CH1 | Accept with fixes | Investigate combined failure mechanisms without requiring an isolated cold effect. |