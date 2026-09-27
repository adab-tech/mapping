# Methodology

How Mapping Voices decides what to include, how records are verified,
located, and classified, and how the dataset is corrected over time. This
document is meant to make the dataset understandable and reproducible by
another researcher. Field definitions are in
[`DATA_DICTIONARY.md`](DATA_DICTIONARY.md); project scope and goals are in
[`PROJECT.md`](PROJECT.md).

**Applies to:** dataset v0.2.0 onward · **Last revised:** 2026-09-27

---

## 0. What the dataset measures

Mapping Voices indexes **discoverable, publicly documented** oral-history
and voice-testimony collections. Every count, map, and statistic describes
*the collections currently indexed here* — not the global distribution of
oral history.

> The absence of an indexed archive for a place, community, or language is
> **not** evidence that no oral-history tradition or collection exists
> there. It usually means one of: no public web page exists for it, it has
> not yet been found, or it could not yet be verified.

Reports built on this dataset should say "among the collections indexed in
Mapping Voices…", never "most oral histories in the world…".

## 1. What qualifies for inclusion

A record is included only if **all** of the following hold:

1. **It is a collection of recorded human voice.** Oral-history interviews,
   testimony, life stories, recorded oral tradition (epic, genealogy,
   narrative, song), ethnographic or linguistic field recordings of speech
   or song, and community memory recordings all qualify.
2. **It is real and publicly documented.** An identifiable institution or
   project holds it, and it has a public page of its own — the
   institution's or project's own site, catalogue entry, or finding aid.
3. **The link goes to the holder.** The record's `url` points to the
   holding institution's own page for the collection (or for the archive,
   when no collection-level page exists).
4. **The core metadata can be supported.** Title, holding institution,
   country, and the collection's general scope can be stated from the
   source without invention.

Both open and restricted collections qualify; access conditions are
recorded, not used as a filter for inclusion.

## 2. What does not qualify

- Collections that cannot be verified as real, or whose only evidence is
  a secondary write-up (a news article, blog post, Wikipedia page) with no
  page from the holder itself.
- General film, sound, or broadcast archives with no evidenced
  oral-history or testimony holding.
- Organizations, societies, or funders that do not hold a collection.
- Individual recordings, individual narrators, or individual testimonies.
  The unit of description is the **collection**.
- Private holdings with no public documentation.
- Anything that would require publishing more than the custodian already
  publishes (see §11).

Rejected candidates are kept with the reason in `docs/review-queue.csv`, so
the decision is visible and can be revisited.

## 3. How collections are discovered

Candidates come from, in rough order of preference:

1. Institutional sources: national archives and libraries, university
   archives and folklore/ethnomusicology centres, museums, UNESCO
   intangible-heritage documentation.
2. Established oral-history and language-documentation projects and their
   networks (e.g. language archives in the DELAMAN network).
3. Community archives and reputable non-profit testimony projects.
4. Contributor proposals via the issue form (see `CONTRIBUTING.md`).
5. Structured harvesting of Wikipedia/Wikidata categories as **leads only**
   — a lead becomes a record only after the holder's own page is found
   (see `docs/AUDIT.md` for how the September 2026 harvest was filtered
   from 2,397 pages to 19 records).

Discovery method is recorded per record in `provenance`.

## 4. How entries are verified

Every record passes the same workflow:

```
DISCOVER → IDENTIFY → VERIFY → NORMALIZE → GEOLOCATE → CLASSIFY → REVIEW → PUBLISH
```

| Step | What happens |
|---|---|
| Discover | A candidate is found (§3). |
| Identify | The holding institution and the collection's own page are identified. |
| Verify | The page is confirmed to be the holder's, live, and in scope (§1). |
| Normalize | Country, languages, and themes are mapped to the controlled vocabularies (§6, §7). |
| Geolocate | A pin is assigned (§5). |
| Classify | Themes, recording period, and access notes are recorded from the source. |
| Review | `node scripts/validate-data.mjs` passes; a maintainer reviews the pull request. |
| Publish | The record is merged, gets its `mv_id`, and appears in the next dataset version. |

### Verification levels (`verification_status`)

| Status | Meaning |
|---|---|
| `verified` | A curator has checked the source page and **every core field** (title, institution, country, languages, themes, period, summary, url) against it, and recorded that review. |
| `partially_verified` | The institution, link, and scope are confirmed, but one or more fields are inferred or have not yet been checked field-by-field. `verification_note` says which, where known. |
| `needs_review` | A candidate that has not cleared verification. Not normally published; used for records under active correction. |
| `unavailable` | A previously verified source is no longer reachable. **The record is kept, not deleted**, with the date and a note, so citations to it remain resolvable. |

As of v0.2.0 all records were `partially_verified`: no field-by-field review
had been recorded (see `docs/NORMALIZATION-v0.2.md` §2).

### Recording reviews

Every check on a record — a curator's field-by-field review, a
search-based source check, a link-check follow-up — is appended to
`data/review-log.json` with its date, method, reviewer, finding, evidence
URLs, and resulting changes. A record may be `verified` only if it has a
`last_reviewed` date from a **field-by-field** review by a person who
opened the source page; the validator enforces the date. Search-based
checks can correct links and flag problems but never promote a record.
The worksheet workflow is described in `docs/review/README.md`.

### Derived values (method `derived`)

Some optional fields can be filled **mechanically from text a record
already contains**, without consulting any new source: `access` from
`access_notes`, `archive_type` from the holding institution's name, and the
historical period discussed from a bounded event named in the title or
summary (§8). These are logged with method `derived` (reviewer “Claude
(derived from record text)” for the first pass, 2026-09), one review-log
entry per record changed, with the record's own `url` as evidence and the
quoted phrase that justified each value in the finding. The rules are:

- **Only where the text clearly supports the value.** If a phrase could
  support two values, or the text describes custody rather than access,
  the field is left out. Coverage is reported, not maximised.
- **Never overwrite.** A value set by a curator is kept.
- **Never promote.** A derived value is no stronger than the text it came
  from, and does not change `verification_status`. A field-by-field review
  confirms or corrects it against the source.
- **Reproducible.** The derivation is a script
  (`scripts/migrations/2026-09-28-derived-fields.mjs`) listing each rule,
  each judgement, and each record deliberately left blank.

### Automated checks

`scripts/validate-data.mjs` runs on every pull request and deployment. It
rejects missing required fields, malformed or duplicate `id`/`mv_id`,
duplicate URLs (ignoring scheme, `www.`, and trailing slashes), duplicate
title + institution pairs, out-of-range or `0,0` coordinates,
non-http(s) URLs, values outside the controlled vocabularies (including
the optional `access` and `archive_type`), impossible dates, and dangling
`related_ids`. It warns on `http://` URLs.
`scripts/check-links.mjs` requests every URL weekly and opens a tracking
issue for failures. `tests/` holds tests for the validator itself.

## 5. How locations are assigned

The pin (`country`, `lat`, `lng`) answers **"where do these voices come
from?"**, not "which building are the tapes in?".

- **Default:** when the collection documents the place where its holder is
  based, the pin is the holding institution's location (city-level
  precision is sufficient).
- **Subject differs from holder:** when a collection documents a place
  other than where it is held (e.g. Malian epic recordings held at a US
  university), `country` and the pin point to the **subject**, while
  `archive` still names the real holding institution.
- **Multi-country collections:** pinned at the holder's location, with
  the scope described in `summary`.
- Pins are checked to fall inside the stated country (point-in-polygon
  against Natural Earth boundaries, `docs/AUDIT.md`).
- **Precision is deliberately coarse.** Pins never locate individual
  narrators, communities at risk, or sensitive sites more precisely than
  the custodian already does.

`country` must be a name from `data/vocab/countries.json`, which records
ISO 3166-1 alpha-2 codes and UN M49 regions. Territories and other
non-UN-member entities (Hong Kong, Taiwan, Puerto Rico, the Cook Islands)
are listed as they are commonly named, with `un_member: false`; this is a
cataloguing convenience, not a political claim.

## 6. How languages are classified

- `languages` lists the languages the **recordings or materials are
  actually in**, as stated by the source. It is not the language of the
  institution's website, and not the languages spoken in the country.
- Values come from `data/vocab/languages.json`. Each term has a canonical
  name, alternate names, a type, and an ISO 639-3 code where the mapping is
  unambiguous (a macrolanguage code names the macrolanguage, not a
  variety).
- **Language identity is never inferred from geography.** When a source
  names only a group ("multiple Kenyan languages"), the record uses a
  **collective term** (`Multiple languages`, `Indigenous languages of the
  Americas`, `Mayan languages`, `Sámi languages`, `Aboriginal and Torres
  Strait Islander languages`) and keeps the source's exact wording in
  `language_note`. The validator requires a `language_note` whenever
  `Multiple languages` is used.
- Where languages had to be inferred (19 records from the September 2026
  harvest), `verification_note` says so; these are the first candidates for
  review.
- Canonical names follow widespread scholarly usage; alternate names —
  including endonyms and older exonyms — are recorded so they remain
  searchable. Naming is revisable (§10).
- New languages are added to the vocabulary in the same pull request as the
  record that needs them.

## 7. How themes are assigned

- `themes` come from the taxonomy in `data/vocab/themes.json`: controlled
  terms, each with a scope note, grouped under 15 top-level headings
  (e.g. *Migration & displacement*, *Oral tradition & folklore*).
- Themes are assigned from what the source says the collection documents,
  usually 2–4 per record.
- **Themes are discovery aids, not exhaustive descriptions.** A collection
  of life-history interviews will touch many subjects; the themes record
  what it is principally *about*.
- A new theme is added only when no existing term's scope note covers the
  topic; prefer reuse over near-duplicates.

## 8. How historical periods are represented

Two different periods matter to historians and are kept separate:

| Period | Field | Status |
|---|---|---|
| **Recording / collection period** — when the testimony was gathered | `decade_start`, `decade_end` (`null` = ongoing) | Recorded for every record. Years, not just decades, despite the field name. |
| **Historical period discussed** — when the events described took place | `historical_period_start`, `historical_period_end` | Partly populated (40 of 221 records): derived, curator-checkable (below). |

Example: a project recording Partition survivors in 2010–2020 has
recording period 2010–present but discusses 1947.

The historical period is set **only when a collection is principally
about one bounded event** that its own title or summary names — the
Holocaust, the Korean War, the 1994 genocide against the Tutsi, the
1947–54 Jeju uprising. The years are those stated in the summary or, when
the summary names the event without dates, the event's standard dates.
Every event → years mapping, and every record considered but left blank,
is listed in [`docs/HISTORICAL-PERIODS.md`](docs/HISTORICAL-PERIODS.md) so
a curator can check it. Most records have no value: life-history,
folklore, and multi-event collections are not reduced to a date range, and
a blank means “not derived”, not “no historical focus”.

Filtering by decade still filters by **recording** period only. The record
panel shows the "Recording period" and, when present, the "Period
discussed" separately.

## 9. How duplicates are handled

- The same collection is recorded **once**. Duplicates are detected by
  canonical URL and by identical title + institution, both enforced by the
  validator.
- One institution may appear several times when it holds genuinely
  distinct collections with their own pages.
- When the same recordings are held in two places (e.g. a project and its
  deposit at a national library), one record is made for the collection,
  naming the primary public-facing holder; the other is mentioned in
  `summary` or `access_notes`.
- If two records are found to describe the same collection, one is kept;
  the other's `mv_id` is retired (never reused) and noted in the changelog.

## 10. How corrections are made

- **Anyone can report a correction** — a wrong field, a dead link, a
  misdescription, a naming problem — via the correction issue form or a
  pull request. Corrections are as valuable as new records.
- **Custodians' corrections take priority.** When a holding institution or
  a community with standing over a collection asks for a change, or for a
  record to be removed, that request is honoured.
- Corrections change the record in place; `mv_id` never changes.
- Records whose source disappears become `unavailable` rather than being
  silently deleted.
- Every release lists additions, removals, corrections, vocabulary changes,
  and broken-source changes in `CHANGELOG.md`.

## 11. Ethics and representation

- **Mapping an archive does not grant permission to reproduce or
  redistribute its contents.** Records link to the holder, whose access
  conditions govern everything behind the link. The dataset contains
  metadata only.
- **Discoverability is not exposure.** Collections of testimony about
  genocide, detention, displacement, and violence are sensitive. Records
  describe collections at the level their custodians already publish; they
  never name narrators or quote testimony.
- **Community and Indigenous governance.** Where a collection is governed
  by, or belongs to, a community, that governance takes precedence over
  this project's completeness.
- **Geographic representation is uneven** (see §0), skewed toward
  institutions with English-language web presences. This is a known bias
  of the discovery method and is reported, not hidden.
- **Metadata is not neutral.** Institutional descriptions may carry
  colonial-era naming or framing. The dataset records the holder's title
  and name as published, records alternate names, and accepts corrections.

## 12. Versioning

The dataset uses semantic-style versions recorded in
`data/dataset-meta.json`, `CITATION.cff`, and `CHANGELOG.md`. A version
bump accompanies any published change to records or vocabularies. The
open-data exports (`data/collections.csv`, `.geojson`, etc.) are generated
from the canonical files by `node scripts/build-data.mjs`, and CI fails if
they are stale.
