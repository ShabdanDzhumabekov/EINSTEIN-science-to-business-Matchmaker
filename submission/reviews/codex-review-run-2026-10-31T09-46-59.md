I checked all 21 numbered facts: **all 34 ledger quotations occur verbatim in their cited dataset fields**. Quote accuracy is strong; the qualifications below concern what those quotes establish and whether the proposed evaluations answer the companies’ needs.

For **[C001-CH1](../2026-10-31T09-46-59-649Z/proposals/C001-CH1.md), ArmaturaSec and Branislava Ostojić (R0773)**:

1. **Would they meet? Yes.** ArmaturaSec has a concrete alert-fatigue problem and usable traffic archives, while Ostojić has relevant statistical monitoring expertise and an explicitly acknowledged protocol-transfer question.

2. **Fact checks:**

   - **F1:** `C001-CH1.text/detail` contains both “zero examples of malicious traffic” and no capture containing a “confirmed attack.” Supports the attributed company claim.
   - **F2:** `C001.rd_capacity` explicitly offers archives, hardware bench and firmware under NDA; `R0773.notes` expresses interest in time-stamped production data. Supported, without establishing that access has already been agreed.
   - **F4:** `C001-CH1.detail` requires no attack examples and plain-language explanations, and reports clients switching alerts off. Supported.
   - **F5:** Both excerpts exist, but **“Deployment must” strengthens the source**: `C001.plans` describes an intended fifth hardware variant with a dedicated processor, not a confirmed delivery requirement or completed hardware release. The researcher’s firmware restriction is accurately grounded in `R0773.notes`.
   - **F6:** `C001.rd_capacity` says “one to two engineers part-time.” Supported.

3. **Hard constraints:** The no-labelled-attacks, site-specific baseline and explainability requirements are covered. On-device operation is acknowledged but never evaluated explicitly: detection delay does not establish acceptable inference cost or packet-forwarding latency.

4. **Invention or achieved-result confusion:** No fabricated results, people or budget. PLC simulators exist in `C001.tech`; the ten-week schedule and injections are clearly proposed. Access to two sites remains conditional. The hardware-plan wording in F5 is the principal factual qualification.

5. **Willingness/availability:** Honest. `R0773.open_to` supports relevant collaboration interests, but does not establish acceptance of this project or available time. The proposal explicitly requests confirmation and respects her restriction on extensive firmware work.

6. **Most important fix:** Add a company-owned on-device feasibility check before progressing to deployment, including packet-forwarding impact, with engineering ownership consistent with Ostojić’s stated limits.

For **[C009-CH1](../2026-10-31T09-46-59-649Z/proposals/C009-CH1.md), LinguaBot and Stefan Dragić (R0349)**:

1. **Would they meet? Yes.** Dragić’s mixed-script retrieval research directly addresses LinguaBot’s measured failure mode, and the company already has labelled examples and linguists to evaluate a bounded engagement.

2. **Fact checks:**

   - **F1:** `C009-CH1.detail` contains the 18% miss rate and attribution of more than half the misses to morphology/script confusion. The same field confirms 12,000 queries from **one bank**; that context is accurate even though absent from the ledger excerpt.
   - **F2:** `C009-CH1.detail` explicitly requires automatic script-mixing tolerance and vocabulary updates “without a full re-index.” Supported.
   - **F3:** `C009-CH1.detail` states approximately €8,000 **for tooling or data work** and something testable within six months. Supported; this is not an established total collaboration budget.
   - **F4:** `C009-CH1.detail` confirms approximately 85,000 labelled pairs across clients and two linguists. Supported.
   - **F6:** `SYN-PUB-04278.abstract` explicitly proposes phonemic canonical forms for tokens. Supported; the original evaluation used news articles, and the proposal appropriately does not claim demonstrated bank-support performance.
   - **F7:** `R0349.notes` states capacity for one smaller industrial contract or consultancy engagement. Supported.

   **No material overstatement in the numbered facts.**

3. **Hard constraints:** The budget category, six-month horizon, below-5% target, maintenance requirement and vocabulary-update constraint are all represented. However, evaluation drawn from the pooled 85,000 pairs need not reproduce the original bank’s problem: an aggregate below 5% could conceal continued poor performance there. Also, “first experiment months 1–3” conflicts with implementation in months 3–4 and evaluation in months 5–6.

4. **Invention or achieved-result confusion:** No fabricated resources or achieved gains. The below-5% target comes from the company, rather than being invented. Neural fallback, maintenance ownership and schedules are proposals. No evidence establishes that researcher fees fit within the tooling/data allowance.

5. **Willingness/availability:** Honest. `R0349.open_to` includes internal-search contract research and normalization consulting; `notes` limits current capacity to a smaller engagement. The proposal correctly asks whether its six-month scope fits that capacity.

6. **Most important fix:** Require a separate evaluation on queries representative of the original bank’s 12,000-query sample, using the same definition of “no useful result,” so the below-5% decision answers the documented business problem.

For **[C003-CH1](../2026-10-31T09-46-59-649Z/proposals/C003-CH1.md), AutomVoj and Bojan Erić (R0365)**:

1. **Would they meet? Yes.** AutomVoj has costly physical failures and retained specimens, while Erić offers closely relevant fatigue expertise and laboratory equipment the company explicitly lacks.

2. **Fact checks:**

   - **F1:** `C003-CH1.text/detail` confirms cracking after roughly 18 months and operating temperatures of 2–6 °C. Supported.
   - **F3:** `C003-CH1.detail` confirms two failed sections, photographs, measurements and painted mild-steel hollow sections; `C003.tech` lists MIG/MAG fabrication. Supported as written.
   - **F4:** `R0365.bio` explicitly lists combined mechanical/thermal fatigue expertise, servo-hydraulic machines, a chamber reaching −60 °C and Abaqus models. Supported.
   - **F5:** The excerpt exists in `SYN-PUB-04475.abstract`, but its omitted lead-in is **“examined whether.”** The complete abstract subsequently reports 28% fewer initiation cycles under out-of-phase loading, so the claim is supported by the full record; the selected quote alone is weak evidence of a result.
   - **F6:** `SYN-PUB-04478.abstract` confirms +287 MPa initially and +61 MPa surface residual stress after 1,000 cycles at 180 MPa. Supported, with the surface qualification correctly retained.
   - **F7:** `R0365.notes` confirms shared equipment and advance scheduling; `C003.rd_capacity` confirms no dedicated R&D department. Supported.

3. **Hard constraints:** The service temperature, material and need for cyclic testing are retained; the challenge gives no firm budget or deadline to contradict. However, its suspected **thermal cycling** becomes a cold-temperature range without a defined cycling history. The baseline, three single-factor conditions and all-three condition also cannot distinguish the separate pairwise interactions, despite being called a factorial campaign.

4. **Invention or achieved-result confusion:** The proposal treats **T-joint geometry and weld-toe crack location as established**, whereas `C003-CH1.detail` establishes only cracking at crossmember-to-stringer weld connections. Those details need confirmation from the retained sections and drawings. Equipment is real, but bookings, specimens and the company lead remain proposed contributions. The 12-plus-six-month schedule is clearly proposed, and no experiment is presented as completed.

5. **Willingness/availability:** Honest. `R0365.open_to` explicitly includes joint projects under low-temperature or combined loading and equipment access. The proposal correctly makes extended access and availability conditional.

6. **Most important fix:** Revise the experiment to distinguish the suspected interacting causes, including representative thermal cycling and pairwise conditions, before claiming it can identify which factor drives the service failure.

| Proposal | Verdict | Most important fix |
|---|---|---|
| C001-CH1 | Accept with fixes | Add company-owned on-device feasibility and forwarding-latency evaluation. |
| C009-CH1 | Accept with fixes | Test the below-5% target separately on the original bank’s query population. |
| C003-CH1 | Accept with fixes | Use an experiment that distinguishes thermal, wetness and vibration interactions. |