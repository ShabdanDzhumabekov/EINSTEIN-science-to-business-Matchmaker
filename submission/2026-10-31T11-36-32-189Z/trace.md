# Run trace

This report is generated from the adjacent JSONL logs. Artifact links identify immutable versions.

| Seq | Time (UTC) | Event | Subject / detail |
|---:|---|---|---|
| 0 | 2026-10-31T11:36:32.213Z | artifact.saved | business-C008-CH3@1 |
| 1 | 2026-10-31T11:36:32.217Z | artifact.saved | business-C013-CH2@1 |
| 2 | 2026-10-31T11:36:32.219Z | artifact.saved | business-C017-CH1@1 |
| 3 | 2026-10-31T11:36:32.231Z | artifact.saved | screening-C008-CH3@1 |
| 4 | 2026-10-31T11:36:32.231Z | task.screened_out | {"taskId":"C008-CH3","researchFit":0.05} |
| 5 | 2026-10-31T11:36:32.233Z | artifact.saved | screening-C013-CH2@1 |
| 6 | 2026-10-31T11:36:32.235Z | artifact.saved | scholar-C013-CH2-R0700@1 |
| 7 | 2026-10-31T11:36:32.240Z | artifact.saved | screening-C017-CH1@1 |
| 8 | 2026-10-31T11:36:32.241Z | artifact.saved | scholar-C017-CH1-R0746@1 |
| 9 | 2026-10-31T11:36:32.242Z | artifact.saved | business-C026-CH3@1 |
| 10 | 2026-10-31T11:36:32.246Z | artifact.saved | screening-C026-CH3@1 |
| 11 | 2026-10-31T11:36:32.246Z | artifact.saved | scholar-C026-CH3-R0212@1 |
| 12 | 2026-10-31T11:37:01.761Z | artifact.saved | pair-C013-CH2-R0700@1 |
| 13 | 2026-10-31T11:37:02.090Z | artifact.saved | check-pair-C013-CH2-R0700@1 |
| 14 | 2026-10-31T11:37:02.090Z | check.failed | check-pair-C013-CH2-R0700@1 |
| 15 | 2026-10-31T11:37:02.090Z | pair.dropped | {"taskId":"C013-CH2","researcherId":"R0700","stage":"check_failed"} |
| 16 | 2026-10-31T11:37:02.093Z | artifact.saved | scholar-C013-CH2-R0364@1 |
| 17 | 2026-10-31T11:37:02.353Z | artifact.saved | pair-C026-CH3-R0212@1 |
| 18 | 2026-10-31T11:37:02.667Z | artifact.saved | check-pair-C026-CH3-R0212@1 |
| 19 | 2026-10-31T11:37:02.672Z | artifact.saved | pair-C017-CH1-R0746@1 |
| 20 | 2026-10-31T11:37:02.906Z | artifact.saved | check-pair-C017-CH1-R0746@1 |
| 21 | 2026-10-31T11:37:29.945Z | artifact.saved | pair-C013-CH2-R0364@1 |
| 22 | 2026-10-31T11:37:30.186Z | artifact.saved | check-pair-C013-CH2-R0364@1 |
| 23 | 2026-10-31T11:37:30.186Z | check.failed | check-pair-C013-CH2-R0364@1 |
| 24 | 2026-10-31T11:37:30.186Z | pair.dropped | {"taskId":"C013-CH2","researcherId":"R0364","stage":"check_failed"} |
| 25 | 2026-10-31T11:37:30.194Z | artifact.saved | scholar-C013-CH2-R0727@1 |
| 26 | 2026-10-31T11:37:31.769Z | artifact.saved | proposal-C026-CH3-R0212@1 |
| 27 | 2026-10-31T11:37:35.301Z | artifact.saved | proposal-C017-CH1-R0746@1 |
| 28 | 2026-10-31T11:37:36.882Z | artifact.saved | proposal-review-C026-CH3-R0212@1 |
| 29 | 2026-10-31T11:37:36.883Z | critic.revise | proposal-C026-CH3-R0212@1 |
| 30 | 2026-10-31T11:37:40.107Z | artifact.saved | proposal-review-C017-CH1-R0746@1 |
| 31 | 2026-10-31T11:37:40.107Z | proposal.ready | proposal-C017-CH1-R0746@1 |
| 32 | 2026-10-31T11:37:40.109Z | artifact.saved | business-C053-CH1@1 |
| 33 | 2026-10-31T11:37:40.124Z | artifact.saved | screening-C053-CH1@1 |
| 34 | 2026-10-31T11:37:40.125Z | artifact.saved | scholar-C053-CH1-R0353@1 |
| 35 | 2026-10-31T11:38:00.477Z | artifact.saved | pair-C013-CH2-R0727@1 |
| 36 | 2026-10-31T11:38:00.838Z | artifact.saved | check-pair-C013-CH2-R0727@1 |
| 37 | 2026-10-31T11:38:00.838Z | check.failed | check-pair-C013-CH2-R0727@1 |
| 38 | 2026-10-31T11:38:00.839Z | pair.dropped | {"taskId":"C013-CH2","researcherId":"R0727","stage":"check_failed"} |
| 39 | 2026-10-31T11:38:00.842Z | artifact.saved | scholar-C013-CH2-R0971@1 |
| 40 | 2026-10-31T11:38:07.169Z | artifact.saved | proposal-C026-CH3-R0212@2 |
| 41 | 2026-10-31T11:38:10.959Z | artifact.saved | pair-C053-CH1-R0353@1 |
| 42 | 2026-10-31T11:38:11.174Z | artifact.saved | check-pair-C053-CH1-R0353@1 |
| 43 | 2026-10-31T11:38:11.777Z | artifact.saved | proposal-review-C026-CH3-R0212@2 |
| 44 | 2026-10-31T11:38:11.777Z | critic.revise | proposal-C026-CH3-R0212@2 |
| 45 | 2026-10-31T11:38:32.102Z | artifact.saved | pair-C013-CH2-R0971@1 |
| 46 | 2026-10-31T11:38:32.347Z | artifact.saved | check-pair-C013-CH2-R0971@1 |
| 47 | 2026-10-31T11:38:32.347Z | check.failed | check-pair-C013-CH2-R0971@1 |
| 48 | 2026-10-31T11:38:32.347Z | pair.dropped | {"taskId":"C013-CH2","researcherId":"R0971","stage":"check_failed"} |
| 49 | 2026-10-31T11:38:32.348Z | artifact.saved | scholar-C013-CH2-R0493@1 |
| 50 | 2026-10-31T11:38:40.667Z | artifact.saved | proposal-C026-CH3-R0212@3 |
| 51 | 2026-10-31T11:38:42.703Z | artifact.saved | proposal-C053-CH1-R0353@1 |
| 52 | 2026-10-31T11:38:44.553Z | artifact.saved | proposal-review-C026-CH3-R0212@3 |
| 53 | 2026-10-31T11:38:44.554Z | proposal.ready | proposal-C026-CH3-R0212@3 |
| 54 | 2026-10-31T11:38:44.556Z | artifact.saved | business-C060-CH2@1 |
| 55 | 2026-10-31T11:38:44.576Z | artifact.saved | screening-C060-CH2@1 |
| 56 | 2026-10-31T11:38:44.578Z | artifact.saved | scholar-C060-CH2-R0146@1 |
| 57 | 2026-10-31T11:38:46.605Z | artifact.saved | proposal-review-C053-CH1-R0353@1 |
| 58 | 2026-10-31T11:38:46.605Z | critic.revise | proposal-C053-CH1-R0353@1 |
| 59 | 2026-10-31T11:39:02.337Z | artifact.saved | pair-C013-CH2-R0493@1 |
| 60 | 2026-10-31T11:39:02.666Z | artifact.saved | check-pair-C013-CH2-R0493@1 |
| 61 | 2026-10-31T11:39:02.666Z | check.failed | check-pair-C013-CH2-R0493@1 |
| 62 | 2026-10-31T11:39:02.667Z | pair.dropped | {"taskId":"C013-CH2","researcherId":"R0493","stage":"check_failed"} |
| 63 | 2026-10-31T11:39:02.668Z | artifact.saved | scholar-C013-CH2-R0087@1 |
| 64 | 2026-10-31T11:39:13.461Z | artifact.saved | proposal-C053-CH1-R0353@2 |
| 65 | 2026-10-31T11:39:14.756Z | artifact.saved | pair-C060-CH2-R0146@1 |
| 66 | 2026-10-31T11:39:15.010Z | artifact.saved | check-pair-C060-CH2-R0146@1 |
| 67 | 2026-10-31T11:39:17.937Z | artifact.saved | proposal-review-C053-CH1-R0353@2 |
| 68 | 2026-10-31T11:39:17.937Z | proposal.ready | proposal-C053-CH1-R0353@2 |
| 69 | 2026-10-31T11:39:17.938Z | artifact.saved | business-C065-CH2@1 |
| 70 | 2026-10-31T11:39:17.945Z | artifact.saved | screening-C065-CH2@1 |
| 71 | 2026-10-31T11:39:17.949Z | artifact.saved | scholar-C065-CH2-R0816@1 |
| 72 | 2026-10-31T11:39:28.986Z | artifact.saved | pair-C013-CH2-R0087@1 |
| 73 | 2026-10-31T11:39:29.401Z | artifact.saved | check-pair-C013-CH2-R0087@1 |
| 74 | 2026-10-31T11:39:29.401Z | check.failed | check-pair-C013-CH2-R0087@1 |
| 75 | 2026-10-31T11:39:29.402Z | pair.dropped | {"taskId":"C013-CH2","researcherId":"R0087","stage":"check_failed"} |
| 76 | 2026-10-31T11:39:29.403Z | artifact.saved | scholar-C013-CH2-R0261@1 |
| 77 | 2026-10-31T11:39:44.804Z | artifact.saved | proposal-C060-CH2-R0146@1 |
| 78 | 2026-10-31T11:39:47.424Z | artifact.saved | pair-C065-CH2-R0816@1 |
| 79 | 2026-10-31T11:39:47.660Z | artifact.saved | check-pair-C065-CH2-R0816@1 |
| 80 | 2026-10-31T11:39:49.397Z | artifact.saved | proposal-review-C060-CH2-R0146@1 |
| 81 | 2026-10-31T11:39:49.397Z | proposal.ready | proposal-C060-CH2-R0146@1 |
| 82 | 2026-10-31T11:39:49.398Z | artifact.saved | business-C086-CH1@1 |
| 83 | 2026-10-31T11:39:49.406Z | artifact.saved | screening-C086-CH1@1 |
| 84 | 2026-10-31T11:39:49.407Z | artifact.saved | scholar-C086-CH1-R0503@1 |
| 85 | 2026-10-31T11:39:59.803Z | artifact.saved | pair-C013-CH2-R0261@1 |
| 86 | 2026-10-31T11:40:00.026Z | artifact.saved | check-pair-C013-CH2-R0261@1 |
| 87 | 2026-10-31T11:40:00.027Z | check.failed | check-pair-C013-CH2-R0261@1 |
| 88 | 2026-10-31T11:40:00.027Z | pair.dropped | {"taskId":"C013-CH2","researcherId":"R0261","stage":"check_failed"} |
| 89 | 2026-10-31T11:40:00.029Z | artifact.saved | scholar-C013-CH2-R0068@1 |
| 90 | 2026-10-31T11:40:15.742Z | artifact.saved | proposal-C065-CH2-R0816@1 |
| 91 | 2026-10-31T11:40:19.403Z | artifact.saved | proposal-review-C065-CH2-R0816@1 |
| 92 | 2026-10-31T11:40:19.403Z | critic.revise | proposal-C065-CH2-R0816@1 |
| 93 | 2026-10-31T11:40:20.732Z | artifact.saved | pair-C086-CH1-R0503@1 |
| 94 | 2026-10-31T11:40:20.971Z | artifact.saved | check-pair-C086-CH1-R0503@1 |
| 95 | 2026-10-31T11:40:33.904Z | artifact.saved | pair-C013-CH2-R0068@1 |
| 96 | 2026-10-31T11:40:34.114Z | artifact.saved | check-pair-C013-CH2-R0068@1 |
| 97 | 2026-10-31T11:40:34.114Z | check.failed | check-pair-C013-CH2-R0068@1 |
| 98 | 2026-10-31T11:40:34.114Z | pair.dropped | {"taskId":"C013-CH2","researcherId":"R0068","stage":"check_failed"} |
| 99 | 2026-10-31T11:40:34.116Z | artifact.saved | business-C105-CH2@1 |
| 100 | 2026-10-31T11:40:34.132Z | artifact.saved | screening-C105-CH2@1 |
| 101 | 2026-10-31T11:40:34.134Z | artifact.saved | scholar-C105-CH2-R0123@1 |
| 102 | 2026-10-31T11:40:45.619Z | artifact.saved | proposal-C086-CH1-R0503@1 |
| 103 | 2026-10-31T11:40:46.390Z | artifact.saved | proposal-C065-CH2-R0816@2 |
| 104 | 2026-10-31T11:40:49.465Z | artifact.saved | proposal-review-C086-CH1-R0503@1 |
| 105 | 2026-10-31T11:40:49.465Z | critic.revise | proposal-C086-CH1-R0503@1 |
| 106 | 2026-10-31T11:40:51.920Z | artifact.saved | proposal-review-C065-CH2-R0816@2 |
| 107 | 2026-10-31T11:40:51.920Z | critic.revise | proposal-C065-CH2-R0816@2 |
| 108 | 2026-10-31T11:41:02.787Z | artifact.saved | pair-C105-CH2-R0123@1 |
| 109 | 2026-10-31T11:41:03.097Z | artifact.saved | check-pair-C105-CH2-R0123@1 |
| 110 | 2026-10-31T11:41:03.097Z | check.failed | check-pair-C105-CH2-R0123@1 |
| 111 | 2026-10-31T11:41:03.097Z | pair.dropped | {"taskId":"C105-CH2","researcherId":"R0123","stage":"check_failed"} |
| 112 | 2026-10-31T11:41:03.099Z | artifact.saved | scholar-C105-CH2-R0099@1 |
| 113 | 2026-10-31T11:41:17.291Z | artifact.saved | proposal-C065-CH2-R0816@3 |
| 114 | 2026-10-31T11:41:19.493Z | artifact.saved | proposal-C086-CH1-R0503@2 |
| 115 | 2026-10-31T11:41:23.746Z | artifact.saved | proposal-review-C086-CH1-R0503@2 |
| 116 | 2026-10-31T11:41:23.746Z | proposal.ready | proposal-C086-CH1-R0503@2 |
| 117 | 2026-10-31T11:41:23.748Z | artifact.saved | business-C132-CH4@1 |
| 118 | 2026-10-31T11:41:23.762Z | artifact.saved | screening-C132-CH4@1 |
| 119 | 2026-10-31T11:41:23.764Z | artifact.saved | scholar-C132-CH4-R0349@1 |
| 120 | 2026-10-31T11:41:24.936Z | artifact.saved | proposal-review-C065-CH2-R0816@3 |
| 121 | 2026-10-31T11:41:24.937Z | critic.revise | proposal-C065-CH2-R0816@3 |
| 122 | 2026-10-31T11:41:24.937Z | pair.dropped | {"taskId":"C065-CH2","researcherId":"R0816","stage":"proposal_needs_revision"} |
| 123 | 2026-10-31T11:41:24.939Z | artifact.saved | scholar-C065-CH2-R0039@1 |
| 124 | 2026-10-31T11:41:34.772Z | artifact.saved | pair-C105-CH2-R0099@1 |
| 125 | 2026-10-31T11:41:35.002Z | artifact.saved | check-pair-C105-CH2-R0099@1 |
| 126 | 2026-10-31T11:41:35.002Z | check.failed | check-pair-C105-CH2-R0099@1 |
| 127 | 2026-10-31T11:41:35.003Z | pair.dropped | {"taskId":"C105-CH2","researcherId":"R0099","stage":"check_failed"} |
| 128 | 2026-10-31T11:41:35.007Z | artifact.saved | scholar-C105-CH2-R0785@1 |
| 129 | 2026-10-31T11:41:51.992Z | artifact.saved | pair-C132-CH4-R0349@1 |
| 130 | 2026-10-31T11:41:52.260Z | artifact.saved | check-pair-C132-CH4-R0349@1 |
| 131 | 2026-10-31T11:41:57.443Z | artifact.saved | pair-C065-CH2-R0039@1 |
| 132 | 2026-10-31T11:41:57.661Z | artifact.saved | check-pair-C065-CH2-R0039@1 |
| 133 | 2026-10-31T11:41:57.662Z | check.failed | check-pair-C065-CH2-R0039@1 |
| 134 | 2026-10-31T11:41:57.662Z | pair.dropped | {"taskId":"C065-CH2","researcherId":"R0039","stage":"check_failed"} |
| 135 | 2026-10-31T11:41:57.665Z | artifact.saved | scholar-C065-CH2-R0709@1 |
| 136 | 2026-10-31T11:42:05.829Z | artifact.saved | pair-C105-CH2-R0785@1 |
| 137 | 2026-10-31T11:42:06.062Z | artifact.saved | check-pair-C105-CH2-R0785@1 |
| 138 | 2026-10-31T11:42:06.063Z | check.failed | check-pair-C105-CH2-R0785@1 |
| 139 | 2026-10-31T11:42:06.063Z | pair.dropped | {"taskId":"C105-CH2","researcherId":"R0785","stage":"check_failed"} |
| 140 | 2026-10-31T11:42:20.792Z | artifact.saved | proposal-C132-CH4-R0349@1 |
| 141 | 2026-10-31T11:42:24.701Z | artifact.saved | proposal-review-C132-CH4-R0349@1 |
| 142 | 2026-10-31T11:42:24.702Z | critic.revise | proposal-C132-CH4-R0349@1 |
| 143 | 2026-10-31T11:42:31.051Z | artifact.saved | pair-C065-CH2-R0709@1 |
| 144 | 2026-10-31T11:42:31.313Z | artifact.saved | check-pair-C065-CH2-R0709@1 |
| 145 | 2026-10-31T11:42:31.313Z | check.failed | check-pair-C065-CH2-R0709@1 |
| 146 | 2026-10-31T11:42:31.313Z | pair.dropped | {"taskId":"C065-CH2","researcherId":"R0709","stage":"check_failed"} |
| 147 | 2026-10-31T11:42:31.315Z | artifact.saved | scholar-C065-CH2-R0228@1 |
| 148 | 2026-10-31T11:42:49.989Z | artifact.saved | proposal-C132-CH4-R0349@2 |
| 149 | 2026-10-31T11:42:53.806Z | artifact.saved | proposal-review-C132-CH4-R0349@2 |
| 150 | 2026-10-31T11:42:53.806Z | proposal.ready | proposal-C132-CH4-R0349@2 |
| 151 | 2026-10-31T11:42:56.868Z | artifact.saved | pair-C065-CH2-R0228@1 |
| 152 | 2026-10-31T11:42:57.098Z | artifact.saved | check-pair-C065-CH2-R0228@1 |
| 153 | 2026-10-31T11:42:57.098Z | check.failed | check-pair-C065-CH2-R0228@1 |
| 154 | 2026-10-31T11:42:57.098Z | pair.dropped | {"taskId":"C065-CH2","researcherId":"R0228","stage":"check_failed"} |
| 155 | 2026-10-31T11:42:57.101Z | artifact.saved | scholar-C065-CH2-R0931@1 |
| 156 | 2026-10-31T11:43:26.658Z | artifact.saved | pair-C065-CH2-R0931@1 |
| 157 | 2026-10-31T11:43:26.899Z | artifact.saved | check-pair-C065-CH2-R0931@1 |
| 158 | 2026-10-31T11:43:26.899Z | check.failed | check-pair-C065-CH2-R0931@1 |
| 159 | 2026-10-31T11:43:26.899Z | pair.dropped | {"taskId":"C065-CH2","researcherId":"R0931","stage":"check_failed"} |
| 160 | 2026-10-31T11:43:26.899Z | artifact.saved | scholar-C065-CH2-R0294@1 |
| 161 | 2026-10-31T11:43:51.294Z | validation.revise | matchmaker: source C065-CH2.text.text belongs to neither C065-CH2 nor R0294 |
| 162 | 2026-10-31T11:44:05.887Z | artifact.saved | pair-C065-CH2-R0294@1 |
| 163 | 2026-10-31T11:44:06.111Z | artifact.saved | check-pair-C065-CH2-R0294@1 |
| 164 | 2026-10-31T11:44:06.112Z | check.failed | check-pair-C065-CH2-R0294@1 |
| 165 | 2026-10-31T11:44:06.112Z | pair.dropped | {"taskId":"C065-CH2","researcherId":"R0294","stage":"check_failed"} |
| 166 | 2026-10-31T11:44:06.114Z | artifact.saved | scholar-C065-CH2-R0195@1 |
| 167 | 2026-10-31T11:44:33.184Z | artifact.saved | pair-C065-CH2-R0195@1 |
| 168 | 2026-10-31T11:44:33.405Z | artifact.saved | check-pair-C065-CH2-R0195@1 |
| 169 | 2026-10-31T11:44:33.405Z | check.failed | check-pair-C065-CH2-R0195@1 |
| 170 | 2026-10-31T11:44:33.406Z | pair.dropped | {"taskId":"C065-CH2","researcherId":"R0195","stage":"check_failed"} |
| 171 | 2026-10-31T11:44:33.408Z | artifact.saved | scholar-C065-CH2-R0925@1 |
| 172 | 2026-10-31T11:44:57.377Z | artifact.saved | pair-C065-CH2-R0925@1 |
| 173 | 2026-10-31T11:44:57.627Z | artifact.saved | check-pair-C065-CH2-R0925@1 |
| 174 | 2026-10-31T11:44:57.628Z | check.failed | check-pair-C065-CH2-R0925@1 |
| 175 | 2026-10-31T11:44:57.628Z | pair.dropped | {"taskId":"C065-CH2","researcherId":"R0925","stage":"check_failed"} |

## Critic interventions

### Event 29: proposal-C026-CH3-R0212@1

[Before](artifacts/proposal-C026-CH3-R0212.v1.json) · [Next version](artifacts/proposal-C026-CH3-R0212.v2.json)

- **unsupported_claim → proposal_writer:** Jev rates the support of this claim by its quoted evidence at 0.42; restate it to match the quote or remove it.

### Event 44: proposal-C026-CH3-R0212@2

[Before](artifacts/proposal-C026-CH3-R0212.v2.json) · [Next version](artifacts/proposal-C026-CH3-R0212.v3.json)

- **unsupported_claim → proposal_writer:** Jev rates the support of this claim by its quoted evidence at 0.49; restate it to match the quote or remove it.

### Event 58: proposal-C053-CH1-R0353@1

[Before](artifacts/proposal-C053-CH1-R0353.v1.json) · [Next version](artifacts/proposal-C053-CH1-R0353.v2.json)

- **unsupported_claim → proposal_writer:** Jev rates the support of this claim by its quoted evidence at 0.37; restate it to match the quote or remove it.
- **unsupported_claim → proposal_writer:** Jev rates the support of this claim by its quoted evidence at 0.42; restate it to match the quote or remove it.

### Event 92: proposal-C065-CH2-R0816@1

[Before](artifacts/proposal-C065-CH2-R0816.v1.json) · [Next version](artifacts/proposal-C065-CH2-R0816.v2.json)

- **unsupported_claim → proposal_writer:** Jev rates the support of this claim by its quoted evidence at 0.36; restate it to match the quote or remove it.
- **unsupported_claim → proposal_writer:** Jev rates the support of this claim by its quoted evidence at 0.48; restate it to match the quote or remove it.

### Event 105: proposal-C086-CH1-R0503@1

[Before](artifacts/proposal-C086-CH1-R0503.v1.json) · [Next version](artifacts/proposal-C086-CH1-R0503.v2.json)

- **unsupported_claim → proposal_writer:** Jev rates the support of this claim by its quoted evidence at 0.37; restate it to match the quote or remove it.

### Event 107: proposal-C065-CH2-R0816@2

[Before](artifacts/proposal-C065-CH2-R0816.v2.json) · [Next version](artifacts/proposal-C065-CH2-R0816.v3.json)

- **unsupported_claim → proposal_writer:** Jev rates the support of this claim by its quoted evidence at 0.26; restate it to match the quote or remove it.

### Event 121: proposal-C065-CH2-R0816@3

[Before](artifacts/proposal-C065-CH2-R0816.v3.json) · No next version was accepted in this run.

- **unsupported_claim → proposal_writer:** Jev rates the support of this claim by its quoted evidence at 0.22; restate it to match the quote or remove it.

### Event 142: proposal-C132-CH4-R0349@1

[Before](artifacts/proposal-C132-CH4-R0349.v1.json) · [Next version](artifacts/proposal-C132-CH4-R0349.v2.json)

- **unsupported_claim → proposal_writer:** Jev rates the support of this claim by its quoted evidence at 0.44; restate it to match the quote or remove it.

## Measured inference

- HTTP requests dispatched: 118
- Reported cost for known bills: $2.259773
- Requests without a known bill: 0
- Missing bills are not treated as free. Failed prior runs are not included in this run total.
