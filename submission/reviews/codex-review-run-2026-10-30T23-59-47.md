I checked all **47 ledger quotations** against their named dataset fields. **46 match exactly; one differs only in capitalization.** The main weaknesses concern experimental design, rather than fabricated evidence.

For **[C001-CH1: ArmaturaSec × Ksenija Hadžić (R0416)](../2026-10-30T23-59-47-335Z/proposals/C001-CH1.md)**:

1. **Would both sit down? Yes.** ArmaturaSec has a concrete monitoring problem and relevant traffic, while Hadžić has directly related protocol-inference research and prior SCADA industry experience.

2. **Fact checks:**

   | Fact | Quote exists and supports the claim? |
   |---|---|
   | F1: No attack examples; excessive false positives | Supported by `C001-CH1.text/detail`. The explanation quote starts “we” in the ledger but “We” in the record. Minor strengthening: the source requests an explainable **method**, whereas the proposal says **every alert** must be explainable. |
   | F2: Learn a site-specific normal baseline | Exact quote in `C001-CH1.detail`; directly supports the claim. |
   | F3: Terabytes of traffic, 1–2 part-time engineers, NDA access | Exact quotes in `C001-CH1.detail` and `C001.rd_capacity`; supported. “Normal” is the company’s characterization, not independently verified absence of attacks. |
   | F4: Modbus/BACnet inspection and planned security processor | Exact quotes in `C001.products/plans`; supported as a **plan**, not confirmation that hardware shipped. |
   | F5: Precision 0.91, recall 0.87; GInferLib; industry collaboration | Supported by `SYN-PUB-04998.abstract`, `SYN-PUB-05000.abstract`, and `R0416.industry_experience/open_to`. The proposal correctly limits those metrics to injected anomalies in a SCADA test environment. |

3. **Hard constraints:** The proposal addresses site specificity, false positives, explanation and on-device operation. However, compliance with **learning without attack examples remains unresolved**: naming GInferLib/RPNI does not establish a workable normal-only training procedure. `SYN-PUB-05000` documents the library, while `SYN-PUB-04998` does not identify its learner as RPNI. `SYN-PUB-03956` explicitly discusses limitations of learning from positive examples alone. This is an evidence gap, not proof that the approach cannot work.

4. **Invented resources/results:** No material fabrication found. The physical PLC simulator bench is actually supported by `C001.tech`. The 12 weeks, recall ≥0.80 and explanation ≥80% are clearly proposed targets. Access to particular sites, plant-manager participation and planned hardware remains unconfirmed. One evaluation concern: reviewing holdout transitions “before flagging” must not let test knowledge influence the detector being scored.

5. **Willingness/availability:** Honest. `R0416.open_to` supports interest, and the proposal explicitly leaves availability and commitment unconfirmed.

6. **Most important fix:** Specify and demonstrate the normal-only training procedure before committing to RPNI, with injected anomalies reserved for independent evaluation.

For **[C009-CH1: LinguaBot × Stefan Dragić (R0349)](../2026-10-30T23-59-47-335Z/proposals/C009-CH1.md)**:

1. **Would both sit down? Yes.** This is a particularly direct match between LinguaBot’s measured retrieval failures and Dragić’s Serbian morphology, mixed-script indexing and industrial search experience.

2. **Fact checks:**

   | Fact | Quote exists and supports the claim? |
   |---|---|
   | F1: 12,000 queries, 18% misses, below-5% objective | All quotes are exact in `C009-CH1.detail`; supported, including attribution to one bank’s sample. |
   | F2: Six months and approximately €8,000 | Exact in `C009-CH1.detail`; the money specifically covers **tooling or data work**, not an established total research-contract budget. |
   | F3: 85,000 labelled pairs and two linguists | Exact in `C009-CH1.detail`; supported. |
   | F5: Vocabulary updates without full re-index | Exact in `C009-CH1.detail`; directly supported. |
   | F7: OOV reduction from 9.3% to 2.1% | Exact in `SYN-PUB-04279.abstract`; correctly described as a legal-corpus result against a Latin-only baseline, not a customer-support miss-rate result. |
   | F8–F9: Existing module, contract interest and limited capacity | Supported by `SYN-PRJ-0546.summary/participants` and `R0349.industry_experience/open_to/notes`. The Serbian quotations accurately support the English claims. |

   No material overstatement in the verified facts. The inference about residual mixed-script problems also has support in `SYN-PUB-02735.abstract`, although that source is absent from the ledger.

3. **Hard constraints:** Six-month testability, maintenance effort, Serbian morphology and updates without full re-index are represented. **Within-word script mixing is not explicitly covered in the experiment:** `C009-CH1.detail` says users mix scripts “sometimes mid-word in typos,” while the proposal foregrounds mid-sentence mixing. The evaluation should also account for the simple normalization and synonym approach the company already tried.

4. **Invented resources/results:** No invented personnel, achieved improvements or agreed commitments. The staged pilot is clearly proposed. However, the €8,000 tooling/data allowance must not silently become an assumed all-inclusive six-month budget; researcher compensation and engineering effort remain unresolved.

5. **Willingness/availability:** Honest. `R0349.notes` supports capacity for one smaller industrial contract or consultancy, and the proposal asks for confirmation. Its focused research comparison also respects his stated disinterest in generic software-development work.

6. **Most important fix:** Explicitly include within-word mixed-script typos in the held-out acceptance evaluation, so the pilot tests the full stated problem.

For **[C003-CH1: AutomVoj × Bojan Erić (R0365)](../2026-10-30T23-59-47-335Z/proposals/C003-CH1.md)**:

1. **Would both sit down? Yes.** AutomVoj has failed components and an expensive unresolved failure, while Erić offers relevant welded-joint fatigue expertise and testing equipment.

2. **Fact checks:**

   | Fact | Quote exists and supports the claim? |
   |---|---|
   | F1: Painted mild-steel hollow sections and MIG/MAG fabrication | Exact quotations in `C003-CH1.detail` and `C003.tech`; the combined claim is supported. |
   | F2: Crossmember-to-stringer cracking after about 18 months at 2–6°C | Exact quotations in `C003-CH1.detail`; supported, including inability to reproduce the failure in existing workshop tests. |
   | F3: Photos, measurements and two failed sections | Exact in `C003-CH1.detail`; supported. |
   | F4/F7: Shared testing equipment, −60°C chamber and Abaqus | Exact in `R0365.notes/bio`; supported. These fields do not establish controlled-condensation capability. |
   | F8: Thermal cycling affects fatigue in S275JR butt welds | Quote exists in `SYN-PUB-04475.abstract`; the complete abstract supports the effect. Its thermal cycle was −30°C to +20°C. |
   | F9: PWHT endurance estimate increases from 1.2 to 3.8 million cycles | Exact in `SYN-PUB-04473.abstract`; correctly labelled **predicted**. The specimens were S460M T-joints, so this is not demonstrated performance for AutomVoj’s frames. |

   **Unsupported specificity:** “the site weld-toe failure mode” goes beyond `C003-CH1`, which identifies cracking at weld joints but does not establish the crack origin. The proposed fillet-weld geometry likewise needs confirmation from the actual components.

3. **Hard constraints:** The correct service temperature, component material and need for an actionable manufacturing change are retained. However, the experiment does not explicitly preserve the **painted condition**, which matters to its condensation hypothesis. More seriously, the “30% shorter life **or** site-like cracking” gate permits progress without reproducing the actual failure, despite the company explicitly wanting to understand its cause.

4. **Invented resources/results:** No fabricated achieved results or agreed budget. The 30%, 2× and six-month figures are clearly proposals. Controlled condensation, specimen fabrication, site access and welding records are needed inputs, not established available resources. The assumed weld-toe origin is the principal unsupported factual detail.

5. **Willingness/availability:** Honest. `R0365.open_to` supports this collaboration type, and shared equipment scheduling and unknown availability are explicitly acknowledged.

6. **Most important fix:** Make identification and reproduction of the actual failure mechanism a prerequisite for variant testing; remove the assumption that the site cracks originate at weld toes.

| Proposal | Verdict | Most important fix |
|---|---|---|
| C001-CH1 | Accept with fixes | Establish a workable normal-only training procedure. |
| C009-CH1 | Accept with fixes | Explicitly test within-word script mixing. |
| C003-CH1 | Accept with fixes | Require reproduction of the diagnosed site failure before testing fixes. |