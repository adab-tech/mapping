# Mapping Voices

Mapping Voices is an interactive atlas of oral-history and voice-testimony
archives. It's a single map, filterable by country, theme, language, and
decade, that puts a pin on every collection in its dataset: click a pin (or
use the filters) and you get a plain-language summary plus a link straight
through to the real archive holding that collection.

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

`data/collections.json` holds the map's data: about 30 entries covering
real, publicly documented oral-history and voice-testimony collections, with
real institutions and a real, working link to each collection's own public
page. No fictional archives, testimonies, or recordings are included — if an
entry couldn't be verified as real, it isn't here. The set deliberately
spans every inhabited continent, with particular attention to Niger and the
wider Sahel/West Africa region (Niger's CELHTO and IRSH, Mali's Sunjata-epic
field recordings, Guinea's Sosso-Bala griot tradition, Nigeria's Ifa corpus,
Benin/Nigeria/Togo's Gelede heritage, Senegal's IFAN sound archives, Ghana's
Nketia Archives), since that region is under-represented in most general
oral-history tool demos and this project grew out of Hausa/Sahel-region
digital humanities research.

**This is a curated, illustrative starting set — not an exhaustive index.**
There are hundreds of oral-history and voice-archive collections worldwide
that aren't in here yet. See `data/schema-notes.md` for the full field
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
