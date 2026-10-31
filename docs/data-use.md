# Responsible use of data

## What data we use

Only the synthetic hackathon dataset: [jigjoy-ai/einstein-matchmaker-data](https://github.com/jigjoy-ai/einstein-matchmaker-data), commit `4fb99b3749adf0d10b5977089ff4c73f4f522240` ("Dataset v2"). Every person, company, publication, project and patent in it is invented. The dataset is not committed to this repository; it is fetched into `data/` (git-ignored) and pinned by the version string `einstein-matchmaker-data@4fb99b3`, which every citation carries.

The six source files are also pinned by SHA-256 in [dataset-manifest.json](dataset-manifest.json). The run command checks those hashes before sending material to a model. A changed dataset needs an explicit manifest/version update.

We call no live external data source (ORCID, OpenAlex, CORDIS, patents). If one is added later, the same rule applies: a fact is stored next to its source.

Measured on the pinned loaded dataset (`dataQualityReport`, `src/data/data-quality-report.ts`), independently rechecked during the merge. After fetching data, reproduce with:

```sh
node --import tsx --input-type=module -e '
import {loadDataset} from "./src/data/load-dataset.ts";
import {researcherQualityFlags} from "./src/data/researcher-quality-flags.ts";
import {dataQualityReport} from "./src/data/data-quality-report.ts";
const dataset=loadDataset(process.env.DATASET_DIR ?? "data/data");
console.log(JSON.stringify(dataQualityReport(dataset,researcherQualityFlags(dataset)),null,2));'
```

The report measures:

| | |
|---|---|
| Researchers / publications / projects / patents | 1,047 / 10,779 / 1,823 / 111 |
| Companies / challenges / company pages | 153 / 489 / 917 |
| Publications without an abstract | 640 |
| Researcher profiles without a bio | 60 |
| Profiles not in English (Serbian Latin or Cyrillic) | 82 |
| Profiles with stale-profile hints (emeritus, retired, left) | 21 |
| Profiles sharing a name with another profile | 10 |
| Profiles listing a work that does not name them as author | 4 |
| Distinct faculty spellings | 37 |

## Which fields are read, and why

Cards are built by code, not by a model (`src/cards/`). Each card field keeps its record id and field name so that any quote from it can be checked.

| Record | Fields used | Where |
|---|---|---|
| Challenge | `text`, `detail` | Business card; Jev screening (stage 2); Matchmaker, Writer, Critic |
| Company | `about`, `products`, `tech`, `plans`, `rd_capacity`, `past_collaborations`; `name`, `sector`, `location` as context | Business card; `about` also goes to Jev in stage 2 |
| Researcher profile | `fields`, `keywords`, `open_to`, `bio`, `industry_experience`, `notes` | Scholar card. Jev in stage 2 sees only `fields`, `keywords` and up to 8 work titles |
| Publication, project, patent | `title`, `abstract` / `summary`, author / participant / inventor lists | Scholar card `works`, only when authorship is confirmed both ways |

Not used: company `employees` and `founded`, company pages, publication `year`, `venue` and `keywords`, project programme names, author affiliations, researcher `title`. In particular a title such as "Professor Emeritus" is never used to decide availability. No field is used to judge a person.

## Proposing collaborations, not ranking people

- The system answers "who could work on this company's problem, and how", one challenge at a time. It never publishes a list of researchers ordered by worth.
- Jev's probability in stage 2 is the chance that one researcher's methods address one challenge. It only decides which pairs the Matchmaker reads; pairs below 0.5 are kept in the screening file for transparency, not shown as a judgement of anyone.
- Willingness (industrial PhD supervision, joint project) and availability come only from the researcher's own words, each with a quote:
  - `open` from an `open_to` item, read in English and Serbian (Latin and Cyrillic), e.g. "менторство индустријских докторских студената";
  - `declined` from an explicit refusal in `notes`, e.g. "is not available to supervise PhD students"; a refusal outweighs a generic `open_to` item;
  - `unavailable` only from an explicit refusal not tied to one role, e.g. "retired; not available for project leadership"; `limited` only when the researcher states a limit, e.g. "not available for projects requiring more than 20% travel" or, for a retired researcher, "available for consulting engagements on a limited basis"; retiring or leaving the university on its own changes nothing;
  - anything not stated stays `unknown`, never assumed yes or no. What this yields for every profile with a retirement or departure hint, with the quoted sentences: [availability-review.md](availability-review.md).
- A refusal is respected: the Writer does not write a declined format, the Critic blocks a proposal that assigns a declined role, and a proposal with unknown or limited availability or willingness is marked conditional.
- Some challenges are not research problems (hiring, fundraising, sales coaching). Jev answers "is this a research problem" for every challenge; below 0.5 the challenge is screened out instead of being forced into a pair.

## Accuracy safeguards

- **Quotes are checked by code** against the original record field (`verifyQuote`): exact match, or a match after Unicode, whitespace, quote-mark and case normalisation only. Search-time folding (Cyrillic to Latin, removed diacritics) is never used for quotes.
- **Authorship is checked both ways** (`verifyAuthorship`): a work counts as evidence only if the profile lists it and the work names the researcher. Other works never enter a scholar card.
- **A cited source must belong to one of the two sides of the pair** (`pairSourceViolations`), so a researcher is never credited with another person's work.
- **Namesakes are never merged.** Profiles sharing a name across spelling or script are flagged `duplicate_name` and stay separate.
- **A title is not evidence of a skill.** A competence claim supported only by publication titles is blocked.
- **Two Jev gates.** Stage 2 keeps pairs at or above 0.5; stage 4 re-checks the Matchmaker's chosen pair, with its stated risks, at 0.9. Both gates and every probability are recorded.
- **The Critic reads the company's own words**, not only the other agents' summaries, checks each fact's quote by code and its meaning with Jev and a model, and returns issues to the Writer at most twice. A failed or incomplete check never becomes PASS.
- Approvals refer to exact artifact versions; changed inputs invalidate dependent approvals.

## Where data goes

- At application runtime, the required excerpts of the synthetic dataset are sent to the chosen model providers through OpenRouter. The selected models are recorded per call. Automatic Mozaik Cloud export is explicitly disabled with `MOZAIK_API_KEY=""`; local artifacts and traces are retained in the ignored run directory.
- Run outputs (cards, screening files, pair assessments, proposals, trace) contain short verbatim quotes from the dataset so that every claim can be checked.
- Jev receives the challenge, the company's `about` text and compact researcher cards through the OpenRouter Decisions API; it returns probabilities, not text.
- API keys live only in `.env`, which is git-ignored, and are never written to logs or traces.

A ready status means automated checks completed on recorded versions. It does not establish consent, guarantee experimental results or replace review by the company, researcher and network coordinator. No outreach or enrollment is performed. Synthetic names must not be resolved to real people. A real deployment needs an explicit retention/access policy before importing personal records.

## Limits we know about

- Stage 2 shows Jev fields, keywords and up to 8 work titles per researcher. A researcher whose relevant work is not among those can be missed; the screening file keeps every probability so such misses can be audited.
- Willingness and availability rules are phrase patterns tested on real profile wording; a phrasing they do not cover stays `unknown`, not `open`.
- The Critic's semantic judgement is a model judgement. Code checks are deterministic; meaning checks are not, which is why a person from the team reads every final proposal before it is submitted.
- The data is synthetic. Results show how the system behaves, not facts about real people or companies.

- The build uses `openai/gpt-6.1-sol` (earlier bundles: `deepseek/deepseek-v4.1-flash-1017`) with medium reasoning effort for Matchmaker, Writer and Critic, and `typesafe/jev-1.14` for both screening gates and the Critic's fact check. Budget reservations are estimates; unknown bills remain reserved and cancellation does not guarantee that the provider stops charging.
