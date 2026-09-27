# Verification review — how to run it

This folder supports the field-by-field review that promotes records from
`partially_verified` to `verified` (METHODOLOGY.md §4). Only a person who
has opened the source page can promote a record; this workflow makes that
fast and leaves a paper trail in `data/review-log.json`.

## 1. Get a fresh worksheet

```bash
node scripts/review-worksheet.mjs                          # all unverified records
node scripts/review-worksheet.mjs --links report.md        # raise records that failed a link check
```

`--links` takes the markdown table the weekly link check posts in its
tracking issue (save the issue body to a file). Output:
`docs/review/worksheet.csv`, sorted by priority:

| Priority | Meaning |
|---|---|
| 1 | Failed the last link check, or carries a `verification_note` flag |
| 2 | `http://` URL |
| 3 | No `access_notes` yet |
| 4 | Everything else |

The committed `worksheet.csv` was generated on 2026-09-27 from the
2026-09-21 link check (63 priority-1 records). Regenerate it before you
start if the data has changed since.

## 2. Review in a spreadsheet

Open `worksheet.csv` (Excel, LibreOffice, Google Sheets). For each record,
open its `url` and fill in:

| Column | What to enter |
|---|---|
| `reviewer` | Your name |
| `review_date` | `YYYY-MM-DD` |
| `url_ok` | `yes`, `no`, or the **correct URL** if the page has moved |
| `title_ok`, `archive_ok`, `country_pin_ok`, `languages_ok`, `themes_ok`, `period_ok`, `summary_ok` | `yes` or `no` |
| `access_notes_from_source` | How the page says the collection is accessed (optional; only used if the record has none) |
| `result` | `verified`, `partially_verified`, `needs_review`, or `unavailable` |
| `reviewer_notes` | What is wrong and what it should say |

Leave `result` blank for rows you did not review; they are skipped.

## 3. Import

```bash
node scripts/apply-review.mjs docs/review/worksheet.csv --dry-run   # preview
node scripts/apply-review.mjs docs/review/worksheet.csv
node scripts/validate-data.mjs && node scripts/build-data.mjs
```

The importer sets `verification_status` and `last_reviewed`, applies a
corrected URL (and the URL inside `citation`), fills empty `access_notes`,
and logs a `field-by-field` entry per row. A row marked `verified` with any
field answered `no` is kept at `partially_verified` and listed for hand
correction in `data/collections.json` — the importer never rewrites titles,
languages, or summaries itself.

## Review log

`data/review-log.json` is append-only. Each entry records the date, record,
what was checked, the `method` (`field-by-field`, `search-based`,
`link-check`), who checked, the finding, evidence URLs, and any changes.
The 2026-09-27 entries are **search-based**: they used search-engine
results pointing at the holders' own pages because the pages themselves
could not be opened from the environment that ran the review. They
corrected dead and moved links but promoted nothing to `verified`.
