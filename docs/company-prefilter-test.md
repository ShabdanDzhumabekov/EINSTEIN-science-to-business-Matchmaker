# Test of a company-level pre-filter before the challenge screening

Question tested on 31.10.2026: could a cheaper Jev pass on researcher × company stand in front of the researcher × challenge screening without losing the pairs that screening keeps?

## Method

- Test set: the 15 challenges with a cached challenge-level screening (`runs/screening/`), 166 kept pairs (Jev ≥ 0.5) across 15 companies; among them the three main pairs and the Stars find C132-CH4 / R0349.
- Pre-filter: one Jev question per researcher and company, "Could the methods of researcher X matter to anything this company does or plans, judging from its products, technology and plans only?", with the company's `name`, `sector`, `about`, `products`, `tech`, `plans` and the same compact researcher cards the screening uses (fields, keywords, up to 8 work titles). No challenge text. 15 companies × 1,047 researchers in batches of 150: 105 requests, $0.28, about two minutes.
- Measure: at each threshold, how many of the 166 kept pairs the pre-filter would have removed, and what share of researchers it removes per company.
- Raw answers and the request journal: [`submission/company-prefilter-2026-10-31/`](../submission/company-prefilter-2026-10-31/).

## Result

| Pre-filter threshold | Kept pairs lost (of 166) | Challenges with a loss | Researchers removed per company (mean) |
|---:|---:|---:|---:|
| 0.1 | 0 | 0 of 15 | 1% |
| 0.2 | 0 | 0 of 15 | 15% |
| 0.3 | 0 | 0 of 15 | 32% |
| 0.4 | 0 | 0 of 15 | 46% |
| 0.5 | 3 | 3 of 15 | 60% |

The three pairs lost at 0.5 sit at the edge of both filters: C008-CH3 / R0552 (challenge 0.56, company 0.46), C013-CH2 / R0493 (0.68, 0.47), C060-CH2 / R0929 (0.51, 0.49). The feared case did not occur: the welding researcher R0365 scores 0.84 against AutomVoj's robotics profile, and the top eight of every main challenge survive at 0.4. The company and challenge scores are strongly correlated for the researchers at the top of each list.

## What it would save

The pre-filter itself costs one pass per company, 153 × 7 batches ≈ $2.9 for this dataset. At 0.4 it removes 46% of the researchers before the challenge screening, which costs about $10 in full, so it saves about $4.6 and the net gain today is about $1.7: not worth a new stage at this size. The saving grows with the number of challenges per company and with repeated re-screening, since the company pass is made once and the challenge passes many times; at ten challenges per company the pre-filter pays for itself several times over.

## Live run

`submission/2026-10-31T16-18-25-488Z` ran the three main challenges with `PREFILTER_THRESHOLD=0.4`: 3 × `ready`, 47–76% of researchers removed per company, none of the pairs kept by the cold run without the pre-filter removed. See `submission/README.md`.

## Decision

Implemented as an optional stage (`PREFILTER_THRESHOLD`, commit `69bd82c`) and off by default. Measured and ready: on this test set a threshold of 0.4 or below loses no kept pair; a larger network would switch it on at 0.3 after repeating this measurement on its own cached screenings. The test set is 15 challenges, so a lost pair rate below 1 in 166 cannot be excluded.
