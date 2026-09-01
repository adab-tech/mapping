# Mapping Voices

[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Data: CC BY 4.0](https://img.shields.io/badge/data-CC%20BY%204.0-lightgrey.svg)](LICENSE)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Live:** [adamu.tech/mapping](https://adamu.tech/mapping/) ·
[adab-tech.github.io/mapping](https://adab-tech.github.io/mapping/) (GitHub Pages, canonical)

Mapping Voices is an open, interactive atlas of oral-history and
voice-testimony archives. It's a single map, filterable by country, theme,
language, and decade, that puts a pin on every collection in its dataset:
click a pin (or use the filters) and you get a plain-language summary plus a
link straight through to the real archive holding that collection.

It exists because oral history is scattered. National sound archives,
university folklore centers, UNESCO-listed oral-tradition programs,
grassroots memory projects, and things like StoryCorps or the Genocide
Archive of Rwanda each publish their own holdings on their own site, with no
shared, geographic way to see what's out there across all of them at once.
This project is a single entry point for browsing that landscape spatially —
built for digital humanities researchers, oral historians, students, and
anyone else curious about oral history and voice-testimony archives, and
useful today because nothing like it currently exists. It's a standalone
static web app, deployed on GitHub Pages, with no backend and no build step.

## For institutions, researchers & universities

If your archive, department, or project holds or knows of real oral-history
or voice-testimony collections, this project genuinely needs you — not as a
one-time favor, but as an ongoing source. A handful of ways to help, in
order of how much time they take:

- **Point us at what's missing.** A list of collections, a regional index
  your department maintains, a bibliography — even an informal one. We'll
  do the entry-writing, sourced and credited back to you.
- **Tell us where an entry gets your own institution wrong.** An outdated
  link, a misdescribed collection, a detail you'd phrase differently.
  Corrections are exactly as valuable as new entries.
- **Add entries yourself** — via the no-Git-required issue form or a direct
  pull request, whichever fits how your team already works. See
  [Contributing](#contributing) below.
- **Point your students at it.** Verifying and adding a real collection is
  a genuinely useful small research-methods exercise, and it's how a good
  chunk of open cultural-heritage data gets built in practice.

Every entry credits and links back to the real holding institution — this
project never re-hosts or claims ownership of anyone's archive, only helps
people find it. See [License & citation](#license--citation) for how the
dataset itself is licensed, and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
for how contributors are expected to treat each other.

## Running it locally

There's no build step — it's plain HTML/CSS/JS served over `fetch()`, so any
static file server works. From the repo root:

```bash
# Python (already on most systems)
python3 -m http.server 8080

# or Node, if you have it
npx http-server -p 8080

# or PHP
php -S localhost:8080
```

Then open `http://localhost:8080`. Opening `index.html` directly via
`file://` won't work — the app fetches `data/collections.json` at runtime,
and browsers block `fetch()` against `file://` URLs.

## The seed dataset

`data/collections.json` holds the map's data: 190+ entries spanning 115+
countries across every inhabited continent — Africa, Asia, Europe, North and
South America, and Oceania all represented in real strength, not just a
token pin per continent — with real institutions and a real, working link to
each collection's own public page. No fictional archives, testimonies, or
recordings are included — if an entry couldn't be verified as real, it isn't
here. Coverage includes particular attention to Niger and the wider
Sahel/West Africa region (Niger's CELHTO and IRSH, Mali's Sunjata-epic field
recordings, Guinea's Sosso-Bala griot tradition, Nigeria's Ifa corpus,
Benin/Nigeria/Togo's Gelede heritage, Senegal's IFAN sound archives, Ghana's
Nketia Archives), since that region is under-represented in most general
oral-history tool demos and this project grew out of Hausa/Sahel-region
digital humanities research.

**This is a growing, curated set — not a finished or exhaustive index.**
There are still hundreds of oral-history and voice-archive collections
worldwide that aren't in here yet, and coverage is still uneven in specific
places even within well-represented regions — Myanmar, Laos, Panama,
Honduras, the Dominican Republic, Ecuador, Paraguay, North Macedonia,
Albania, Belarus, Zambia, Tanzania, and several Gulf states have no entry
yet, usually because a real institution exists but no verifiable, citable
archive page for it could be confirmed, not because the region lacks oral
history worth mapping. That's exactly the gap the
[institutions & researchers](#for-institutions-researchers--universities)
section above is asking for help closing. See `data/schema-notes.md` for the full field
reference and the exact steps for adding a new entry (in short: confirm it's
real, add an object matching the schema, run
`node scripts/validate-data.mjs`, and fix anything it flags before opening a
PR).

## Validating the data

```bash
node scripts/validate-data.mjs
```

Zero dependencies — plain Node built-ins only, no `npm install` needed. It
checks that every entry has its required fields, that `lat`/`lng` are real
coordinates, that every `id` is unique, that `url` is well-formed, and that
array fields aren't empty, and exits non-zero with a specific message per
problem found. The same check runs in CI on every push (via
`.github/workflows/deploy-pages.yml`) and on every pull request (via
`.github/workflows/ci.yml`, which also runs `node
scripts/validate-locales.mjs` — checks that every `locales/*.json` file
defines the same UI-chrome keys as `locales/en.json`, so a new string added
to one locale doesn't silently drift out of sync with the others).

A separate, unrelated check — `node scripts/check-links.mjs` — actually
requests every entry's `url` (and `preview_url`, where set) and reports any
that fail. This runs weekly via `.github/workflows/check-links.yml`, not on
every PR (a source rate-limiting or briefly down isn't a reason to block a
contribution), and opens or updates a tracking issue automatically when it
finds a failure, closing it again once every link passes.

## Contributing

Know about a real oral-history or voice-testimony collection that belongs on
this map? You don't need to know Git or JSON to suggest it — see
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the low-friction issue-form path, as
well as the direct pull-request path for anyone comfortable editing
`data/collections.json` themselves. Same honesty rule either way: real
institutions, real URLs, nothing invented.

## Deployment

Pushing to `main` runs `.github/workflows/deploy-pages.yml`, which validates
`data/collections.json` and then publishes the repository root to GitHub
Pages via `actions/upload-pages-artifact` and `actions/deploy-pages`. No
build step is involved.

## License & citation

The application code is MIT-licensed. The dataset in `data/collections.json`
is licensed separately under CC BY 4.0, so it stays easy to reuse in
research while crediting the project that compiled it — see `LICENSE` for
the full split and its rationale. If you use or reference this project,
`CITATION.cff` has the details (GitHub also surfaces this as a "Cite this
repository" button on the repo page).

## Project layout

```
index.html                       entry point
css/style.css                    styles
js/app.js                        map + filtering logic
locales/*.json                   UI-chrome translations (en, ha, fr, ar)
data/collections.json            the seed dataset (see above)
data/schema-notes.md             schema reference + how to add an entry
scripts/validate-data.mjs        zero-dependency data validator
scripts/validate-locales.mjs     checks locale files stay structurally in sync
scripts/check-links.mjs          weekly external-link health check
.github/workflows/deploy-pages.yml   GitHub Pages deployment
.github/workflows/ci.yml         validation on every pull request
.github/workflows/check-links.yml    weekly link-rot check
LICENSE                          code (MIT) + dataset (CC BY 4.0) licensing
CITATION.cff                     how to cite this project
```
