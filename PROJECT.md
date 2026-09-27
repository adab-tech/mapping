# Mapping Voices — project definition

**Owner:** Adamu Abubakar · **Live:** [adamu.tech/mapping](https://adamu.tech/mapping/) ·
**Type:** open digital humanities / cultural heritage / oral-history research infrastructure ·
**Stage:** v0.2 (normalized seed atlas) → v1.0 (research-grade open atlas)

## One sentence

Mapping Voices is an open digital-humanities research infrastructure that
makes geographically and linguistically dispersed oral-history and
voice-testimony collections discoverable through structured metadata,
interactive mapping, and multilingual research tools.

## Research question

> Where are oral-history and voice-testimony collections located, which
> languages and communities do they represent, what themes and historical
> periods do they document, and how can this information be made more
> discoverable through an open digital research infrastructure?

## Core principles

- **The map is the interface, not the research contribution by itself.**
  The contribution is the structured, documented, searchable, and reusable
  metadata layer behind the map.
- **Index and connect; never re-host.** Mapping Voices links to holding
  institutions and does not claim ownership of, reproduce, or redistribute
  third-party archival content.
- **Measure what is indexed, not what exists.** Absence from the atlas is
  not absence of an oral tradition.
- **Honesty over coverage.** Nothing is added that cannot be verified; what
  is uncertain is labelled as uncertain.

## Scope

**In scope:** collections of recorded human voice — oral-history
interviews, testimony, life stories, recorded oral tradition, linguistic
and ethnographic field recordings of speech or song, community memory
recordings — held by an identifiable institution or project with a public
page of its own. Full criteria: [`METHODOLOGY.md`](METHODOLOGY.md) §1–2.

**Out of scope:** individual recordings or narrators; hosting or
transcribing content; general media archives without an evidenced
testimony holding; anything that cannot be verified.

## Target users

Digital-humanities researchers · oral historians · linguists and
language-resource researchers · anthropologists · African Studies scholars ·
archivists and librarians · students · journalists · community and
cultural-heritage organizations.

## Deliverables and where they live

| Deliverable | File |
|---|---|
| Methodology (inclusion, verification, location, language, themes, periods, duplicates, corrections, ethics) | [`METHODOLOGY.md`](METHODOLOGY.md) |
| Data dictionary (fields, vocabularies, exports) | [`DATA_DICTIONARY.md`](DATA_DICTIONARY.md) |
| Contribution model | [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| Release history | [`CHANGELOG.md`](CHANGELOG.md) |
| Citation metadata | [`CITATION.cff`](CITATION.cff) |
| Licensing (code MIT, data CC BY 4.0) | [`LICENSE`](LICENSE) |
| Public project page | [`about.html`](about.html) |
| Normalization report for v0.2.0 | [`docs/NORMALIZATION-v0.2.md`](docs/NORMALIZATION-v0.2.md) |

## Minimum viable research dataset (v1.0 target)

Every published record has: a stable `mv_id`; source URL to the holder's
own page; controlled country, languages, and themes; recording period;
verification status and provenance. v0.3.0 meets all of these for all 221
records. What v1.0 adds: field-by-field verification for a substantial
share of records (`verified`), historical period discussed, archive type,
and controlled access level.

## Status against the work plan

✅ done · 🟡 partly done · ⬜ not started

### Phase 0 — Project definition
- ✅ Name, one-sentence description, research question, scope, target users (this file)
- ✅ Inclusion / exclusion criteria, verification standard (METHODOLOGY §1–4)
- ✅ Metadata schema frozen for v0.2 (DATA_DICTIONARY)
- ✅ Licensing: code MIT, data CC BY 4.0
- ✅ Contribution model: issue forms (new collection, correction) + pull requests

### Phase 1 — Dataset architecture
- ✅ Canonical record structure; stable `MV-` identifiers
- ✅ Controlled vocabularies: countries (ISO 3166, UN M49), languages (ISO 639-3), themes (15 groups), verification status
- 🟡 Archive type (143 records), access level (49), historical period discussed (40): partly populated, derived from each record's own text (`derived` review-log method); curator check pending (`docs/HISTORICAL-PERIODS.md`)

### Phase 2 — Data collection & verification
- ✅ Verification workflow and levels defined
- ✅ Review tooling: prioritized worksheet, importer, append-only review log (`docs/review/`, `data/review-log.json`); `verified` requires a recorded field-by-field review
- ✅ Search-based source review (v0.3): 5 hard link failures and 16 `http://` URLs followed up; 11 URLs corrected, 2 records flagged
- 🟡 Field-by-field review to promote records to `verified` — tooling ready, review not yet started (73 priority-1 records in the worksheet)
- 🟡 Review queue: 11 leads added as records, 24 triaged (duplicate / out of scope / curator decision); 20 US/UK leads still open

### Phase 3 — Quality control
- ✅ Automated checks: required fields, duplicate IDs/URLs/records, vocabularies, coordinates, dates, links between records (`scripts/validate-data.mjs`, tested in `tests/`)
- ✅ Weekly broken-link check (`scripts/check-links.mjs`)
- ✅ Quality targets met (see `docs/NORMALIZATION-v0.2.md` §5), with documented exceptions

### Phase 4–5 — Atlas UX & discovery
- ✅ Live dataset statistics
- ✅ Full-text search across title, institution, country, language, theme, description
- ✅ Combined filters; grouped theme and language options
- ✅ URL state for filters, search, and selected collection (shareable, citable views)
- ✅ Collection panel: identifier, verification status, languages + note, themes, recording period, access, citation, related collections, source link, copy-link
- ✅ Access filter; record panel shows access category, institution type, and period discussed
- ⬜ Filters for archive type, institution, region

### Phase 6–8 — Language, theme, and timeline explorers
- ✅ Language Explorer (`languages.html`): ISO 639-3 codes, alternate names, countries, collections, themes, recording span, multilingual share; linked both ways with the atlas
- ⬜ Glottolog / Wikidata identifiers for languages
- ⬜ Theme explorer and timeline views (data ready in `data/themes.json`, `data/stats.json`)

### Phase 9 — Open data
- ✅ CSV, JSON, GeoJSON, languages, themes, countries, stats, Data Package descriptor — with version, date, license, methodology link

### Phase 10 — Research API
- ⬜ Not started (the static JSON files already serve read-only use)

### Phase 11 — Accessibility
- ✅ Keyboard-operable pins, filters, and drawers; screen-reader labels; skip link; reduced-motion; RTL
- ✅ Index is a first-class alternative to the map; no map-only information
- ✅ Automated audit: axe-core WCAG 2.1 AA, zero violations on every page, including RTL (`docs/testing/BROWSER-TESTING.md`)
- ✅ Reflow at 320 px, keyboard-only operation, focus trapping, reduced motion
- 🟡 Real screen-reader testing (VoiceOver, NVDA/JAWS, TalkBack) — checklist ready, not yet done

### Phase 12–13 — Performance & testing
- ✅ Data tests (`tests/`); repeatable browser audit (`tests/browser/audit.mjs`, 42 checks)
- ✅ Chromium with device emulation: iPhone SE/13, Pixel 7, Galaxy S9+, iPad, iPad Pro
- 🟡 Real Safari, Firefox, iOS and Android devices — manual checklist ready, not yet done
- ⬜ Performance measurement

### Phase 14–15 — Documentation & academic positioning
- ✅ README, METHODOLOGY, DATA_DICTIONARY, CONTRIBUTING, LICENSE, CHANGELOG, CITATION.cff
- ✅ Project page with research question, method, data, ethics, technology, applications, limitations, future directions (`about.html`)

## Roadmap

| Version | Name | Adds |
|---|---|---|
| v0.1 | Seed atlas | Map, filters, 191 records (210 after the September 2026 audit) |
| v0.2 | Metadata normalization | Stable IDs, controlled vocabularies, verification status, open data, search, URL state, methodology |
| **v0.3** | **Language explorer & review tooling** | **Language Explorer, review log and worksheet, link fixes, 11 new collections, accessibility audit** |
| v0.4 | Verification pass | Field-by-field review; archive type; access level; Glottolog/Wikidata identifiers |
| v1.0 | Research-grade release | Historical period discussed; accessibility and browser audits |
| v1.5 | Language atlas | Multilingual analysis |
| v2.0 | Research infrastructure | API; reviewed contribution workflow |
| v2.5 | Temporal atlas | Timeline views |
| v3.0 | Collaborative atlas | Institutional/community contributions with attribution |

## Project principle

**Map the archive. Preserve the context. Respect the source. Make the voices discoverable.**
