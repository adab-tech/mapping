---
name: add-collection
description: Add one real oral-history or voice-testimony collection to data/collections.json the Mapping Voices way — next MV- id, controlled vocabularies, honest verification status and provenance, review-log entry, regenerated exports. Use when asked to "add", "list", or "put on the map" a specific collection, or to turn a new-collection issue into a record.
---

# Add a collection

Rules that override everything below: METHODOLOGY.md §1 (inclusion) and the
honesty rule — never invent a field. Omit what the source doesn't support.

1. **Confirm it qualifies** (METHODOLOGY §1–2): recorded human voice; real
   holder; the holder's own public page. Search for duplicates first:
   `grep -i "<name>" data/collections.json` and by URL host.
2. **Gather facts** from the holder's page (WebFetch; if blocked, WebSearch
   results pointing at the holder's own pages — then the record stays
   `partially_verified` and the method is `search-based`). Need: title,
   holder, place (city), languages *as the source states them*, what it
   documents, start/end years, access conditions.
3. **Write the record** — field reference: DATA_DICTIONARY.md §2.
   - `mv_id`: next unused (`node -e 'const d=require("./data/collections.json");console.log(Math.max(...d.map(r=>+r.mv_id.slice(3)))+1)'`).
   - `country`, `languages`, `themes` must be terms in `data/vocab/`. Add a
     missing language (with ISO 639-3) or theme (with group + scope note)
     to the vocab in the same change. Never infer languages from geography;
     use `Multiple languages` + `language_note` with the source's wording.
   - Pin: city-level; subject-country rule in METHODOLOGY §5.
   - `citation`: `"<archive>. <title>. Retrieved from <url>."`
   - `verification_status`: `partially_verified` unless a person checked
     every core field against the open source page (then `verified` +
     `last_reviewed`). Flag inferred fields in `verification_note`.
   - `provenance`: how it was found (issue number, contributor, search).
   - `date_added`: today. Keep the canonical key order (see existing records).
   - `related_ids`: only genuine relations; add the reverse link too.
4. **Log it**: append to `data/review-log.json` —
   `{date, mv_id, check:"new record", method, reviewer, finding, evidence:[urls], changes:null, outcome:"added"}`.
5. **Check and build**:
   ```bash
   node scripts/validate-data.mjs && node --test tests/*.test.mjs
   node scripts/build-data.mjs && node scripts/build-data.mjs --check
   ```
6. Add a line under `## [Unreleased]` in CHANGELOG.md (create the section
   if missing). Commit with a message naming the MV- id.
