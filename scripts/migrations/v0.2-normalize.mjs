#!/usr/bin/env node
// One-shot migration to dataset v0.2.0 (metadata normalization).
//
//  1. Writes the controlled vocabularies data/vocab/{languages,themes}.json
//     from the source tables in vocab-source.mjs.
//  2. Rewrites data/collections.json so every record:
//     - has a persistent research identifier `mv_id` (MV-000001 …),
//       assigned in current file order;
//     - uses only controlled `languages` and `themes` terms, keeping the
//       original wording of any collapsed language tag in `language_note`;
//     - carries `verification_status`, `provenance`, and `date_added`
//       (the date the record first appeared in git history).
//
// Idempotent: re-running it on already-migrated data changes nothing.
// Usage: node scripts/migrations/v0.2-normalize.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LANGUAGES, LANGUAGE_RENAMES, COLLECTIVE_PATTERN, NOTE_WORTHY,
  THEME_GROUPS, THEMES, THEME_RENAMES,
} from "./vocab-source.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const p = (...parts) => path.join(ROOT, ...parts);
const writeJson = (file, value) => writeFileSync(p(file), JSON.stringify(value, null, 2) + "\n");

// ---- 1. vocabularies --------------------------------------------------

writeJson("data/vocab/languages.json", {
  $comment:
    "Controlled vocabulary for the `languages` field. `name` is the only value allowed in data/collections.json. " +
    "`iso639_3` is given only where the mapping is unambiguous (a macrolanguage code names the macrolanguage, not a variety). " +
    "`collective` terms are used only when a source names a group of languages rather than individual ones; the source wording is kept per record in `language_note`. " +
    "Language identity is never inferred from geography. See METHODOLOGY.md §6.",
  terms: LANGUAGES.map(([name, iso, type, alt]) => ({ name, iso639_3: iso, type, alt_names: alt })),
});

writeJson("data/vocab/themes.json", {
  $comment:
    "Controlled thematic taxonomy for the `themes` field. `name` is the only value allowed in data/collections.json; `group` is the top-level heading. " +
    "Themes are metadata classifications for discovery, not exhaustive descriptions of a collection. See METHODOLOGY.md §7.",
  groups: THEME_GROUPS.map(([id, label]) => ({ id, label })),
  terms: THEMES.map(([name, group, scope_note]) => ({ name, group, scope_note })),
});

// ---- 2. records ---------------------------------------------------------

const records = JSON.parse(readFileSync(p("data/collections.json"), "utf8"));
const harvest = JSON.parse(readFileSync(p("data/new-entries-provenance.json"), "utf8"));

// First date each id appears in data/collections.json across git history.
function firstSeenDates() {
  const seen = new Map();
  const log = execFileSync("git", ["log", "--reverse", "--format=%H %cs", "--", "data/collections.json"], { cwd: ROOT, encoding: "utf8" });
  for (const line of log.trim().split("\n")) {
    const [hash, date] = line.split(" ");
    let snapshot;
    try {
      snapshot = JSON.parse(execFileSync("git", ["show", `${hash}:data/collections.json`], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 }));
    } catch {
      continue;
    }
    for (const e of snapshot) if (e && e.id && !seen.has(e.id)) seen.set(e.id, date);
  }
  return seen;
}
const firstSeen = firstSeenDates();

const mapLanguage = (tag) =>
  LANGUAGE_RENAMES[tag] ?? (COLLECTIVE_PATTERN.test(tag) ? "Multiple languages" : tag);
const mapTheme = (tag) => THEME_RENAMES[tag] ?? tag;
const uniq = (arr) => [...new Set(arr)];

const ORDER = [
  "id", "mv_id", "title", "archive", "country", "lat", "lng",
  "languages", "language_note", "themes", "decade_start", "decade_end",
  "summary", "url", "citation", "access_notes", "related_ids", "preview_url",
  "verification_status", "verification_note", "provenance", "date_added",
];

const migrated = records.map((rec, i) => {
  const out = { ...rec };
  out.mv_id ??= `MV-${String(i + 1).padStart(6, "0")}`;

  const notes = rec.languages.filter((tag) => NOTE_WORTHY(tag, mapLanguage(tag)));
  out.languages = uniq(rec.languages.map(mapLanguage));
  if (notes.length && !out.language_note) out.language_note = notes.join("; ");

  out.themes = uniq(rec.themes.map(mapTheme));

  const h = harvest[rec.id];
  if (!out.verification_status) {
    out.verification_status = "partially_verified";
    if (h && h.languages_sourced === false) {
      out.verification_note = "Languages inferred from country and subject; not stated by the source.";
    }
  }
  out.provenance ??= h
    ? `Wikipedia/Wikidata harvest, September 2026 audit (Wikidata ${h.wikidata_qid}; URL from ${h.url_source}). See data/new-entries-provenance.json.`
    : "v0.1 seed dataset, maintainer-curated from the holding institution's public page.";
  out.date_added ??= firstSeen.get(rec.id) ?? null;

  const ordered = {};
  for (const k of ORDER) if (out[k] !== undefined) ordered[k] = out[k];
  for (const k of Object.keys(out)) if (!(k in ordered)) ordered[k] = out[k];
  return ordered;
});

writeJson("data/collections.json", migrated);
console.log(`Migrated ${migrated.length} records.`);
