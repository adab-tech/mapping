---
name: release-dataset
description: Cut a new Mapping Voices dataset version — bump the version everywhere it appears, finalize the CHANGELOG, refresh counts, rebuild exports, and run every check. Use for "release", "bump the version", "cut v0.x".
---

# Release the dataset

1. Pick the version (semantic: new records/fields → minor; corrections only → patch).
2. Update **every** place the version or counts appear — find them with:
   ```bash
   grep -rn "0\.[0-9]\.[0-9]" --include=*.md --include=*.html --include=*.cff --include=*.json . \
     | grep -v "data/\(collections\|languages\|themes\|countries\|stats\|review-log\)"
   ```
   Always: `data/dataset-meta.json` (version, released), `CITATION.cff`
   (version, date-released), `index.html` JSON-LD (version, dateModified),
   `about.html` fallback figures and citation, `README.md` headline counts
   and citation, `DATA_DICTIONARY.md` schema line, `PROJECT.md` status.
   Counts come from `node scripts/build-data.mjs && node -e 'console.log(require("./data/stats.json").totals)'`.
3. CHANGELOG: rename `[Unreleased]` to `[x.y.z] — YYYY-MM-DD — <title>`,
   grouped as Dataset (additions, removals, corrections, broken-source
   changes, taxonomy), Atlas, Tooling.
4. Rebuild and run everything:
   ```bash
   node scripts/build-data.mjs
   node scripts/validate-data.mjs && node --test tests/*.test.mjs \
     && node scripts/build-data.mjs --check && node scripts/validate-locales.mjs
   ```
5. Run the `site-audit` skill if UI changed. Commit "Release dataset vx.y.z".
6. After merge, `.github/workflows/release.yml` creates the GitHub release
   `v<version>` automatically (notes from the CHANGELOG section, via
   `scripts/release-notes.mjs`). With the Zenodo–GitHub integration on,
   Zenodo archives it and mints a DOI (metadata in `.zenodo.json`). Once the
   user reports the DOI, update `data/dataset-meta.json` → `doi`
   (`version`, `version_doi`, `version_url`; the concept DOI stays the same), CITATION.cff (`doi:` / `identifiers`), the README
   badge and citation, the About page citation, and the `identifier` in the
   index.html JSON-LD; then `node scripts/build-data.mjs`. The release
   workflow re-runs on that commit and does nothing (the release exists).
