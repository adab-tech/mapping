---
name: fix-broken-links
description: Follow up the weekly link-check issue ("Broken links detected in data/collections.json") — separate real failures from bot blocking, find each holder's current page, correct URLs and citations, flag what can't be resolved, and log every check. Use for "fix broken links", "link rot", or when the link-check issue updates.
context: fork
agent: general-purpose
---

# Fix broken links

1. Read the open GitHub issue labelled `broken-links` in adab-tech/mapping
   (GitHub MCP `issue_read`). Save its table to a file for the worksheet.
2. Triage by result: **404 / 410 / DNS failure** = real, fix first.
   **403 / 429 / 503 / timeout** = usually bot blocking or transient; only
   investigate if it persists across two weekly runs.
3. For each real failure, find the holder's **current own page** (WebFetch;
   if blocked, WebSearch results on the holder's domain). Never substitute a
   third-party or Wikipedia page. If a collection has truly gone, set
   `verification_status: "unavailable"` with a dated `verification_note` —
   never delete the record (METHODOLOGY §10).
4. Apply with a migration script (pattern:
   `scripts/migrations/2026-09-27-source-review.mjs`): update `url`, replace
   the old URL inside `citation`, and append one `data/review-log.json`
   entry per record (check `link`, evidence URLs, changes, outcome).
5. Also move `http://` URLs to https where the same page is served there
   (the validator lists them as warnings).
6. `node scripts/validate-data.mjs && node --test tests/*.test.mjs && node scripts/build-data.mjs`;
   CHANGELOG `[Unreleased]` under "Broken-source changes"; commit.
7. Regenerate the worksheet with `--links` so unresolved records are priority 1.
