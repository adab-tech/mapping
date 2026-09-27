---
name: triage-leads
description: Research open leads in docs/review-queue.csv (or a list the user gives) and resolve each one — add as a record, mark duplicate, out of scope, curator decision, or needs URL. Fans out to parallel subagents for batches. Use for "work the review queue", "triage leads", "process these suggestions".
context: fork
agent: general-purpose
---

# Triage leads

**Input:** open rows in `docs/review-queue.csv` (column `triage_2026_09_27`
starts with `open:`), or a list from the user. Prefer leads that improve
coverage outside the US/UK — the dataset is skewed (see docs/AUDIT.md §5).

## Delegate in batches

For more than ~5 leads, split them into batches of 4–6 and spawn one
general-purpose subagent per batch **in parallel**. Give each the lead rows
and these instructions, and ask for JSON back — do not let subagents edit
files (avoids conflicts):

```json
{"collection": "...", "outcome": "add|duplicate|out of scope|curator decision|needs URL",
 "reason": "...", "evidence": ["https://..."],
 "record": { /* full draft record per DATA_DICTIONARY §2, only when outcome=add */ }}
```

Each subagent: check duplicates against data/collections.json; apply the
inclusion rules (METHODOLOGY §1–2); research with WebSearch/WebFetch; draft
records only from what the holder's pages support; mark inferred languages
or unknown years in `verification_note`; never guess a URL.

## Merge (main context)

1. Review every draft adversarially: is the URL the holder's own page? Is
   any field unsupported? Downgrade to `curator decision` when unsure.
2. Apply with a migration script in `scripts/migrations/<date>-queue-*.mjs`
   (pattern: `2026-09-27-queue-additions.mjs`): assign sequential `mv_id`s,
   add vocab terms, reciprocal `related_ids`, review-log entries (method
   `search-based` unless pages were opened), and write outcomes into a new
   `triage_<date>` column of docs/review-queue.csv.
3. `node scripts/validate-data.mjs && node --test tests/*.test.mjs && node scripts/build-data.mjs`
4. CHANGELOG `[Unreleased]`; commit. Report counts per outcome.

Sensitive collections (trauma, legal proceedings, community-governed
material) go to `curator decision` with the reason — METHODOLOGY §11.
