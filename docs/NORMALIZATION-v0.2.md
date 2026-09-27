# Dataset v0.2.0 — metadata normalization report

**Date:** 2026-09-27 · **Records:** 210 (unchanged) · **Countries:** 120 (unchanged)

This pass changed no collection's substance — no record was added or
removed, and no title, institution, pin, date, summary, or URL was edited.
It restructured the metadata so the dataset can be filtered, counted,
cited, and reused reliably (Work Plan §4, §6; Immediate Next Actions 1–5).

Everything here is reproducible: the mapping tables live in
`scripts/migrations/vocab-source.mjs`, and
`scripts/migrations/v0.2-normalize.mjs` applies them (idempotently) to
`data/collections.json`.

## 1. What changed per record

| Field | Change |
|---|---|
| `mv_id` | **New.** Persistent research identifier `MV-000001`…`MV-000210`, assigned in file order. Never reused or renumbered. The existing `id` slug is kept unchanged so existing links and `related_ids` keep working. |
| `languages` | Mapped onto the controlled vocabulary in `data/vocab/languages.json` (157 free-text tags → 129 controlled terms: 124 individual languages + 5 collective categories). See §3. |
| `language_note` | **New, 43 records.** Keeps the source's exact wording wherever a tag was collapsed into a collective term (e.g. "multiple Kenyan languages"), so no information was lost. |
| `themes` | Mapped onto the taxonomy in `data/vocab/themes.json` (57 → 54 terms in 15 top-level groups). See §4. |
| `verification_status` | **New.** `partially_verified` for all 210 records — see §2. |
| `verification_note` | **New, 19 records.** Flags the entries whose languages were inferred rather than sourced (from the September 2026 audit). |
| `provenance` | **New.** How the record entered the dataset. For the 19 audit additions this includes the Wikidata QID. |
| `date_added` | **New.** Date the record first appeared in `data/collections.json`, read from git history (191 × 2026-09-01; 19 × 2026-09-20). |

The file's line endings were also normalized from CRLF (introduced by a
web upload) to LF; a `.gitattributes` rule keeps them that way.

## 2. Why every record is "partially verified"

The methodology defines **verified** as: a curator has checked the source
page and every core field against it, and recorded that review. No such
per-field review has been recorded for any record yet, so no record is
promoted to `verified` by this pass. All 210 records do meet the
**partially verified** bar: a real institution, a real public page, and an
in-scope collection, with pins already checked point-in-polygon against
country boundaries in the September 2026 audit (`docs/AUDIT.md`).

Promoting records to `verified` is now an explicit, reviewable curatorial
step (see METHODOLOGY.md §4) rather than an implicit assumption.

## 3. Language normalization

Rules applied:

1. **Spelling variants and parenthetical glosses** were merged onto one
   canonical name, with the variant kept as an `alt_name` in the vocabulary
   (e.g. `Maori` → `Māori`, `Basque (Euskara)` → `Basque`).
2. **"multiple …" / "various …" tags** — 26 distinct strings, each matching
   one or two records, which fragmented the filter — became the single
   collective term `Multiple languages`, with the original wording kept in
   `language_note`.
3. **Indigenous-language groupings in the Americas** became the collective
   term `Indigenous languages of the Americas`, again with the original
   wording in `language_note`.
4. **No individual language was inferred.** Where a source names a group,
   the record still names only the group.

ISO 639-3 codes are recorded in the vocabulary only where the mapping is
unambiguous; 121 of 124 individual languages have one. The three without
(`Maninka`, `Seto`, `Tamazight`) are ambiguous between several ISO codes
and need a curator's decision per collection.

| Original tag | Canonical term | Records |
|---|---|---|
| Basque (Euskara) | Basque | 1 |
| Cook Islands Maori | Cook Islands Māori | 1 |
| Indigenous languages of Mexico | Indigenous languages of the Americas | 2 |
| Indigenous languages | Indigenous languages of the Americas | 1 |
| iTaukei (Fijian) | Fijian | 1 |
| Kurdish (Kurmanji, Sorani) | Kurdish | 1 |
| Mandarin | Mandarin Chinese | 1 |
| Maori | Māori | 1 |
| multiple Alaska Native languages | Indigenous languages of the Americas | 2 |
| multiple endangered languages | Multiple languages | 2 |
| multiple Ethiopian languages | Multiple languages | 1 |
| multiple Ghanaian languages | Multiple languages | 1 |
| multiple immigrant languages | Multiple languages | 3 |
| multiple Indian languages | Multiple languages | 1 |
| multiple Indigenous languages of the Americas | Indigenous languages of the Americas | 1 |
| multiple Indigenous languages | Indigenous languages of the Americas | 1 |
| multiple Indigenous Latin American languages | Indigenous languages of the Americas | 1 |
| multiple Kenyan languages | Multiple languages | 1 |
| multiple languages | Multiple languages | 6 |
| multiple Micronesian languages | Multiple languages | 1 |
| multiple ni-Vanuatu languages | Multiple languages | 1 |
| multiple other languages | Multiple languages | 1 |
| multiple Pacific and Southeast Asian languages | Multiple languages | 1 |
| multiple Papua New Guinean languages | Multiple languages | 1 |
| multiple regional languages of Flores, Sumba, Alor, Timor and Kisar | Multiple languages | 1 |
| multiple Senegalese languages | Multiple languages | 1 |
| multiple Solomon Islands languages | Multiple languages | 1 |
| multiple South Asian languages | Multiple languages | 1 |
| multiple Thai regional and ethnic languages | Multiple languages | 1 |
| multiple UN-participant languages | Multiple languages | 1 |
| multiple Vietnamese ethnic minority languages | Multiple languages | 1 |
| multiple world languages | Multiple languages | 4 |
| multiple | Multiple languages | 1 |
| Northern Sami | Northern Sámi | 1 |
| Sami | Sámi languages | 1 |
| various endangered languages | Multiple languages | 1 |
| Voro | Võro | 1 |

## 4. Theme normalization

Three near-duplicates were merged; everything else was kept as-is and
placed in a top-level group.

| Original theme | Canonical term | Records |
|---|---|---|
| armed conflict | war and conflict | 7 |
| politics | political history | 3 |
| labor | labor history | 1 |

## 5. Quality targets (Work Plan §6)

| Target | Status |
|---|---|
| 100% of records with source URLs | ✅ 210 / 210 |
| 100% with country metadata (controlled) | ✅ 210 / 210, all in `data/vocab/countries.json` |
| 100% with stable IDs | ✅ 210 / 210 `mv_id` |
| 100% with verification status | ✅ 210 / 210 |
| 0 duplicate canonical URLs | ✅ 0 (checked ignoring scheme, `www.`, trailing slash) |
| 0 duplicate title + institution pairs | ✅ 0 |
| Controlled languages / themes | ✅ enforced by `scripts/validate-data.mjs` |
| Documented exceptions for incomplete records | ✅ below |

**Documented exceptions**

- **16 records use `http://` URLs.** The validator now reports these as
  warnings on every run. Each needs a human to check whether the https
  version serves the same page.
- **19 records have inferred languages** (`verification_note`).
- **Link liveness was not re-checked in this pass**: the environment it ran
  in could not reach institutional domains. The weekly
  `check-links.yml` job remains the source of truth for broken links.
- **Optional-field coverage** (from `data/stats.json`): `citation` 84%,
  `related_ids` 55%, `access_notes` 27%, `preview_url` 2%.

## 6. Not done in this pass (next steps)

- Field-by-field verification to promote records to `verified`.
- `archive_type`, `access` (controlled), and `historical_period` fields:
  defined in DATA_DICTIONARY.md as planned, not populated. Filling them
  requires reading each source page, not scripting.
- Glottolog / Wikidata identifiers for languages.
