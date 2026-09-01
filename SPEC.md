# Mapping Voices — build spec

## What this is
A static, client-side web app (no backend, no build step, deployable via GitHub Pages)
that lets people explore oral-history / voice-testimony collections on an interactive
map — filterable by country, theme, language, and decade.

## The 5 Ws (why this exists)
- **Who**: digital humanities researchers, oral historians, students, and the public
  interested in oral history and voice-testimony archives.
- **What**: an interactive atlas — a world map with pins for real, publicly documented
  oral-history/voice-archive collections; click a pin (or use the filters) to see a
  summary and a link to the actual source archive.
- **When**: now — no tool like this exists in this account, and it directly serves
  active digital-humanities/oral-history research interests.
- **Where**: a standalone static web app, deployed on GitHub Pages.
- **Why**: oral history and voice-testimony collections are scattered across dozens of
  institutional archives with no shared, geographic way to browse what exists — this
  gives that a single entry point.

## Data honesty rule (important)
The seed dataset must describe **real, publicly documented oral-history/voice-archive
collections** (e.g. national sound archives, university oral history projects, UNESCO-
listed oral tradition collections, StoryCorps, etc.) with accurate metadata and a real
link to the actual collection/archive page. Do not invent fictional testimonies,
recordings, or archives. It's a *seed/demo dataset* meant to make the tool immediately
useful and honest, not an exhaustive index — the README must say so explicitly and
explain how to add more entries.

## Data schema (`data/collections.json`)
A JSON array of objects, each shape:
```json
{
  "id": "string, kebab-case, unique",
  "title": "string — the collection's real name",
  "archive": "string — the holding institution's real name",
  "country": "string — ISO-ish common name, e.g. 'Niger', 'United States'",
  "lat": "number",
  "lng": "number",
  "languages": ["array of strings, e.g. ['Hausa', 'French']"],
  "themes": ["array of strings, e.g. ['migration', 'oral tradition', 'women's history']"],
  "decade_start": "number, e.g. 1990",
  "decade_end": "number or null if ongoing",
  "summary": "1-3 sentences, plain language, on what the collection actually contains",
  "url": "string — a real, working URL to the collection or archive's public page"
}
```
Aim for ~25-30 entries with real geographic and thematic spread — don't cluster
everything in one region. Include several African/Sahel-region entries (Niger and
neighboring countries) alongside collections from other continents, since that region
is currently under-represented in most general "oral history" tool demos.

## Frontend contract
The frontend reads `data/collections.json` via `fetch('data/collections.json')` — a
plain relative path, no build step, works both locally (via any static server) and on
GitHub Pages. Do not hardcode the dataset into the JS/HTML.

## File layout (fixed — do not deviate, this is how the two build tracks stay non-conflicting)
```
index.html
css/style.css
js/app.js
data/collections.json
data/schema-notes.md      (short doc: how to add a new entry)
.github/workflows/deploy-pages.yml
README.md
scripts/validate-data.mjs (Node, zero-dependency, checks collections.json against the schema)
```

## Design direction
Editorial, atlas-like — not a generic SaaS dashboard. Think: a printed atlas or a
research archive's reading room, rendered for the web. A serif display face for
titles, a neutral sans for UI chrome. Muted, paper-like background tones (not stark
white, not dark-mode-first) with one confident accent color for map pins/active
states. Real typographic hierarchy. The map is the hero — everything else (filters,
detail panel) supports it without competing with it.

## Map library
Use Leaflet.js loaded from a CDN (no API key required, unlike Google Maps) with the
OpenStreetMap tile layer (free, no key, attribution required per their terms — include
it, it's a one-line requirement).

## Accessibility & responsiveness
- Filters and the detail panel must be fully keyboard-operable.
- Map pins need accessible labels (not just visual markers).
- Must work down to a 375px-wide mobile viewport: map on top, filters/detail panel
  stack below or slide in as a drawer — your call on the exact pattern, but no
  horizontal overflow at any width.

## Deployment
`.github/workflows/deploy-pages.yml` — a GitHub Actions workflow using
`actions/upload-pages-artifact` + `actions/deploy-pages` to publish the repo root
(or a `/docs` folder if you prefer — pick one and be consistent with the file layout
above) to GitHub Pages on every push to `main`. No build step needed since this is
plain HTML/CSS/JS.
