#!/usr/bin/env node
// Imports a completed review worksheet (from scripts/review-worksheet.mjs).
//
// For each row whose `result` is filled in, this:
//  - sets `verification_status` to the result and `last_reviewed` to
//    `review_date`;
//  - replaces `url` (and the URL inside `citation`) when `url_ok` holds a
//    new http(s) URL, and fills `access_notes` from
//    `access_notes_from_source` when the record has none;
//  - clears `verification_note` when the result is `verified`, or replaces
//    it with the fields the reviewer marked wrong;
//  - appends a `field-by-field` entry to data/review-log.json.
//
// Any column answered "no" (other than url_ok with a new URL) is a field
// the reviewer says is wrong: the row is NOT promoted to `verified`, and
// the fields are listed so the correction can be made by hand in
// data/collections.json. Run the validator and build-data afterwards.
//
// Usage: node scripts/apply-review.mjs docs/review/worksheet.csv [--dry-run]

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./lib-csv.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
if (!file) {
  console.error("Usage: node scripts/apply-review.mjs <worksheet.csv> [--dry-run]");
  process.exit(2);
}

const STATUSES = ["verified", "partially_verified", "needs_review", "unavailable"];
const CHECK_COLUMNS = ["title_ok", "archive_ok", "country_pin_ok", "languages_ok", "themes_ok", "period_ok", "summary_ok"];
const isNo = (v) => /^\s*(n|no|false|0)\s*$/i.test(v || "");
const isUrl = (v) => /^https?:\/\/\S+$/i.test((v || "").trim());

const dataPath = path.join(ROOT, "data", "collections.json");
const logPath = path.join(ROOT, "data", "review-log.json");
const records = JSON.parse(readFileSync(dataPath, "utf8"));
const log = JSON.parse(readFileSync(logPath, "utf8"));
const byMv = new Map(records.map((r) => [r.mv_id, r]));

let applied = 0;
const todo = [];
const problems = [];

for (const row of parseCsv(readFileSync(file, "utf8"))) {
  const result = (row.result || "").trim();
  if (!result) continue;
  const rec = byMv.get(row.mv_id);
  const ctx = `${row.mv_id} (${row.title})`;
  if (!rec) { problems.push(`${ctx}: no such record`); continue; }
  if (!STATUSES.includes(result)) { problems.push(`${ctx}: result "${result}" must be one of ${STATUSES.join(", ")}`); continue; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.review_date || "")) { problems.push(`${ctx}: review_date must be YYYY-MM-DD`); continue; }
  if (!(row.reviewer || "").trim()) { problems.push(`${ctx}: reviewer is required`); continue; }

  const wrong = CHECK_COLUMNS.filter((c) => isNo(row[c]));
  if (isNo(row.url_ok)) wrong.push("url_ok");
  let status = result;
  if (status === "verified" && wrong.length) {
    status = "partially_verified";
    todo.push(`${ctx}: reviewer marked ${wrong.join(", ")} as wrong — correct by hand, then re-review. Notes: ${row.reviewer_notes || "(none)"}`);
  }

  const changes = {};
  const set = (field, value) => {
    if (JSON.stringify(rec[field]) === JSON.stringify(value)) return;
    changes[field] = { from: rec[field] ?? null, to: value ?? null };
    if (value === undefined) delete rec[field]; else rec[field] = value;
  };
  if (isUrl(row.url_ok) && row.url_ok.trim() !== rec.url) {
    const before = rec.url;
    set("url", row.url_ok.trim());
    if (typeof rec.citation === "string") set("citation", rec.citation.split(before).join(rec.url));
  }
  if (!rec.access_notes && (row.access_notes_from_source || "").trim()) set("access_notes", row.access_notes_from_source.trim());
  set("verification_status", status);
  set("last_reviewed", row.review_date);
  // The review supersedes any earlier flag: clear it when verified, or
  // replace it with what this reviewer found wrong.
  if (status === "verified") set("verification_note", undefined);
  else if (wrong.length) {
    set("verification_note", `Review ${row.review_date}: ${wrong.join(", ")} marked wrong.${row.reviewer_notes ? " " + row.reviewer_notes.trim() : ""}`);
  }

  log.entries.push({
    date: row.review_date, mv_id: rec.mv_id, check: "field-by-field", method: "field-by-field",
    reviewer: row.reviewer.trim(),
    finding: [wrong.length ? `Fields marked wrong: ${wrong.join(", ")}.` : "All core fields confirmed against the source.", row.reviewer_notes].filter(Boolean).join(" "),
    evidence: [rec.url], changes: Object.keys(changes).length ? changes : null,
    outcome: status,
  });
  applied++;
}

if (problems.length) {
  console.error(`Not applied — fix these rows first:\n${problems.map((p) => "  - " + p).join("\n")}`);
  process.exit(1);
}
if (!dryRun) {
  writeFileSync(dataPath, JSON.stringify(records, null, 2) + "\n");
  writeFileSync(logPath, JSON.stringify(log, null, 2) + "\n");
}
console.log(`${dryRun ? "[dry run] would apply" : "applied"} ${applied} review(s).`);
if (todo.length) console.log(`\nNeeds hand correction:\n${todo.map((t) => "  - " + t).join("\n")}`);
if (!dryRun && applied) console.log("\nNext: node scripts/validate-data.mjs && node scripts/build-data.mjs");
