---
name: verify-records
description: Run the field-by-field verification workflow — generate the prioritized review worksheet, or import a completed one so records become verified. Use for "verification pass", "review worksheet", "import my review", "promote records to verified".
---

# Verify records

Only a **person who opened the source page** can make a record `verified`
(METHODOLOGY §4). Claude can prepare and import, not verify. Full guide:
docs/review/README.md.

**Prepare** a worksheet (optionally raising link-check failures):
```bash
# save the body of the latest "Broken links detected" issue to /tmp/links.md if relevant
node scripts/review-worksheet.mjs [--links /tmp/links.md]
```
Hand the user `docs/review/worksheet.csv` and the column guide from
docs/review/README.md §2.

**Import** a completed worksheet the user provides:
```bash
node scripts/apply-review.mjs <file.csv> --dry-run    # show what would change
node scripts/apply-review.mjs <file.csv>
node scripts/validate-data.mjs && node scripts/build-data.mjs
```
Rows with fields marked `no` stay `partially_verified` and are listed for
hand correction — make those corrections in data/collections.json only from
the reviewer's notes, log them, and ask the reviewer to confirm. Report how
many records are now verified (`data/stats.json` → `by_verification_status`).
