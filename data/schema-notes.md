# `collections.json` schema notes

`data/collections.json` is a single JSON array. Each element describes one
real, publicly documented oral-history / voice-testimony collection and has
this shape:

```json
{
  "id": "celhto-oral-tradition-archive",
  "title": "CELHTO Oral Tradition Archive",
  "archive": "Centre d'Etudes Linguistiques et Historiques par Tradition Orale (African Union)",
  "country": "Niger",
  "lat": 13.5127,
  "lng": 2.1128,
  "languages": ["Hausa", "Zarma", "Fulfulde", "Tamasheq", "French"],
  "themes": ["oral tradition", "history", "linguistics"],
  "decade_start": 1968,
  "decade_end": null,
  "summary": "An African Union research center based in Niamey since 1968 ...",
  "url": "https://www.celhto.org/"
}
```

## Field reference

| Field           | Type              | Notes |
|-----------------|-------------------|-------|
| `id`            | string            | kebab-case, unique across the whole file. Used as the map/DOM key, so keep it stable once published — don't rename an existing `id` just to tidy it. |
| `title`         | string            | The collection's real name (or the name of the specific archive/fonds if the institution holds several). |
| `archive`       | string            | The real name of the holding institution. |
| `country`       | string            | A common-name country string (e.g. `"Niger"`, `"United States"`), not an ISO code. See "What does `country`/`lat`/`lng` point to?" below. |
| `lat`, `lng`    | number            | Decimal degrees. `lat` in `[-90, 90]`, `lng` in `[-180, 180]`. This is the map pin location. |
| `languages`     | array of strings  | Non-empty. Languages the recordings/materials are actually in. |
| `themes`        | array of strings  | Non-empty. Free-text tags used for filtering (e.g. `"migration"`, `"oral tradition"`, `"women's history"`). Reuse existing theme strings where the topic genuinely matches, so the filter list doesn't fragment into near-duplicates. |
| `decade_start`  | integer           | Year the collection/recording effort began. |
| `decade_end`    | integer or `null` | Year it ended, or `null` if the collection is still actively growing. |
| `summary`       | string            | 1-3 plain-language sentences on what the collection actually contains. No hype, no invented detail. |
| `url`           | string            | A real, working URL to the collection's or archive's actual public page. Must be `http(s)`. |
| `citation`      | string, optional  | An academic-style citation for the collection. See "Optional fields" below. |
| `access_notes`  | string, optional  | How the collection is actually accessed. See "Optional fields" below. |
| `related_ids`   | array of strings, optional | Cross-links to other entries' `id` values. See "Optional fields" below. |
| `preview_url`   | string or `null`, optional | The archive's own official embeddable/linkable player, if it has one. See "Optional fields" below. |

## Optional fields (`citation`, `access_notes`, `related_ids`, `preview_url`)

These four fields were added in the dataset-expansion pass and are all
**optional** — the validator accepts entries that omit any or all of them
(a minimal old-style entry with only the required fields above still
passes). Add them only where you can genuinely support them; do not guess
to fill them in, and do not feel obligated to add all four to every entry.

```json
{
  "citation": "Institut kurde de Paris. Retrieved from https://www.institutkurde.org/.",
  "access_notes": "Freely accessible online.",
  "related_ids": ["celhto-oral-tradition-archive", "sahel-sounds-field-recordings"],
  "preview_url": null
}
```

- **`citation`** — an academic-style citation built only from the
  collection/institution names and URL you've already verified for the
  required fields, e.g. `"Institution Name. Collection Title. Retrieved
  from URL."`. Never invent a citation-format detail you can't verify (a
  DOI, a specific access date, an edition number, etc.) — the safe,
  mechanical version above is fine and is what most entries in this file
  use.
- **`access_notes`** — a short, plain-language note on how the collection
  is actually reached, e.g. `"Freely accessible online"`,
  `"Requires institutional login"`, `"In-person/reading-room access only"`,
  or `"Partial collection online, full collection by request"`. Base this
  only on what the archive's own public page actually says (or what you
  directly observed while researching the entry) — don't assume a default.
- **`related_ids`** — an array of other entries' `id` values in this same
  file that are thematically or regionally related, for cross-linking in
  the UI. Every id you list must resolve to a real entry in the file (the
  validator checks this) and must not be the entry's own id. It's fine to
  leave this empty or omit it — don't force a relation that isn't real.
- **`preview_url`** — set this **only** when the archive's own public page
  itself offers an embeddable or linkable audio/video player for the
  collection (e.g. their site has its own "listen" or "watch" page with a
  working player). Never point this at a third-party mirror, a downloaded
  file, or a site that only describes the collection without playing it.
  Leave it `null` (or omit it) for the large majority of entries — this
  field existing is not an invitation to fill it in everywhere, and a wrong
  or misleading preview link is worse than no `preview_url` at all.

## What does `country` / `lat` / `lng` point to?

For most entries the holding institution and the cultural/geographic subject
of the collection are the same place, and `country`/`lat`/`lng` just point at
the institution.

For a handful of entries they differ — for example, a Malian griot epic
recorded by a linguist and archived at a US university library, or a Yoruba
oral tradition that UNESCO has inscribed on its heritage list. In those
cases `country`/`lat`/`lng` point at the collection's cultural/geographic
**subject** (so the pin lands where the voices are actually from), while the
`archive` field still names the real, physical holding institution. This
keeps the map organized around "where these voices come from" rather than
"which building the tapes are stored in," which is what the app is for.

## Adding a new entry

1. Confirm the collection is **real** — a real institution, a real holding,
   and a real URL you can point to (the collection's or archive's own public
   page, not a secondary write-up about it). Do not add anything you can't
   verify. If you're unsure, leave it out — see the "Data honesty rule" in
   `SPEC.md`.
2. Append a new object to the array in `data/collections.json`, following
   the field reference above. Keep the file valid JSON (comma-separated,
   no trailing comma after the last element).
3. Pick a new `id` in kebab-case that isn't already used.
4. Run the validator:
   ```bash
   node scripts/validate-data.mjs
   ```
   It checks required fields, numeric ranges for `lat`/`lng`, `id`
   uniqueness, well-formed `url`s, non-empty arrays, and — when present —
   the shape of the four optional fields above (including that every
   `related_ids` entry resolves to a real `id` elsewhere in the file). It
   exits non-zero with a specific error message per problem. Fix everything
   it flags before committing.
5. If you're adding a new `theme` string, consider whether an existing one
   already covers it (a quick `grep` through the file) to avoid the filter
   UI accumulating one-off duplicates like `"oral traditions"` next to
   `"oral tradition"`.

That's it — no build step, no database migration. The frontend reads this
file directly at runtime via `fetch('data/collections.json')`.
