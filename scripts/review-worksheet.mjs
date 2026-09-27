#!/usr/bin/env node
// Generates a review worksheet for the field-by-field verification pass
// (METHODOLOGY.md §4): one row per record not yet `verified`, highest
// priority first, with the current values to check and blank columns for
// the reviewer. Open it in any spreadsheet, check each record against its
// source page, then import results with scripts/apply-review.mjs.
//
// Priority: 1 = flagged (verification_note) or failed the last link check;
//           2 = http:// URL; 3 = missing access_notes; 4 = everything else.
//
// Usage: node scripts/review-worksheet.mjs [--links report.md] [--out file.csv]
//   --links  a markdown report from scripts/check-links.mjs; entries listed
//            in it are raised to priority 1.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toCsv } from "./lib-csv.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1];
};
const out = arg("--out") || path.join(ROOT, "docs", "review", "worksheet.csv");
const linksReport = arg("--links");

const records = JSON.parse(readFileSync(path.join(ROOT, "data", "collections.json"), "utf8"));
const log = JSON.parse(readFileSync(path.join(ROOT, "data", "review-log.json"), "utf8"));

const failedIds = new Set();
if (linksReport) {
  for (const m of readFileSync(linksReport, "utf8").matchAll(/^\| `([a-z0-9-]+)`/gm)) failedIds.add(m[1]);
}

const lastLogged = new Map();
for (const e of log.entries) lastLogged.set(e.mv_id, `${e.date} ${e.check} (${e.method}): ${e.finding}`);

const REVIEWER_COLUMNS = [
  "reviewer", "review_date", "url_ok", "title_ok", "archive_ok", "country_pin_ok",
  "languages_ok", "themes_ok", "period_ok", "summary_ok", "access_notes_from_source",
  "result", "reviewer_notes",
];
const COLUMNS = [
  "priority", "reasons", "mv_id", "title", "archive", "country", "url", "languages",
  "language_note", "themes", "decade_start", "decade_end", "access_notes",
  "verification_status", "verification_note", "last_logged_check", ...REVIEWER_COLUMNS,
];

const rows = records
  .filter((r) => r.verification_status !== "verified")
  .map((r) => {
    const reasons = [];
    if (failedIds.has(r.id)) reasons.push("failed last link check");
    if (r.verification_note) reasons.push(`flagged: ${r.verification_note}`);
    if (r.url.startsWith("http:")) reasons.push("http:// URL");
    if (!r.access_notes) reasons.push("no access_notes");
    const priority = failedIds.has(r.id) || r.verification_note ? 1 : r.url.startsWith("http:") ? 2 : !r.access_notes ? 3 : 4;
    return { ...r, priority, reasons, last_logged_check: lastLogged.get(r.mv_id) || "" };
  })
  .sort((a, b) => a.priority - b.priority || a.mv_id.localeCompare(b.mv_id));

mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, "﻿" + toCsv(COLUMNS, rows)); // BOM so Excel reads UTF-8
const counts = rows.reduce((acc, r) => ((acc[r.priority] = (acc[r.priority] || 0) + 1), acc), {});
console.log(`wrote ${path.relative(ROOT, out)}: ${rows.length} records (by priority: ${JSON.stringify(counts)})`);
