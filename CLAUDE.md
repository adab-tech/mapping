# Mapping Voices — notes for Claude sessions

Static, no-build atlas (plain HTML/CSS/JS + Leaflet) over an open dataset of
oral-history collections. The research contribution is the metadata, so
data integrity outranks everything else.

## Ground rules
- **Honesty rule:** never invent metadata. Omit fields the source doesn't
  support; flag inferences in `verification_note`. Details: METHODOLOGY.md.
- Only a person who opened the source page can make a record `verified`.
  Search-based checks may correct links but never promote.
- Every data change is logged in `data/review-log.json` and made through a
  reproducible script in `scripts/migrations/` when it touches many records.
- `mv_id`s are permanent; never renumber or reuse. Never delete a record
  whose source disappears — mark it `unavailable`.
- Counts describe the indexed dataset, not oral history in the world.

## Checks (run before every commit)
```bash
node scripts/validate-data.mjs && node --test tests/*.test.mjs
node scripts/build-data.mjs --check     # run without --check to regenerate exports
node scripts/validate-locales.mjs       # UI strings exist in en, ha, fr, ar
```

## Quick actions (project skills in .claude/skills/)
| Skill | Use for |
|---|---|
| `add-collection` | Add one collection correctly |
| `triage-leads` | Work the review queue; fans out to parallel subagents |
| `verify-records` | Generate / import the field-by-field review worksheet |
| `fix-broken-links` | Follow up the weekly link-check issue |
| `release-dataset` | Bump version everywhere, finalize CHANGELOG, rebuild |
| `site-audit` | Browser + accessibility audit (tests/browser/audit.mjs) |

## Environment notes
- The Leaflet CDN, map tiles, and many archive sites may be unreachable from
  cloud sessions; WebSearch usually works. `npm pack` works for fetching
  packages into a scratch dir. Chromium is at /opt/pw-browsers.
- UI strings: add every new key to all four `locales/*.json` files with real
  translations.
