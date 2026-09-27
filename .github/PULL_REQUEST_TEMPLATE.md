## What's in this PR

<!-- Briefly describe the collection(s) you're adding or changing, with their MV- identifiers. -->

## Checklist

- [ ] The entry/entries added or changed here describe a **real, publicly
      documented** collection that meets the
      [inclusion criteria](https://github.com/adab-tech/mapping/blob/main/METHODOLOGY.md#1-what-qualifies-for-inclusion)
      — real institution, real holding, real URL. Nothing is invented or
      guessed.
- [ ] New records have the next unused `mv_id`; existing `mv_id`s are unchanged.
- [ ] `languages`, `themes`, and `country` use terms from `data/vocab/`
      (any new term is added there in this PR, with its ISO code or theme
      group).
- [ ] `verification_status` and `provenance` are set honestly.
- [ ] `node scripts/validate-data.mjs` passes.
- [ ] `node scripts/build-data.mjs` has been run and the regenerated
      exports are committed.

## Where I confirmed this is real

<!--
Doesn't need to be formal — a paper trail is the point, not gatekeeping.
Examples: "I work at this institution," "found via their official site,"
"cited in [paper/book]," "confirmed by emailing the archive directly." -->
