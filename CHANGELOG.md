# Changelog

All notable changes to the Mapping Voices dataset and atlas. Dataset
changes are recorded as additions, removals, corrections, metadata changes,
broken-source changes, and taxonomy changes (METHODOLOGY §10, §12).

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
