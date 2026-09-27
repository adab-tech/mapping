# Changelog

All notable changes to the Mapping Voices dataset and atlas. Dataset
changes are recorded as additions, removals, corrections, metadata changes,
broken-source changes, and taxonomy changes (METHODOLOGY §10, §12).

## [Unreleased]

### Dataset
- The dataset is archived on Zenodo: concept DOI
  [10.5281/zenodo.22996478](https://doi.org/10.5281/zenodo.22996478) (all versions, resolves to the latest) and v0.4.0 DOI
  [10.5281/zenodo.22996479](https://doi.org/10.5281/zenodo.22996479). The DOIs are recorded in `data/dataset-meta.json` (`doi`), `CITATION.cff`, the
  Data Package descriptor (`id`), the atlas JSON-LD, the README (badge and
  citation), and the About page citation.

- The creator's ORCID iD (0009-0009-4672-4956) is in `.zenodo.json`, `CITATION.cff` and
  the atlas JSON-LD, so DataCite can link future Zenodo versions to ORCID.

### Atlas
- **Every screen size**, checked on a 13-viewport matrix (320×568 phone to
  3840×2160) plus landscape phones, 200 % / 400 % zoom and Arabic:
  - Desktop (≥ 980 px): the atlas is now exactly one screen tall and the
    side panels scroll inside it. Before, the 221-entry index stretched the
    page — and the map — to about 18,700 px, so the map's centre and the
    selected pin were far below the fold.
  - Side panels size with the viewport (18–24 rem filters, 18–30 rem
    record), so the map gets 448 px instead of 320 px at 1024 wide and
    panels grow on wide screens; from 1800 px wide the whole UI scales up
    gently (≈ 19 px text at 2560, 24 px at 3840).
  - Landscape phones and short windows: compact header, one-line footer,
    and the record opens as a side sheet (inline-end, mirrored in Arabic)
    instead of a bottom sheet covering the map. Tablet portrait sheet is
    62 % tall instead of 80 %. On phones and tablets the map centres a
    selected pin in the part the sheet leaves visible.
  - Mobile: Leaflet's zoom buttons no longer paint over the open filters
    drawer; header nav (reading pages) and atlas footer are single
    swipeable rows; `dvh` units so browser chrome doesn't hide content;
    safe-area insets for notched phones (`viewport-fit=cover`).
  - Touch screens: buttons, selects, map zoom, popup close, footer and
    header links are ≥ 44 px; pins get a 44 px hit area; form fields are
    16 px so iOS doesn't zoom on focus.
  - Reading pages: header and footer align to a centred 90 rem frame on
    ultra-wide screens.
  - The map re-measures itself when its box changes size
    (`ResizeObserver` → `invalidateSize`), e.g. on rotation.
  - `tests/browser/audit.mjs` gains 9 viewport checks (69 in all).

### Tooling
- `.github/workflows/release.yml` creates a GitHub release `v<version>`
  whenever the dataset version changes on `main` (or on demand), with
  release notes taken from this changelog by `scripts/release-notes.mjs`
  (tested). With the Zenodo–GitHub integration enabled, each release is
  archived with a DOI; `.zenodo.json` describes it as a CC BY 4.0 dataset.

## [0.4.0] — 2026-09-27 — Access, institution type, period discussed; Theme Explorer; Coverage Gaps

### Dataset
- **Metadata changes:** three optional fields, previously listed as
  planned, are now populated — each value derived mechanically from text
  already in the record, and omitted wherever that text does not clearly
  support one. No existing value of any record was changed; no record's
  verification status changed.
  - `access` (49 of 61 records with `access_notes`; 22%): 23 open online,
    12 partial online, 9 on site only, 3 on request, 2 registration
    required. The 12 notes left without a value are ambiguous or describe
    custody rather than access; records without `access_notes` get none.
  - `archive_type` (143 of 221; 65%) from the holding institution's name:
    76 university or research institute, 21 museum, 20 foundation or
    nonprofit, 15 national archive or library, 5 intergovernmental body,
    2 each broadcaster, community or independent project, government
    agency. 78 left blank (name does not state the type, or a joint or
    ambiguous holder).
  - `historical_period_start` / `historical_period_end` (40 of 221; 18%)
    for collections principally about one bounded event (e.g. Holocaust
    1933–1945, Korean War 1950–1953, Jeju 4.3 1947–1954). Every mapping is
    listed for curators in `docs/HISTORICAL-PERIODS.md`.
- **Taxonomy:** new controlled vocabularies `data/vocab/access.json`
  (6 terms) and `data/vocab/archive-types.json` (9 terms), each term with a
  definition. The planned `archive_type` list was consolidated (e.g.
  `national archive` + `library` → `national archive or library`).
- **Review log:** new method `derived` (a value derived from the record's
  own sourced text, no new source consulted); 174 entries, one per record
  changed. Script: `scripts/migrations/2026-09-28-derived-fields.mjs`
  (idempotent).
- **Exports:** the new fields are in `collections.csv` / `.geojson`;
  `stats.json` adds `by_access`, `by_archive_type`, and their coverage;
  `datapackage.json` lists the two new vocabularies.

### Atlas
- New **Access** filter (options from the data; combines with the other
  filters; kept in the URL as `?access=open+online`).
- The record panel shows the access category above the holder's access
  notes, the institution type, and the **Period discussed** (e.g.
  1939–1945) separately from the recording period.
- New UI strings translated into Hausa, French, and Arabic.
- New **Theme Explorer** (`themes.html`): the 15 top-level theme groups,
  each theme with its scope note and count, the collections it is assigned
  to, and the countries and languages they span, linking back into filtered
  atlas views. Search, sort, and the open theme live in the URL
  (`?q=…&sort=…#theme-…`).
- New **Coverage Gaps** page (`gaps.html`): per UN M49 region and subregion,
  which UN member states have an indexed collection and which have none
  yet, each gap with a link to propose a collection. States plainly that it
  shows gaps in the indexed dataset, not in oral history.
- "Themes" and "Coverage gaps" added to the site navigation and the atlas
  footer (new locale keys `footer.themes`, `footer.gaps` in en, ha, fr, ar).

### Tooling
- The validator checks `access` and `archive_type` against their
  vocabularies and accepts review-log method `derived`; tests added.
- New static reference file `data/reference/un-m49-countries.json` (the 193
  UN member states, ISO 3166-1 alpha-2, M49 region/subregion), with a test
  (`tests/un-m49-countries.test.mjs`) that it agrees with
  `data/vocab/countries.json`.
- Project skills for quick actions in `.claude/skills/` (`add-collection`,
  `triage-leads`, `verify-records`, `fix-broken-links`, `release-dataset`,
  `site-audit`) and a `CLAUDE.md` with the ground rules and checks.
- The browser audit covers the Theme Explorer and Coverage Gaps pages
  (60/60 checks in Chromium).

## [0.3.0] — 2026-09-27 — Language Explorer, review tooling, source review

### Dataset
- **Additions:** 11 collections completed from the review queue
  (MV-000211–MV-000221): Swiss Folk Song Archive; Uysal–Walker Archive of
  Turkish Oral Narrative; BC Archives' Sound Heritage programs; Foundation
  for Iranian Studies' Oral History of Iran; Samuel Proctor Oral History
  Program; Columbia's Oral History Archives; Bancroft Oral History Center;
  Black Women Oral History Project; Queens Memory Project; Voices of
  Oklahoma; West Point Center for Oral History. Now 221 collections.
- **Broken-source changes:** new URLs for Yad Vashem (404), the Estonian
  Folklore Archives (404), and the Arquivo Histórico de Moçambique (410);
  Botswana and Sri Lanka flagged for a curator.
- **Corrections:** 8 `http://` URLs moved to the holders' current https
  pages (Michinoku Shinrokuden, Freedom Collection, Battye Library,
  Khayrallah Center, Pangloss, War Childhood Museum, Österreichische
  Mediathek, OHAM); citations updated with them. Languages sourced for the
  Swaziland Oral History Project (siSwati + English), Pangloss, and the UMSA
  oral archive.
- **Taxonomy:** added Tibetan (`bod`).
- **Review log:** new `data/review-log.json`, 38 entries, all
  search-based. No record promoted to `verified`.
- Review queue triaged: 11 added, 14 duplicates, 1 merged, 5 out of scope,
  3 need a curator decision, 1 needs a URL, 20 still open.

### Atlas
- New **Language Explorer** (`languages.html`): every language with its
  ISO 639-3 code, alternate names, countries, collections, frequent
  themes, recording span, and multilingual share; searchable, sortable,
  deep-linkable (`#lang-hausa`), and linked both ways with the atlas.
- Languages in the record panel link to the Explorer.

### Tooling and testing
- `scripts/review-worksheet.mjs` and `scripts/apply-review.mjs` for the
  field-by-field verification pass (`docs/review/README.md`).
- Validator: `verified` requires `last_reviewed`; the review log is
  validated.
- `tests/browser/audit.mjs`: axe-core WCAG 2.1 AA, device emulation, reflow,
  keyboard, reduced motion, RTL — 42/42 pass in Chromium. Results and a
  manual checklist for Safari, Firefox and real devices in
  `docs/testing/BROWSER-TESTING.md`.

## [0.2.0] — 2026-09-27 — Metadata normalization

No collection was added or removed, and no title, institution, pin, date,
summary, or URL was changed. Full report:
[`docs/NORMALIZATION-v0.2.md`](docs/NORMALIZATION-v0.2.md).

### Dataset
- **Added** persistent identifiers `mv_id` (`MV-000001`–`MV-000210`).
- **Added** `verification_status` (all `partially_verified`),
  `verification_note` (19 records with inferred languages), `provenance`,
  and `date_added` (from git history) to every record.
- **Added** `language_note` (43 records), preserving the source wording of
  collapsed language tags.
- **Taxonomy:** introduced controlled vocabularies in `data/vocab/` —
  120 countries (ISO 3166-1, UN M49), 129 language terms (124 languages
  with 121 ISO 639-3 codes, plus 5 collective terms), 54 themes in 15
  groups.
- **Metadata changes:** 157 free-text language tags → 129 controlled terms
  (e.g. 26 distinct "multiple …" tags → `Multiple languages`; `Maori` →
  `Māori`); 57 themes → 54 (`armed conflict` → `war and conflict`,
  `politics` → `political history`, `labor` → `labor history`).
- **Open data:** new generated exports `collections.csv`,
  `collections.geojson`, `languages.json`, `themes.json`, `countries.json`,
  `stats.json`, and a Frictionless `datapackage.json`.
- Normalized `data/collections.json` line endings to LF.

### Atlas
- Full-text search (diacritic-insensitive) across title, institution,
  country, languages, themes, and description.
- Filters and selected collection are kept in the URL
  (`?country=Niger&language=Hausa&c=MV-000023`) for sharing and citation;
  browser back/forward restore them.
- Live dataset counts (collections, countries, languages) with a
  scope statement.
- Theme options grouped by taxonomy; collective language terms grouped
  separately.
- Collection panel now shows identifier, verification status, language
  note, recording period, access notes, citation, related collections
  (navigable), a copy-link button, and a reuse notice.
- New project page `about.html`: research question, method, open data,
  ethics, technology, limitations, roadmap, citation.
- Footer links to About, Methodology, Open data, Contribute; removed the
  "seed/demo atlas" wording.
- Fixed: long option labels widened the filter column past the panel on
  desktop; the record sheet was offset on phones narrower than 480 px;
  detail labels raised to a higher-contrast colour.
- New UI strings translated into Hausa, French, and Arabic.

### Tooling and documentation
- `scripts/validate-data.mjs` now enforces vocabularies, `mv_id` format and
  uniqueness, duplicate URLs and title+institution pairs, verification
  status, `0,0` coordinates, and `language_note` for collective terms; warns
  on `http://` URLs. Exposed as a module and covered by `tests/`.
- `scripts/build-data.mjs` generates the exports; CI checks they are
  current and runs the tests.
- New `METHODOLOGY.md`, `DATA_DICTIONARY.md` (supersedes
  `data/schema-notes.md`), `PROJECT.md`, this changelog, and a correction
  issue form.

## [0.1.0] — 2026-09 — Seed atlas

- Interactive Leaflet map with country, theme, language, and decade
  filters and a text index; English, Hausa, French, and Arabic UI.
- 191 records across 118 countries (2026-09-01), expanded to 210 records
  across 120 countries by the September 2026 audit (`docs/AUDIT.md`).
- Validation in CI, weekly link check, contribution issue form, MIT/CC BY
  4.0 licensing, `CITATION.cff`.
