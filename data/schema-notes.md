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
   uniqueness, well-formed `url`s, and non-empty arrays, and exits non-zero
   with a specific error message per problem. Fix everything it flags
   before committing.
5. If you're adding a new `theme` string, consider whether an existing one
   already covers it (a quick `grep` through the file) to avoid the filter
   UI accumulating one-off duplicates like `"oral traditions"` next to
   `"oral tradition"`.

That's it — no build step, no database migration. The frontend reads this
file directly at runtime via `fetch('data/collections.json')`.
