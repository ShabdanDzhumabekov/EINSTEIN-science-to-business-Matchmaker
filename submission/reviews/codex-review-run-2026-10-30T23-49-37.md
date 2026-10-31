I checked all **17 fact items and 29 ledger quotations**. **28 quotations match exactly**; one differs only in capitalization. The substantive concerns are experimental design, acceptance criteria, and a few overstated claims.

**C001-CH1: ArmaturaSec × Branislava Ostojić, R0773 (`runs/2026-10-30T23-49-37-070Z/proposals/C001-CH1.md`, run not bundled)**

**1. Would they meet? Maybe.** ArmaturaSec has a concrete problem and relevant data, while Ostojić has credible statistical monitoring methods, but protocol-traffic transfer and her interest in this data remain unconfirmed.

**2. Fact checks**

| Fact | Dataset record/field | Quote exists and supports claim? |
|---|---|---|
| F1: no labelled attacks; supervised approach unsuitable | `C001-CH1.text` | Yes, both quotes match and support the company’s stated situation. |
| F2: several terabytes collected over three years | `C001-CH1.detail` | Yes. The surrounding text calls the traffic normal, but also acknowledges possible unnoticed compromises. It is not certified attack-free. |
| F3: on-device inference, processor plan, customer preferences | `C001-CH1.detail`; `C001.plans`, `.about` | All quotes match. **“Must”** strengthens “have the hardware”; **“reject”** strengthens “not looking for.” The direction fits the profile, but these are stronger formulations than the quotations. |
| F4: understandable alerts and false-positive problem | `C001-CH1.detail` | Yes, both quotes directly support the claim. |
| F5: one or two part-time engineers, archives and bench | `C001.rd_capacity` | Yes, including the NDA condition. |
| F6: researcher excludes substantial firmware integration | `R0773.notes` | Yes, directly supported. |

The proposed methods also have genuine backing: sliding-window covariance CUSUM in `SYN-PUB-08483`, calibrated one-class SVM scores in `SYN-PUB-08490`, and drift monitoring in `SYN-PUB-08494`. However, `SYN-PUB-08483` reports a **7% false-alarm increase** alongside faster detection. The proposal should acknowledge this relevant tradeoff rather than imply adaptation necessarily improves both.

**3. Company constraints:** No central requirement is explicitly contradicted. However, plain-language explainability is acknowledged without being tested in the go/no-go criteria. A calibrated score or run rule does not itself demonstrate that a plant manager understands the alert. The packet-forwarding latency objective in `C001.plans` also lacks an explicit acceptance check.

**4. Invented resources or results:** No achieved collaboration results are invented. The eight-week experiment and three-month pilot are clearly proposals. Access to suitable sites and injected scenarios remains unconfirmed, rather than established by the dataset.

**5. Willingness/availability:** Honestly conditional, with firmware limits respected. One relevant preference is omitted: `R0773.notes` seeks **labelled or time-stamped operational data**. Whether the traffic archives satisfy her research interests should be confirmed.

**6. Most important fix:** Add plant-manager validation of plain-language alert explanations to the go/no-go decision.

**C009-CH1: LinguaBot × Stefan Dragić, R0349 (`runs/2026-10-30T23-49-37-070Z/proposals/C009-CH1.md`, run not bundled)**

**1. Would they meet? Yes.** The company’s Serbian morphology and mixed-script failures closely match Dragić’s published methods, industrial experience, and stated collaboration interests.

**2. Fact checks**

| Fact | Dataset record/field | Quote exists and supports claim? |
|---|---|---|
| F1: 12,000 queries, approximately 18% misses, attribution | `C009-CH1.detail` | Yes, both quotations match and preserve the sample’s scope. |
| F2: Croatian stemmer and unmanageable manual lists | `C009-CH1.detail` | Yes; the surrounding text confirms synonym lists and script normalization. |
| F3: 85,000 labelled pairs and two linguists | `C009-CH1.detail` | Yes, directly supported. |
| F4: approximately €8,000 and six months | `C009-CH1.detail` | Yes. The money is specifically for tooling/data work; six months is the deadline for something testable. |
| F5: below 5% misses with manageable maintenance | `C009-CH1.detail` | Yes, directly supported. |
| F6: mixed-script indexing and morphology after normalization | `SYN-PUB-04278.abstract`; `SYN-PUB-00225.abstract` | Both quotes match; Dragić is an author of both. The selected second quote supports **stemming**; lemmatization is supported by the full abstract, rather than that excerpt alone. |

**Overstatement:** The inference groups loanwords, proper nouns and mid-word script typos as “company-reported.” `C009-CH1.detail` reports mid-word script mixing; loanwords and proper nouns come from research evidence such as `SYN-PUB-04279`, not the company’s account.

Incremental indexing in `SYN-PUB-02734` concerns inserting new news articles. It does not establish that changing vocabulary or normalization rules can preserve existing index correctness without re-indexing. The proposal appropriately treats this transfer as unproven.

**3. Company constraints:** Budget, deadline, automatic script handling and vocabulary updates without full re-indexing are all acknowledged. However, the final gates do not explicitly require **below 5% total misses after an update without full re-indexing**. Moving from 18% to below 5% requires eliminating roughly 72% of existing misses; attributing merely “more than half” to morphology/script problems does not establish that those fixes alone can reach the target.

**4. Invented resources or results:** No fabricated people, budget or achieved results. Data access and anonymization are correctly left for confirmation. The six-month work programme is a proposal, but its effort and costs have not been demonstrated to fit the available resources.

**5. Willingness/availability:** Honest. `R0349.notes` explicitly allows one **smaller industrial contract or consulting engagement**, and the proposal acknowledges this. The work needs a bounded researcher contribution consistent with that capacity.

**6. Most important fix:** Add a final acceptance test requiring the company’s total miss-rate target after a terminology update without full re-indexing.

**C003-CH1: AutomVoj × Bojan Erić, R0365 (`runs/2026-10-30T23-49-37-070Z/proposals/C003-CH1.md`, run not bundled)**

**1. Would they meet? Yes.** AutomVoj has costly, unresolved weld failures and retained specimens, while Erić offers directly relevant fatigue testing, fracture analysis and shared laboratory equipment.

**2. Fact checks**

| Fact | Dataset record/field | Quote exists and supports claim? |
|---|---|---|
| F1: painted mild-steel hollow sections, joint location, 18 months, 2–6 °C | `C003-CH1.detail` | Yes, all three quotations match and support the claim. |
| F2: ambient tests pass; low-temperature cyclic testing unavailable | `C003-CH1.detail` | Substantively supported. **Exact-quote failure:** ledger says “we test”; source says “We test.” The second quotation matches exactly. |
| F3: 14 replacements; photos, measurements and two failed sections | `C003-CH1.detail` | Both quotes match. **“Can provide”** goes beyond confirmed possession; access has not been committed. |
| F4: no dedicated R&D; engineers divide their time | `C003.rd_capacity` | Quote matches. The engineers/live-project detail is confirmed by the remainder of the same field, outside the selected excerpt. |
| F5: contract-research interest; shared equipment scheduling | `R0365.open_to`, `.notes` | Both quotations match and directly support the claim. |

The technical match is supported by `SYN-PUB-04475` on combined thermal/mechanical cycling, `SYN-PUB-04478` on residual-stress measurements, and `SYN-PRJ-0388`. These do not establish performance on AutomVoj’s coated, condensation-exposed joints at 2–6 °C; the proposal correctly identifies that transfer gap.

**3. Company constraints:** Material, geometry, operating temperature and coating are represented. The main shortfall concerns the requested **causal diagnosis**: the first comparison changes both temperature and condensation, so a difference cannot identify which dominates. Thermal cycling is discussed, but a distinct thermal-cycling comparison is not specified. The company describes these mechanisms as suspicions, not established causes (`C003-CH1.detail`).

**4. Invented resources or results:** There is one concrete resource inflation: the experiment requests sections cut from **“two failed assemblies,”** whereas the dataset establishes only **two failed sections**. Controlled-condensation capability, welding specifications and load histories are also unverified, although generally framed as proposed inputs or questions. The schedule and outcomes are clearly proposed, not achieved.

**5. Willingness/availability:** Honest. Contract-research interest is documented, equipment sharing is disclosed, and availability and booking are explicitly requested.

**6. Most important fix:** Make the experimental comparisons separate temperature, thermal cycling and condensation sufficiently to support the promised causal diagnosis.

| Proposal | Verdict | Most important fix |
|---|---|---|
| C001-CH1 | accept with fixes | Test whether plant managers understand the alert explanations. |
| C009-CH1 | accept with fixes | Require <5% total misses after a vocabulary update without full re-indexing. |
| C003-CH1 | accept with fixes | Separate environmental factors so the experiment can identify the cause. |