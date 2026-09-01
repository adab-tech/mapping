# Contributing to Mapping Voices

Mapping Voices is meant to grow into a real, community-sustained atlas of
oral-history and voice-testimony collections — which means there needs to be
a low-friction way to propose new ones, whether or not you're comfortable
with Git or JSON. There are two paths in. Pick whichever fits you.

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
2. Add a new object to the array in `data/collections.json`, following the
   schema. Full field-by-field reference, including what `country`/`lat`/
   `lng` should point to when the collection's cultural subject differs
   from its physical holding institution: [`data/schema-notes.md`](data/schema-notes.md).
3. Pick a new `id` in kebab-case that isn't already used.
4. Run the validator and fix everything it flags:
   ```bash
   node scripts/validate-data.mjs
   ```
   This is a zero-dependency Node script — no `npm install` needed — and it
   must pass before a PR is considered. The same check runs in CI on every
   push.
5. Open a PR. Fill in the pull request template, including where you
   confirmed the institution/URL is real.

## Schema quick reference

The full field-by-field reference lives in [`data/schema-notes.md`](data/schema-notes.md)
— worth reading before you add or propose an entry. In short, each entry
needs a stable kebab-case `id`, the collection's real `title` and holding
`archive`, a `country` + `lat`/`lng` pin, non-empty `languages` and `themes`
arrays, a `decade_start`/`decade_end`, and a plain-language `summary`, and a
real `url`. A few fields (`citation`, `access_notes`, `preview_url`) are
optional — fill them in only where genuinely known and, for `preview_url`
especially, only when the archive itself officially provides the link; leave
optional fields out entirely rather than guess.

## Other ways to help

Translation of the site's UI chrome (not the dataset entries themselves) is
tracked separately — see the README for the current state of that effort.
Per-entry translation of collection summaries is a large, separate effort
and out of scope for now.

Questions? Open an issue, or start a discussion if the repo has one enabled.
