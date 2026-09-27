#!/usr/bin/env node
// Search-based source review, 2026-09-27 (dataset v0.3.0).
//
// Applies URL and language corrections found by checking the September
// 2026 link-check failures (issue #9) and the records flagged for review
// (http:// URLs, inferred languages), and appends one entry per check to
// data/review-log.json. Evidence came from web-search results pointing to
// the holders' own pages; the pages themselves could not be opened from
// the environment that ran the review, so no record is promoted to
// `verified` here. Idempotent.
//
// Usage: node scripts/migrations/2026-09-27-source-review.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const p = (f) => path.join(ROOT, f);
const DATE = "2026-09-27";
const REVIEWER = "Claude (AI-assisted, search-based; source pages not opened)";

const records = JSON.parse(readFileSync(p("data/collections.json"), "utf8"));
const logPath = p("data/review-log.json");
const log = existsSync(logPath) ? JSON.parse(readFileSync(logPath, "utf8")) : { $comment: "", entries: [] };
log.$comment =
  "Append-only log of source checks on data/collections.json records. One entry per check. " +
  "`method` says how the check was done; only a `field-by-field` check by a curator can promote a record to `verified` (METHODOLOGY.md §4).";

// [mv_id, check, finding, evidence[], changes{} | null]
const CHECKS = [
  // --- hard link failures from the 2026-09-21 link check (issue #9) ---
  ["MV-000045", "link", "Old URL returns 404; the archive's testimonies page and video-testimonies page are indexed on yadvashem.org.",
    ["https://www.yadvashem.org/archive/about/testimonies.html", "https://www.yadvashem.org/holocaust/video-testimonies.html"],
    { url: "https://www.yadvashem.org/archive/about/testimonies.html", preview_url: "https://www.yadvashem.org/holocaust/video-testimonies.html" }],
  ["MV-000061", "link", "Old database URL returns 404. The Estonian Literary Museum (parent institution) publishes an English department page for the archives.",
    ["https://www.kirmus.ee/en/about-us/departments/estonian-folklore-archives", "https://www.folklore.ee/era/"],
    { url: "https://www.kirmus.ee/en/about-us/departments/estonian-folklore-archives" }],
  ["MV-000147", "link", "ahm.ghost.uem.mz returns 410 Gone; the archive's site is indexed at ahm.uem.mz.",
    ["https://ahm.uem.mz/"],
    { url: "https://ahm.uem.mz/" }],
  ["MV-000145", "link", "URL returned 404 in the link check but is still indexed by search engines; no replacement page from BNARS found. Needs a manual check.",
    ["https://www.gov.bw/culture/national-archives-research-enquiry"],
    { verification_note: "Source URL returned 404 in the 2026-09-21 link check; no replacement page found yet." }],
  ["MV-000191", "link", "URL returns 404; natlib.lk has been restructured (e.g. /collections/ich.php, /collections/special_collection.php). Search snippets describe the folklore collection as manuscripts; whether it holds recordings (in scope) or the Intangible Cultural Heritage collection is the better target needs a curator's decision.",
    ["https://www.natlib.lk/collections/ich.php", "https://www.natlib.lk/collections/special_collection.php"],
    { verification_note: "Source URL returned 404 in the 2026-09-21 link check; site restructured. Scope (manuscripts vs. recordings) needs curator review." }],

  // --- http:// URLs ---
  ["MV-000081", "https", "Search index lists the archive under https on the same host and path.", ["https://search.shinrokuden.irides.tohoku.ac.jp/shinrokuden/result"],
    { url: "https://search.shinrokuden.irides.tohoku.ac.jp/shinrokuden/" }],
  ["MV-000196", "https", "freedomcollection.org is superseded by the George W. Bush Presidential Center's own Freedom Collection page.", ["https://www.bushcenter.org/freedom-collection"],
    { url: "https://www.bushcenter.org/freedom-collection" }],
  ["MV-000198", "https", "Same page indexed under https.", ["https://slwa.wa.gov.au/dead_reckoning/battye_library"],
    { url: "https://slwa.wa.gov.au/dead_reckoning/battye_library" }],
  ["MV-000199", "https", "Site indexed under https.", ["https://lebanesestudies.ncsu.edu/news/category/archive-spotlights/"],
    { url: "https://lebanesestudies.ncsu.edu/" }],
  ["MV-000202", "https", "The collection has moved from lacito.vjf.cnrs.fr to its own domain.", ["https://pangloss.cnrs.fr/", "https://pangloss.cnrs.fr/about-us"],
    { url: "https://pangloss.cnrs.fr/" }],
  ["MV-000206", "https", "The museum's site is now warchildhood.org (https).", ["https://warchildhood.org/"],
    { url: "https://warchildhood.org/" }],
  ["MV-000207", "https", "Site indexed under https.", ["https://www.mediathek.at/", "https://www.mediathek.at/forschungsprojekte/menschenleben"],
    { url: "https://www.mediathek.at/" }],
  ["MV-000208", "https", "OHAM's page has moved to library.yale.edu (https).", ["https://library.yale.edu/visit-and-study/libraries-locations/gilmore-music-library/oral-history-american-music"],
    { url: "https://library.yale.edu/visit-and-study/libraries-locations/gilmore-music-library/oral-history-american-music" }],
  ["MV-000073", "https", "Only http:// pages of jeju43peace.org are indexed; the foundation also runs jeju43peace.or.kr and an online archive at 43archives.or.kr. Left unchanged pending a manual check of which is the right target.", ["http://jeju43peace.org/historytruth/archives/"], null],
  ["MV-000074", "https", "Only http:// pages of nanum.org are indexed. Left unchanged.", ["http://www.nanum.org/eng/sub1/sub2.php"], null],
  ["MV-000118", "https", "Only http://www.armenianfilm.org/ is indexed (a separate https subdomain exists for film sales). Left unchanged.", ["http://www.armenianfilm.org/"], null],
  ["MV-000133", "https", "No https evidence found for kfdz.kz. Left unchanged.", [], null],
  ["MV-000154", "https", "Only http://www.icbsa.it/ is indexed. Left unchanged.", ["http://www.icbsa.it/"], null],
  ["MV-000177", "https", "Only http:// pages are indexed. Left unchanged.", ["http://www.literatura.edu.bo/archivo_oral/"], null],
  ["MV-000178", "https", "Only http:// pages are indexed. Left unchanged.", ["http://www.diversidadcultural.gob.ve/"], null],

  // --- languages ---
  ["MV-000210", "languages", "Holder's platform and project description: interviews mainly in siSwati, with English transcriptions/translations for a selection.",
    ["https://emandulo.apc.uct.ac.za/metadata/SWOHP/index.html", "https://emandulo.apc.uct.ac.za/collection/SWOHP/Institutional_Materials/Historical_Papers_SWOHP_Finding_Aid.pdf"],
    { languages: ["Swazi", "English"], language_note: "Interviews mainly in siSwati; a selection transcribed and translated into English.", verification_note: null }],
  ["MV-000202", "languages", "The collection's own site: recordings in about 170 languages, mostly spoken by small communities.",
    ["https://pangloss.cnrs.fr/about-us"],
    { language_note: "about 170 languages, mostly of small, often endangered speech communities", verification_note: null }],
  ["MV-000177", "languages", "The archive's own pages name further recording languages beyond Aymara and Quechua.",
    ["http://www.literatura.edu.bo/archivo_oral/index.php/archivo/sobre-el-archivo"],
    { language_note: "Also Mosetén, Guarayo, Tacana, Tsimán and Chiquitano, among others (per the archive's own description)." }],
  ["MV-000196", "languages", "No source states the interview languages; the four listed remain inferred.", [], null],
  ["MV-000201", "languages", "No source states the interview languages; English remains inferred.", [], null],
  ["MV-000197", "languages", "Holdings are German broadcasting (Weimar, Nazi-era, GDR radio and television); German is consistent with the holder's description but not stated as such.", ["https://www.dra.de/de/bestaende"], null],
  ["MV-000200", "languages", "No source states the languages of the oral-tradition holdings. Left inferred.", [], null],
];

const byMv = new Map(records.map((r) => [r.mv_id, r]));
const already = new Set(log.entries.map((e) => `${e.date}|${e.mv_id}|${e.check}`));

for (const [mv, check, finding, evidence, changes] of CHECKS) {
  const rec = byMv.get(mv);
  if (!rec) throw new Error(`unknown ${mv}`);
  const applied = {};
  if (changes) {
    for (const [field, value] of Object.entries(changes)) {
      const before = rec[field];
      if (JSON.stringify(before) === JSON.stringify(value ?? undefined)) continue;
      applied[field] = { from: before ?? null, to: value };
      if (value === null) delete rec[field];
      else rec[field] = value;
      // Citations embed the URL; keep them in step.
      if (field === "url" && typeof rec.citation === "string" && before) {
        rec.citation = rec.citation.split(before).join(value);
      }
    }
  }
  const key = `${DATE}|${mv}|${check}`;
  if (!already.has(key)) {
    log.entries.push({
      date: DATE, mv_id: mv, check, method: "search-based", reviewer: REVIEWER,
      finding, evidence, changes: Object.keys(applied).length ? applied : null,
      outcome: changes && !("verification_note" in (changes || {}) && Object.keys(changes).length === 1) ? "corrected" : (changes ? "flagged" : "unchanged"),
    });
  }
}

// Keep canonical key order (verification_note sits after verification_status).
writeFileSync(p("data/collections.json"), JSON.stringify(records, null, 2) + "\n");
writeFileSync(logPath, JSON.stringify(log, null, 2) + "\n");
console.log(`${CHECKS.length} checks logged.`);
