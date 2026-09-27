# Contributing to Mapping Voices

Mapping Voices is meant to grow into a real, community-sustained atlas of
oral-history and voice-testimony collections — which means there needs to be
a low-friction way to propose new ones, whether or not you're comfortable
with Git or JSON. There are two paths in. Pick whichever fits you.

All project spaces — issues, pull requests, discussions, code review — are
governed by [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Short version: be
respectful, be honest, treat disagreements about a collection's description
as a content question, not a personal one.

## The honesty rule (read this first)

Every entry in this project must describe a **real, publicly documented**
collection: a real institution, a real holding, and a real, working URL to
the collection's or archive's own public page. Do not invent or guess at
fictional testimonies, recordings, archives, or metadata. If you can't
verify something is real, leave it out — don't pad a field just to fill it
in. This applies to every field, including the newer optional ones
(`citation`, `access_notes`, `preview_url`).

When you contribute, please note **where you confirmed** the institution or
URL is real — an informal source is completely fine (e.g. "I work there,"
"found via their official site," "cited in [some paper]"). The point is a
paper trail, not gatekeeping.

## Corrections count as much as new entries

Spotted a wrong detail, a dead link, a naming problem, or a record that
shouldn't be listed? [Open a **correction** issue][correction-issue] — give
the record's identifier (e.g. `MV-000023`, shown in its panel in the atlas)
and what should change. If you work for the holding institution, or belong
to a community with standing over a collection, say so: custodians'
requests take priority, including requests for removal. See
[`METHODOLOGY.md` §10](METHODOLOGY.md#10-how-corrections-are-made).

[correction-issue]: ../../issues/new?template=correction.yml

## Path 1: Open an issue (no Git or JSON needed)

If you know about a collection that should be on the map but don't want to
touch code, [open a **new collection** issue][new-collection-issue]. It's a
structured form — fill in what you know (title, archive, country,
coordinates, languages, themes, decades, summary, URL, and a few optional
fields), confirm the honesty checkbox, and submit. A maintainer will turn it
into a proper data entry from there.

[new-collection-issue]: ../../issues/new?template=new-collection.yml

## Path 2: Open a pull request directly

If you're comfortable with Git and JSON, you can add the entry yourself:

1. Confirm the collection is real (see the honesty rule above).
2. Add a new object to the array in `data/collections.json`. Every field
   is defined in [`DATA_DICTIONARY.md`](DATA_DICTIONARY.md); how to choose
   values (where the pin goes, which languages and themes) is in
   [`METHODOLOGY.md`](METHODOLOGY.md).
3. Give it a new kebab-case `id` and the **next unused `mv_id`**
   (`MV-000211`, …). Never change an existing `mv_id`.
4. Use only terms from the controlled vocabularies in
   [`data/vocab/`](data/vocab/) for `country`, `languages`, and `themes`.
   If a language or theme is genuinely missing, add it to the vocabulary
   file in the same PR. Don't guess individual languages from a country: if
   the source says "many Ghanaian languages", use `Multiple languages` and
   put the source's wording in `language_note`.
5. Set `verification_status` honestly (usually `partially_verified`) and
   say in `provenance` how you found the collection.
6. Run the checks and regenerate the exports:
   ```bash
   node scripts/validate-data.mjs
   node scripts/build-data.mjs
   ```
   Both are zero-dependency Node scripts — no `npm install` needed. The
   validator must pass, and the regenerated `data/*.csv|geojson|json`
   exports must be committed; CI checks both.
7. Open a PR. Fill in the pull request template, including where you
   confirmed the institution/URL is real.

## Schema quick reference

Each record needs: `mv_id`, `id`, `title`, `archive`, `country`, `lat`/`lng`,
non-empty `languages` and `themes` (from the vocabularies), `decade_start`/
`decade_end`, a plain-language `summary`, a real `url`,
`verification_status`, and `provenance`. `citation`, `access_notes`,
`related_ids`, `preview_url`, `language_note`, and `verification_note` are
optional — fill them in only where genuinely known, and leave them out
rather than guess. Full reference: [`DATA_DICTIONARY.md`](DATA_DICTIONARY.md).

## Other ways to help

Translation of the site's UI chrome (not the dataset entries themselves) is
tracked separately — see the README for the current state of that effort.
Per-entry translation of collection summaries is a large, separate effort
and out of scope for now.

Questions? Open an issue, or start a discussion if the repo has one enabled.
