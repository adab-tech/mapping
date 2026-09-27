# Changelog

All notable changes to the Mapping Voices dataset and atlas. Dataset
changes are recorded as additions, removals, corrections, metadata changes,
broken-source changes, and taxonomy changes (METHODOLOGY §10, §12).

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
