# Mapping Voices

[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Data: CC BY 4.0](https://img.shields.io/badge/data-CC%20BY%204.0-lightgrey.svg)](LICENSE)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Live:** [adamu.tech/mapping](https://adamu.tech/mapping/) ·
[adab-tech.github.io/mapping](https://adab-tech.github.io/mapping/) (GitHub Pages, canonical)

Mapping Voices is an open digital-humanities research infrastructure for
discovering oral-history and voice-testimony collections through geography,
language, theme, and period. It pairs an interactive, searchable atlas with
an openly licensed, documented dataset: every collection has a persistent
identifier, controlled geographic, linguistic, and thematic metadata, a
verification status, and a link straight through to the real institution
that holds it.

**The map is the interface; the research contribution is the metadata layer
behind it.** → [About the project](https://adamu.tech/mapping/about.html) ·
[Methodology](METHODOLOGY.md) · [Data dictionary](DATA_DICTIONARY.md) ·
[Project plan & status](PROJECT.md) · [Changelog](CHANGELOG.md)

## Why it exists

Oral history is scattered. National sound archives, university folklore
centres, UNESCO-recognised oral-tradition programmes, grassroots memory
projects, and testimony foundations such as StoryCorps or the Genocide
Archive of Rwanda each publish their holdings on their own site, with no
shared, geographic, multilingual way to see what exists across all of them.
Mapping Voices is a common discovery layer for that landscape — and makes
the limits of that layer explicit.

## Who it's for

Digital-humanities researchers, oral historians, linguists and
language-resource researchers, anthropologists, African Studies scholars,
archivists and librarians, students, journalists, and community and
cultural-heritage organizations.

## What the dataset contains

**Dataset v0.3.0 (2026-09-27): 221 collections · 120 countries and
territories · 125 languages** (live figures in
[`data/stats.json`](data/stats.json)).

Each record describes one real, publicly documented collection: its title
and holding institution, a map pin, the languages the recordings are in,
themes from a controlled taxonomy, the recording period, access notes, a
citation, related collections, verification status, and provenance. Field
definitions are in [`DATA_DICTIONARY.md`](DATA_DICTIONARY.md). No
recordings or testimony are included — only metadata and links.

Coverage gives particular attention to Niger and the wider Sahel/West Africa
region (CELHTO and IRSH in Niger, Mali's Sunjata-epic field recordings,
Guinea's Sosso-Bala griot tradition, Nigeria's Ifá corpus, Senegal's IFAN
sound archives, Ghana's Nketia Archives), a region under-represented in most
general oral-history tools; this project grew out of Hausa/Sahel-region
digital-humanities research.

**What the counts mean.** They describe the collections indexed here, not
the global distribution of oral history. Coverage is uneven — Russia,
Tanzania, Myanmar, Burkina Faso, and many other places have no entry yet,
usually because no verifiable public page for a real archive has been
confirmed, not because the region lacks oral history. The absence of a pin
is not evidence of absence. See [`docs/AUDIT.md`](docs/AUDIT.md) for the
gap analysis, and the [Coverage Gaps](https://adamu.tech/mapping/gaps.html)
page (`gaps.html`) for every UN member state with no indexed collection yet,
by region, each with a link to propose one.

## How data is verified

Every record passes a documented workflow (discover → identify → verify →
normalize → geolocate → classify → review → publish) and carries a
`verification_status`: *verified*, *partially verified*, *needs review*, or
*source unavailable*. As of v0.3.0 all records are *partially verified*:
institutions, links, and scope are confirmed, but field-by-field review
against each source has not yet been recorded. Every check is logged in
[`data/review-log.json`](data/review-log.json); the review workflow is in
[`docs/review/`](docs/review/README.md). Countries, languages, and
themes come from controlled vocabularies in [`data/vocab/`](data/vocab/);
languages are never inferred from geography. Full rules:
[`METHODOLOGY.md`](METHODOLOGY.md).

## How to reuse the data

The dataset is licensed **CC BY 4.0** and published as:

| File | For |
|---|---|
| [`data/collections.csv`](data/collections.csv) | Spreadsheets, R, pandas |
| [`data/collections.json`](data/collections.json) | Canonical records |
| [`data/collections.geojson`](data/collections.geojson) | QGIS, ArcGIS, web maps |
| [`data/languages.json`](data/languages.json), [`themes.json`](data/themes.json), [`countries.json`](data/countries.json) | Vocabularies with usage counts, ISO 639-3 / ISO 3166 / UN M49 codes |
| [`data/stats.json`](data/stats.json) | Aggregate counts |
| [`data/datapackage.json`](data/datapackage.json) | Frictionless Data Package descriptor |

Atlas views are addressable: filters, search, and the selected collection
live in the URL, e.g.
[`?country=Niger&language=Hausa`](https://adamu.tech/mapping/?country=Niger&language=Hausa)
or [`?c=MV-000023`](https://adamu.tech/mapping/?c=MV-000023). The
[Language Explorer](https://adamu.tech/mapping/languages.html) and the
[Theme Explorer](https://adamu.tech/mapping/themes.html) (the 15 theme groups,
scope notes, and the collections, countries, and languages behind each theme)
browse the same data as lists and link back into these atlas views.

**Mapping an archive does not grant permission to reproduce its
contents.** Access to and reuse of the collections themselves is governed
by their holding institutions.

## How to cite

> Abubakar, Adamu. *Mapping Voices: An Open Atlas of Oral-History and
> Voice-Testimony Collections*. Dataset, version 0.3.0, 2026-09-27. CC BY 4.0.
> https://adab-tech.github.io/mapping/

To cite one collection, cite its holding institution and give the Mapping
Voices identifier (e.g. `MV-000023`) as the finding aid. Machine-readable
metadata is in [`CITATION.cff`](CITATION.cff) (GitHub shows it as "Cite
this repository").

## For institutions, researchers & universities

If your archive, department, or project holds or knows of real oral-history
or voice-testimony collections, this project genuinely needs you — not as a
one-time favor, but as an ongoing source. A handful of ways to help, in
order of how much time they take:

- **Point us at what's missing.** A list of collections, a regional index
  your department maintains, a bibliography — even an informal one. We'll
  do the entry-writing, sourced and credited back to you.
- **Tell us where an entry gets your own institution wrong.** An outdated
  link, a misdescribed collection, a detail you'd phrase differently.
  Corrections are exactly as valuable as new entries.
- **Add entries yourself** — via the no-Git-required issue form or a direct
  pull request, whichever fits how your team already works. See
  [Contributing](#contributing) below.
- **Point your students at it.** Verifying and adding a real collection is
  a genuinely useful small research-methods exercise, and it's how a good
  chunk of open cultural-heritage data gets built in practice.

Every entry credits and links back to the real holding institution — this
project never re-hosts or claims ownership of anyone's archive, only helps
people find it. See [License & citation](#license--citation) for how the
dataset itself is licensed, and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
for how contributors are expected to treat each other.

## Running it locally

There's no build step — it's plain HTML/CSS/JS served over `fetch()`, so any
static file server works. From the repo root:

```bash
# Python (already on most systems)
python3 -m http.server 8080

# or Node, if you have it
npx http-server -p 8080

# or PHP
php -S localhost:8080
```

Then open `http://localhost:8080`. Opening `index.html` directly via
`file://` won't work — the app fetches `data/collections.json` at runtime,
and browsers block `fetch()` against `file://` URLs.

## Validating and building the data

```bash
node scripts/validate-data.mjs     # schema, vocabularies, duplicates, coordinates, dates
node --test tests/*.test.mjs       # tests for the validator itself
node scripts/build-data.mjs        # regenerate CSV/GeoJSON/stats exports
node scripts/validate-locales.mjs  # UI translations stay in sync
```

All zero-dependency — plain Node built-ins, no `npm install`. The validator
exits non-zero with one message per problem and prints warnings (e.g. for
`http://` URLs) without failing. CI runs all four on every pull request
(`.github/workflows/ci.yml`) and before every deployment, and fails if the
generated exports are out of date.

A separate check — `node scripts/check-links.mjs` — requests every entry's
`url` (and `preview_url`, where set). It runs weekly via
`.github/workflows/check-links.yml`, not on every PR (a source briefly down
isn't a reason to block a contribution), and opens or updates a tracking
issue when it finds a failure, closing it once every link passes.

## Contributing

Know about a real oral-history or voice-testimony collection that belongs on
this map, or spotted something wrong in a record? You don't need to know Git
or JSON — see [`CONTRIBUTING.md`](CONTRIBUTING.md) for the issue forms (new
collection, correction) and the direct pull-request path. Same honesty rule
either way: real institutions, real URLs, nothing invented.

## Deployment

Pushing to `main` runs `.github/workflows/deploy-pages.yml`, which validates
`data/collections.json` and then publishes the repository root to GitHub
Pages via `actions/upload-pages-artifact` and `actions/deploy-pages`. No
build step is involved.

## License & citation

The application code is MIT-licensed. The dataset (`data/`) is licensed
separately under CC BY 4.0, so it stays easy to reuse in
research while crediting the project that compiled it — see `LICENSE` for
the full split and its rationale. If you use or reference this project,
`CITATION.cff` has the details (GitHub also surfaces this as a "Cite this
repository" button on the repo page).

## Project layout

```
index.html                       the atlas
about.html                       project page: question, method, data, ethics, limitations
languages.html                   Language Explorer: languages, ISO codes, countries, collections
themes.html                      Theme Explorer: theme groups, scope notes, collections, countries, languages
gaps.html                        Coverage Gaps: UN member states with / without an indexed collection
css/*.css                        styles (style.css tokens; about, languages, themes, gaps pages)
js/app.js                        map, search, filters, URL state, record panel
js/{languages,themes,gaps}.js    the explorer and coverage pages
locales/*.json                   UI translations (en, ha, fr, ar)
data/collections.json            canonical records (edit this)
data/vocab/*.json                controlled vocabularies: countries, languages, themes
data/dataset-meta.json           dataset version, release date, license
data/collections.{csv,geojson}   generated exports (don't edit by hand)
data/{languages,themes,countries,stats,datapackage}.json   generated indexes
data/reference/un-m49-countries.json   static list of the 193 UN member states (UN M49 regions)
scripts/validate-data.mjs        data validator
scripts/build-data.mjs           export generator
scripts/check-links.mjs          weekly link-health check
scripts/validate-locales.mjs     locale key parity check
scripts/migrations/              reproducible record of dataset migrations
tests/                           data tests (node --test)
docs/                            audits, normalization report, review queue
PROJECT.md                       scope, users, roadmap, status against the work plan
METHODOLOGY.md                   inclusion, verification, classification, ethics
DATA_DICTIONARY.md               every field, vocabulary, and export
CHANGELOG.md                     dataset and atlas releases
LICENSE, CITATION.cff            licensing and citation
```
