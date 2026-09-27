# Data dictionary

The authoritative definition of every field in the Mapping Voices dataset,
its controlled vocabularies, and its exported files. How values are
*chosen* (inclusion, verification, geolocation, classification) is in
[`METHODOLOGY.md`](METHODOLOGY.md).

**Schema version:** matches dataset v0.3.0 · **Enforced by:**
`scripts/validate-data.mjs` (runs in CI on every pull request)

---

## 1. Files

| File | Role | Edited by hand? |
|---|---|---|
| `data/collections.json` | **Canonical records.** A JSON array, one object per collection. | Yes |
| `data/vocab/countries.json` | Controlled vocabulary for `country` | Yes |
| `data/vocab/languages.json` | Controlled vocabulary for `languages` | Yes |
| `data/vocab/themes.json` | Controlled taxonomy for `themes` | Yes |
| `data/dataset-meta.json` | Dataset title, version, release date, license | Yes, at release |
| `data/review-log.json` | Append-only log of source checks (see §6) | Via `scripts/apply-review.mjs` or migration scripts |
| `data/new-entries-provenance.json` | Harvest provenance for the 19 September 2026 audit additions | Historical |
| `data/collections.csv` | Flattened export (see §5) | **No — generated** |
| `data/collections.geojson` | GeoJSON export | **No — generated** |
| `data/languages.json` | Language vocabulary + usage counts | **No — generated** |
| `data/themes.json` | Theme taxonomy + usage counts | **No — generated** |
| `data/countries.json` | Country vocabulary + usage counts | **No — generated** |
| `data/stats.json` | Aggregate statistics | **No — generated** |
| `data/datapackage.json` | Frictionless Data Package descriptor | **No — generated** |

Regenerate the exports after any change to the canonical files:

```bash
node scripts/build-data.mjs          # write exports
node scripts/build-data.mjs --check  # what CI runs: fail if stale
```

## 2. Record fields (`data/collections.json`)

### Identity

| Field | Type | Req. | Definition |
|---|---|---|---|
| `mv_id` | string | ✔ | **Persistent research identifier**, `MV-` + six digits (e.g. `MV-000023`). Assigned once, never changed, never reused — even if the record is retired. Use this in citations and in links (`?c=MV-000023`). New records take the next unused number. |
| `id` | string | ✔ | Kebab-case slug, unique. Internal key used by `related_ids` and older links. Keep stable once published; `mv_id` is the identifier to cite. |
| `title` | string | ✔ | The collection's real name as the holder publishes it (or the archive/fonds name if the institution holds several). |
| `archive` | string | ✔ | The real name of the holding institution or project. |

### Place

| Field | Type | Req. | Definition |
|---|---|---|---|
| `country` | string | ✔ | A `name` from `data/vocab/countries.json`. The country the voices come from — usually the holder's country; see METHODOLOGY §5 when subject and holder differ. |
| `lat`, `lng` | number | ✔ | Decimal degrees (WGS 84) of the map pin. `lat` ∈ [-90, 90], `lng` ∈ [-180, 180]; `0,0` is rejected. City-level precision; never more precise than the custodian publishes. |

Region, subregion, and ISO 3166-1 code are **not** stored per record; they
are joined from the country vocabulary in the exports.

### Language

| Field | Type | Req. | Definition |
|---|---|---|---|
| `languages` | string[] | ✔ | Non-empty, no duplicates. Each a `name` from `data/vocab/languages.json`. The languages the recordings/materials are actually in. |
| `language_note` | string | — | The source's own wording when a collective term is used (e.g. `"multiple Kenyan languages"`), or other qualifications (e.g. dialects named by the source). **Required** when `languages` includes `Multiple languages`. |

### Subject

| Field | Type | Req. | Definition |
|---|---|---|---|
| `themes` | string[] | ✔ | Non-empty, no duplicates. Each a `name` from `data/vocab/themes.json`. What the collection is principally about; typically 2–4. |
| `summary` | string | ✔ | 1–3 plain-language sentences on what the collection contains, from the source. No hype, no invented detail. |

### Time

| Field | Type | Req. | Definition |
|---|---|---|---|
| `decade_start` | integer | ✔ | Year the collection/recording effort began (a year, despite the name). 1800 – current year. |
| `decade_end` | integer \| null | ✔ | Year it ended, or `null` if ongoing. Not before `decade_start`; not in the future. |
| `historical_period_start`, `historical_period_end` | integer \| null | — | *Planned (v1.0).* Years bounding the events the testimony discusses, as distinct from when it was recorded. Validated when present; not yet populated. |

### Access and linking

| Field | Type | Req. | Definition |
|---|---|---|---|
| `url` | string | ✔ | `http(s)` URL of the holder's own public page for the collection (or archive). Unique across the dataset, ignoring scheme, `www.`, and trailing slash. `http://` is allowed but flagged. |
| `access_notes` | string | — | How the collection is actually reached, from the holder's page: e.g. "Freely accessible online", "Reading-room access only", "Partial collection online, full collection by request". Never assumed. |
| `preview_url` | string \| null | — | Only when the holder itself provides a listen/watch page. Never a third-party mirror. |
| `citation` | string | — | A citation for the collection built from verified fields only: `"Institution. Title. Retrieved from URL."` Never invent a DOI, edition, or date. |
| `related_ids` | string[] | — | `id`s of other records that are genuinely related (same event, region, or programme). Must resolve; must not include the record's own `id`. |

### Verification and provenance

| Field | Type | Req. | Definition |
|---|---|---|---|
| `verification_status` | string | ✔ | One of `verified`, `partially_verified`, `needs_review`, `unavailable`. Definitions: METHODOLOGY §4. |
| `verification_note` | string | — | Which fields are inferred or unchecked, or why a source is unavailable. |
| `provenance` | string | ✔ | How the record entered the dataset (e.g. maintainer curation, a named harvest with its Wikidata QID, a contributor issue number). |
| `date_added` | string \| null | — | `YYYY-MM-DD` the record was first published. For v0.1 records, taken from git history. |
| `last_reviewed` | string | — | `YYYY-MM-DD` of the most recent **field-by-field** review against the source. **Required** when `verification_status` is `verified`. Set by `scripts/apply-review.mjs`. |

### Planned fields (not yet in the data)

These are defined so that contributors and tools use consistent names when
they arrive. The validator does not check them yet.

| Field | Planned values |
|---|---|
| `archive_type` | `national archive`, `university archive`, `library`, `museum`, `research institute`, `community archive`, `independent project`, `language archive`, `intergovernmental body` |
| `access` | `open online`, `partial online`, `registration required`, `on request`, `on site only`, `restricted` |
| `community` | Free text: the community or population represented, in the holder's terms |
| `region` / `locality` | Sub-national place names, when the source supports them |

## 3. Controlled vocabularies (`data/vocab/`)

Every vocabulary file has the shape `{ "$comment": …, "terms": [ … ] }`.
Only a term's `name` may appear in a record. `alt_names` exist so people
and tools can map variants and search on them; an alt name may never equal
another term's `name` (the validator checks this).

### `countries.json`

| Key | Definition |
|---|---|
| `name` | Canonical common name used in records |
| `iso3166_1_alpha2` | ISO 3166-1 alpha-2 code |
| `region`, `subregion` | UN M49 region and subregion |
| `un_member` | `false` for territories and other non-UN-member entities — a cataloguing flag, not a political claim |
| `alt_names` | Variants (e.g. `USA`, `Czechia`, `Ivory Coast`) |

### `languages.json`

| Key | Definition |
|---|---|
| `name` | Canonical name used in records |
| `iso639_3` | ISO 639-3 code where unambiguous, else `null` |
| `type` | `language`, `macrolanguage` (code names the macrolanguage), `sign language`, or `collective` |
| `alt_names` | Endonyms, spelling variants, older names |

**Collective terms** (`type: "collective"`) are used only when a source names
a group rather than individual languages: `Multiple languages`,
`Indigenous languages of the Americas`, `Mayan languages`, `Sámi
languages`, `Aboriginal and Torres Strait Islander languages`. They are
excluded from "number of languages" statistics and shown in their own group
in the interface.

### `themes.json`

| Key | Definition |
|---|---|
| `groups[]` | `{ id, label }` — the 15 top-level headings |
| `terms[].name` | Canonical theme used in records |
| `terms[].group` | The `id` of its top-level group |
| `terms[].scope_note` | What the theme covers, to guide consistent assignment |

## 4. Adding a record

1. Confirm the collection meets the inclusion criteria (METHODOLOGY §1).
2. Append an object to `data/collections.json` with every required field
   above. Use the next unused `mv_id`.
3. Use only vocabulary terms. If a language or theme is genuinely missing,
   add it to the vocabulary file in the same pull request, with its ISO
   code (languages) or group and scope note (themes).
4. Set `verification_status` honestly — usually `partially_verified` unless
   you have checked every core field against the source — and fill
   `provenance`.
5. Run:
   ```bash
   node scripts/validate-data.mjs
   node scripts/build-data.mjs
   ```
   and commit the regenerated exports with your change.

## 5. Exports

All exports carry the dataset version, release date, license, and scope
statement (as a `metadata` object in JSON/GeoJSON, and in
`datapackage.json` for the CSV).

**`collections.csv`** — UTF-8, CRLF line endings, one row per record,
columns in this order:

`mv_id, id, title, archive, country, iso3166_1_alpha2, region, subregion,
lat, lng, languages, language_note, themes, theme_groups, decade_start,
decade_end, summary, url, citation, access_notes, related_ids, preview_url,
verification_status, verification_note, provenance, date_added`

Multi-valued fields (`languages`, `themes`, `theme_groups`, `related_ids`)
are joined with `"; "`. Empty cells mean the value is absent or `null`.

**`collections.geojson`** — RFC 7946 `FeatureCollection`; one `Point` per
record with coordinates `[lng, lat]`, `id` = `mv_id`, and all other CSV
columns as `properties` (arrays kept as arrays).

**`languages.json`, `themes.json`, `countries.json`** — the vocabularies
with, per term, `collection_count` and the `mv_id`s using it (plus countries
per language, and languages per country).

**`stats.json`** — totals (collections, countries, individual languages,
themes, institutions, decades), and counts by region, verification status,
country, language, theme group, and decade (a collection counts once in
every decade it spans), plus optional-field coverage.

## 6. Review log (`data/review-log.json`)

`{ "$comment": …, "entries": [ … ] }`, append-only, one entry per check:

| Key | Definition |
|---|---|
| `date` | `YYYY-MM-DD` of the check |
| `mv_id` | The record checked (must exist) |
| `check` | What was checked: `link`, `https`, `languages`, `field-by-field`, … |
| `method` | `field-by-field` (a person compared every core field with the source page), `search-based` (evidence from search results; source page not opened), or `link-check` |
| `reviewer` | Who did it |
| `finding` | What was found, in plain language |
| `evidence` | URLs supporting the finding |
| `changes` | `{ field: { from, to } }` applied to the record, or `null` |
| `outcome` | e.g. `corrected`, `flagged`, `unchanged`, or the resulting verification status |

Only `field-by-field` entries can justify `verified`. The validator checks
every entry's shape and that its `mv_id` exists.
