# Mapping Voices — expansion spec (v2)

Builds on `SPEC.md` (still authoritative for the base app). This covers four
parallel expansion tracks. Each track has a fixed file scope — stay inside
it, to keep tracks non-conflicting when merged.

## Non-negotiable carryover rule
**Data honesty rule from SPEC.md still applies, unchanged, and applies to
every new field too.** Real institutions, real URLs, no invented content.
If you can't verify something is real, leave it out — don't pad counts or
guess to hit a target number. Quality and honesty over quantity, always.

---

## Track 1 — Dataset expansion + richer entries
**Owns:** `data/collections.json`, `data/schema-notes.md` only.

### Scale
Grow the dataset well beyond the current 30 entries. Target at least 100
new entries (130+ total) of the same real, verified, geographically- and
thematically-diverse quality as the existing set — but this is a floor on
ambition, not a quota to pad: stop and report honestly if your confidence
in verifying entries as real starts dropping, rather than lowering the bar
to hit a number. Keep the same real geographic spread discipline as before
(don't over-cluster in any one region; keep meaningful Niger/Sahel/West
Africa representation growing alongside the rest of the world).

### New optional schema fields (add to every entry where genuinely known;
omit — do not guess — where not)
```json
{
  "citation": "string — an academic-style citation for the collection, e.g. 'Institution Name. Collection Title. Retrieved from URL.' Built only from real, publicly stated collection/institution names — never invent a formal citation format detail (DOI, access date, etc.) you can't verify.",
  "access_notes": "string — e.g. 'Freely accessible online', 'Requires institutional login', 'In-person/reading-room access only', 'Partial collection online, full collection by request'. Only state what the collection's own public page actually says.",
  "related_ids": "array of other entries' `id` values in this same dataset that are thematically or regionally related — for cross-linking. Fine to leave empty.",
  "preview_url": "string or null — ONLY set this if the archive ITSELF publicly provides an official embeddable or linkable audio/video preview or player for the collection (e.g. their own site has a 'listen' button linking to their own hosted player). NEVER link to a third-party mirror, a downloaded file, or anything not officially provided by the holding institution. Leave null for the large majority of entries — this field existing doesn't mean most entries should have it filled in; err heavily toward null when in doubt, since a wrong link here is worse than no link."
}
```
Update `data/schema-notes.md` to document these new fields for future
contributors, same style as the existing doc.

Re-run `node scripts/validate-data.mjs` — it will need updating for the new
optional fields (they're optional so a minimal old-style entry must still
pass) — see Track 1 also owns updating `scripts/validate-data.mjs` to check
the new fields' types/shapes *when present*, without requiring them.

---

## Track 2 — Contribution pipeline
**Owns:** `CONTRIBUTING.md` (new), `.github/ISSUE_TEMPLATE/` (new
directory), `.github/PULL_REQUEST_TEMPLATE.md` (new), and a short new
section in `README.md` linking to `CONTRIBUTING.md` (append only — do not
rewrite the rest of the README).

Goal: let real archives, researchers, and the public propose new
collections without needing to know Git — this project has no backend, so
the contribution path is GitHub-native:

1. A GitHub **Issue Form** (`.github/ISSUE_TEMPLATE/new-collection.yml`,
   YAML-based, structured fields matching the schema in SPEC.md / this
   file's Track 1 section: title, archive, country, coordinates,
   languages, themes, decades, summary, url, and optionally
   citation/access_notes/preview_url) — this is the low-friction path for
   someone who just knows about a collection but doesn't want to write
   JSON or open a PR.
2. `CONTRIBUTING.md` — explains both paths (the issue form, and directly
   opening a PR against `data/collections.json` for anyone comfortable
   with that), states the honesty rule plainly (real collections only,
   real URLs, cite your source), and explains that `node
   scripts/validate-data.mjs` must pass before a PR is considered.
3. `.github/PULL_REQUEST_TEMPLATE.md` — a short checklist for anyone
   opening a PR: confirms the entry is real, the validator passes, and
   asks them to link where they confirmed the institution/URL (a source,
   even an informal one like "I work there" or "found via their official
   site").

---

## Track 3 — Multilingual platform (UI, not data)
**Owns:** `index.html`, `js/app.js`, `css/style.css` (additive changes
only — do not restructure what Track 1/2 don't touch), plus a new
`locales/` directory (e.g. `locales/en.json`, `locales/ha.json` [Hausa],
`locales/fr.json` [French], `locales/ar.json` [Arabic]).

Translate the **UI chrome** — headings, labels, buttons, filter names,
status/empty-state text, the footer note — into English (default), Hausa,
French, and Arabic, with a language switcher in the header. This does NOT
mean translating each dataset entry's own summary text (that stays as
authored, in whichever language it's already in — translating 130+ pieces
of real archival description accurately is its own huge, separate effort
and out of scope here; note in the README that per-entry translation is a
future contribution area, don't attempt it).

Real technical requirements, don't skip:
- **Arabic is RTL.** Switching to Arabic must flip the document direction
  (`dir="rtl"` on `<html>`) and your CSS must actually work mirrored — test
  it, don't assume flexbox/grid "just works" reversed (it mostly does, but
  verify the specific things like icon-to-text spacing, the slide-in
  drawer's origin side, and the map's UI controls don't end up overlapping
  or backwards).
- Store the chosen language in `localStorage` so it persists across visits
  (per-browser only, that's fine and expected — no backend to share it).
- The language switcher itself must be keyboard-operable and have an
  accessible name.
- Don't hardcode English strings anywhere in the touched files once this
  is done — every UI-chrome string should come from the active locale
  file, with English as the fallback if a key is ever missing in another
  locale (log a console warning in that case, don't crash).

Verify visually (Playwright, same pattern as before) in at least English
and Arabic, at both a desktop and a 375px width, to confirm the RTL layout
doesn't break.

---

## What I'm doing separately (not a track — don't build this)
I'm drafting outreach materials (a one-pager for reaching out to real
archives/DH researchers) myself, directly, since it's a writing/design
deliverable for the user to actually send, not code. Nothing for any
agent to build here.
