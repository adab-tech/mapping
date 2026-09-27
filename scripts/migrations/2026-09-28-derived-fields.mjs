#!/usr/bin/env node
// Derived metadata fields, 2026-09 (dataset v0.3.0 → Unreleased).
//
// Populates three optional fields that DATA_DICTIONARY.md had listed as
// "planned", deriving each value mechanically from text that is already in
// the record. Nothing is looked up elsewhere; no source page was opened.
// Where the record's own text does not clearly support a value, the field
// is left absent.
//
//   access          ← `access_notes` only (explicit table below; each entry
//                     quotes the phrase that justifies it, and the script
//                     refuses to run if that phrase is no longer there)
//   archive_type    ← the `archive` (holding institution) name only, by the
//                     keyword rules below, with named exclusions for joint,
//                     renamed, or ambiguous holders
//   historical_period_start / _end
//                   ← `title`/`summary` naming a bounded event with standard
//                     dates (or giving the dates itself); the event table is
//                     published for curators in docs/HISTORICAL-PERIODS.md
//
// Existing values are never overwritten: if a record already has a value
// (e.g. set by a curator), it is kept. Every record that gains a value gets
// one entry in data/review-log.json with method "derived". Idempotent.
//
// Usage: node scripts/migrations/2026-09-28-derived-fields.mjs

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const p = (f) => path.join(ROOT, f);
const DATE = "2026-09-27";
const REVIEWER = "Claude (derived from record text)";
const CHECK = "derived fields";

const records = JSON.parse(readFileSync(p("data/collections.json"), "utf8"));
const log = JSON.parse(readFileSync(p("data/review-log.json"), "utf8"));
const accessTerms = new Set(JSON.parse(readFileSync(p("data/vocab/access.json"), "utf8")).terms.map((t) => t.name));
const typeTerms = new Set(JSON.parse(readFileSync(p("data/vocab/archive-types.json"), "utf8")).terms.map((t) => t.name));

// ---------------------------------------------------------------------------
// 1. access ← access_notes
//
// [mv_id, value, phrase quoted from access_notes]. Records with notes that
// are NOT listed were judged ambiguous and left without `access`:
//   MV-000001  "freely accessible online", but "the full recorded collection" is elsewhere (all, or highlights?)
//   MV-000032  in-person access, but digitized portions "being released" online
//   MV-000047  "freely searchable" (catalogue or content?)
//   MV-000057  archive "being transferred" — current access not stated
//   MV-000067  "searchable online; full recordings subject to interviewee consent"
//   MV-000125  "site maintained as a public research archive" — content access not stated
//   MV-000150  describes where copies are held, not how to access them
//   MV-000172  the report is online; how the testimony archive is reached is not stated
//   MV-000184  describes digitization and custody, not access
//   MV-000187  describes where copies are deposited, not access
//   MV-000189  describes the holder's role, not access
//   MV-000215  "about 8,000 interviews freely accessible online" — whether that is all of them is not stated
// ---------------------------------------------------------------------------
const ACCESS = [
  ["MV-000002", "partial online", "Many interviews viewable online via the Library of Congress; the full collection is available by research visit"],
  ["MV-000003", "open online", "Freely accessible online."],
  ["MV-000004", "registration required", "Full testimonies require registration through partner institutions or educational access via IWitness; some clips are public"],
  ["MV-000022", "open online", "Freely accessible online"],
  ["MV-000031", "open online", "Freely accessible online"],
  ["MV-000033", "on site only", "In-person/reading-room access"],
  ["MV-000036", "open online", "Freely accessible online"],
  ["MV-000038", "on site only", "In-person access in Abidjan; digitization and online access underway"],
  ["MV-000041", "open online", "Freely accessible online"],
  ["MV-000045", "partial online", "Thousands of full testimonies freely viewable online; broader archive by researcher request"],
  ["MV-000048", "partial online", "Many recordings streamable online; full collection via research room visit"],
  ["MV-000049", "partial online", "Selected extracts online; full collection held at the Public Record Office of Northern Ireland"],
  ["MV-000050", "partial online", "Summaries and short clips online; full unedited interviews via institutional partners"],
  ["MV-000059", "open online", "Freely accessible online."],
  ["MV-000063", "open online", "Freely accessible online"],
  ["MV-000071", "open online", "Freely accessible online."],
  ["MV-000075", "open online", "Freely accessible online"],
  ["MV-000081", "open online", "Freely accessible online"],
  ["MV-000092", "on site only", "In-person/reading-room access; recordings requested via the Audiovisual Department"],
  ["MV-000094", "open online", "Full audio and transcripts freely available via the Internet Archive"],
  ["MV-000095", "open online", "Freely accessible online"],
  ["MV-000102", "open online", "Freely accessible online."],
  ["MV-000104", "on site only", "By appointment only, onsite research visits"],
  ["MV-000107", "open online", "Freely accessible online."],
  ["MV-000108", "open online", "Freely accessible online."],
  ["MV-000116", "partial online", "Selected audio freely streamable online"],
  ["MV-000117", "open online", "Freely accessible online."],
  ["MV-000119", "open online", "Freely accessible online"],
  ["MV-000120", "open online", "Digitized collections freely accessible online"],
  ["MV-000142", "partial online", "Selected life-history interviews are published and browsable via the project's own online platform"],
  ["MV-000144", "partial online", "Many collections are streamable online via the Telemeta-based Phonothèque platform; other material requires an in-person consultation request"],
  ["MV-000145", "on site only", "In-person research-room access at the National Archives in Gaborone"],
  ["MV-000149", "on request", "access is by request to the museum's ethnomusicology department"],
  ["MV-000162", "partial online", "Selected recordings from the collection are accessible online"],
  ["MV-000175", "open online", "Freely accessible online via the Duke Digital Repository"],
  ["MV-000179", "on site only", "In-person access by appointment"],
  ["MV-000180", "open online", "Freely browsable online"],
  ["MV-000181", "partial online", "Catalog entries and some audio browsable on the institute's website; full recordings typically require contacting the institute directly"],
  ["MV-000182", "partial online", "Database searchable online in Thai and English; some holdings require an in-person research visit"],
  ["MV-000183", "on site only", "Digitized copies freely accessible in person at the NTT Regional Library"],
  ["MV-000185", "registration required", "Registration required for full access; short audio excerpts viewable online"],
  ["MV-000186", "on request", "Access to the archive is by application to IPNGS"],
  ["MV-000188", "open online", "Music listings and audio streams are freely browsable on the MicSem website"],
  ["MV-000190", "on request", "researchers should contact the library directly for access"],
  ["MV-000191", "on site only", "materials accessible on-site"],
  ["MV-000216", "on site only", "Open to all researchers at the Rare Book & Manuscript Library"],
  ["MV-000217", "partial online", "Most interviews available online."],
  ["MV-000218", "open online", "Transcripts and audio are fully digitized and available online"],
  ["MV-000220", "open online", "Interviews freely available online"],
];

// ---------------------------------------------------------------------------
// 2. archive_type ← archive name
//
// Rules are tried in order; the first match wins. The name is matched after
// removing a parenthetical "(formerly …)". EXCLUDE lists holders whose name
// matches a rule but is joint or ambiguous; UNESCO list entries whose second
// part names a tradition rather than another institution are allowed through
// the " / " (joint holder) exclusion.
// ---------------------------------------------------------------------------
const EXCLUDE = {
  "MV-000026": "joint: UNESCO list and a national ministry",
  "MV-000004": "\"Foundation\" in the name, but \"USC\" marks it as part of a university",
  "MV-000042": "\"Documentation & Research\" does not say what kind of body it is",
  "MV-000056": "\"Research Center\" in the name of what may be a nonprofit; unclear",
  "MV-000131": "a research centre within a Fundação (foundation that is also a university); unclear",
  "MV-000151": "an international research centre whose governance the name does not state",
  "MV-000166": "joint: a research institute and a museum",
  "MV-000176": "a territorial general archive within a cultural institute; national-level status unclear",
  "MV-000183": "joint: a regional library with a university",
  "MV-000187": "joint: archives and national museum",
  "MV-000189": "joint: museum, public library and national archives",
  "MV-000213": "a provincial archive within a museum; unclear which is the holder type",
  "MV-000219": "joint: a public library and a college library",
  "MV-000220": "an independent website in partnership with a historical society; unclear",
};
const TYPE_RULES = [
  ["intergovernmental body", /\bUNESCO\b|\bAfrican Union\b/],
  ["university or research institute", /\bUniversit(y|ies|é|e|à|ät|at|y's)\b|\bUniversidad\b|\bUniversidade\b|\bCollege\b|\bConservatoire\b|\bInstitute of Technology\b|\bHarvard\b/i],
  ["university or research institute", /\bAcademy of Sciences\b|\bRomanian Academy\b|\bZRC SAZU\b/],
  ["museum", /\bMuseum|\bMuseu\b|\bMuseo\b|\bMusée\b/],
  ["national archive or library", /\bNational (Archives?|Archival|Library)\b|\bNational Library\b|\bArquivo Nacional\b|\bArchivo General de\b|\bFonoteca Nacional\b|\bState Archives? of\b/],
  ["broadcaster", /\bBroadcasting\b|\bRadio and Television\b/],
  ["foundation or nonprofit", /\bFoundation\b|\bFondation\b|\bFundación\b|\bAssociation\b|\bSociety\b|\be\.V\./],
  ["university or research institute", /\bMax Planck Institute\b|\bResearch\b|\bRecherches?\b|\bStudies\b|\bInstitut\w* (of|for|de|za) .*(Musicology|Ethnomusicology|Ethnology|Literature|Historia|Linguistics)/],
  ["government agency", /\bMinistry\b|\bAffairs Board\b/],
  ["community or independent project", /\bCollective\b|\bPeople's Archive\b/],
];
function deriveArchiveType(rec) {
  if (EXCLUDE[rec.mv_id]) return null;
  const name = rec.archive.replace(/\s*\(formerly[^)]*\)/i, "");
  const isUnesco = /^UNESCO Intangible Cultural Heritage \//.test(name);
  if (name.includes(" / ") && !isUnesco) return null; // joint holders
  for (const [type, re] of TYPE_RULES) {
    const m = name.match(re);
    if (m) return { type, matched: m[0] };
  }
  return null;
}

// ---------------------------------------------------------------------------
// 3. historical period discussed ← title/summary
//
// EVENTS: key → [label, start, end, basis]. RECORDS: [mv_id, event key,
// phrase that must appear in title or summary]. Only collections principally
// about one bounded event are listed; see docs/HISTORICAL-PERIODS.md.
// ---------------------------------------------------------------------------
const EVENTS = {
  holocaust: ["The Holocaust", 1933, 1945, "standard dates"],
  ww2: ["World War II", 1939, 1945, "standard dates"],
  ja_incarceration: ["Japanese American incarceration", 1942, 1946, "standard dates (first removals 1942 – last camp closed 1946)"],
  hiroshima: ["Atomic bombing of Hiroshima", 1945, 1945, "year stated in summary"],
  nagasaki: ["Atomic bombing of Nagasaki", 1945, 1945, "year stated in summary"],
  okinawa: ["Battle of Okinawa", 1945, 1945, "year stated in summary"],
  partition: ["Partition of India", 1947, 1947, "year stated in summary"],
  nakba: ["Nakba", 1948, 1948, "year stated in summary"],
  jeju: ["Jeju 4.3 uprising and massacre", 1947, 1954, "years stated in summary"],
  korean_war: ["Korean War", 1950, 1953, "standard dates"],
  vietnam_war: ["Vietnam War", 1955, 1975, "standard dates"],
  rwanda: ["Genocide against the Tutsi in Rwanda", 1994, 1994, "year stated in summary"],
  apartheid: ["Apartheid in South Africa", 1948, 1994, "standard dates"],
  gej_earthquake: ["Great East Japan Earthquake and tsunami", 2011, 2011, "year stated in summary"],
  armenian_genocide: ["Armenian Genocide", 1915, 1923, "standard dates"],
  khmer_rouge: ["Khmer Rouge regime", 1975, 1979, "standard dates (also stated in MV-000016)"],
  bosnian_war: ["Bosnian War", 1992, 1995, "standard dates (also stated in MV-000056)"],
  argentina_dictatorship: ["Argentine military dictatorship", 1976, 1983, "years stated in summary"],
  lebanese_civil_war: ["Lebanese Civil War", 1975, 1990, "years stated in summary"],
  troubles: ["The Troubles (Northern Ireland)", 1968, 1998, "standard dates (to the 1998 Good Friday Agreement)"],
  solidarity: ["Solidarity and anti-communist opposition in Poland", 1970, 1989, "years stated in summary"],
  white_terror: ["White Terror (Taiwan)", 1949, 1987, "years stated in summary"],
  bangladesh_1971: ["Bangladesh Liberation War", 1971, 1971, "year stated in summary"],
  angel_island: ["Detention at Angel Island Immigration Station", 1910, 1940, "years stated in summary"],
  bracero: ["Bracero Program", 1942, 1964, "standard dates of the programme"],
  sept_11: ["September 11 attacks", 2001, 2001, "date stated in summary"],
  katrina_rita: ["Hurricanes Katrina and Rita", 2005, 2005, "standard date"],
  el_salvador_war: ["Salvadoran Civil War", 1980, 1992, "years stated in summary"],
  peru_conflict: ["Internal armed conflict in Peru", 1980, 2000, "years stated in summary"],
  chile_dictatorship: ["Chilean military dictatorship", 1973, 1990, "years stated in summary"],
  timor_occupation: ["Indonesian occupation of East Timor", 1974, 1999, "years stated in summary"],
  guatemala_conflict: ["Guatemalan internal armed conflict", 1960, 1996, "standard dates (to the 1996 peace accords)"],
  uruguay_dictatorship: ["Civic-military dictatorship of Uruguay", 1973, 1985, "standard dates"],
  baltimore_2015: ["2015 Baltimore protests", 2015, 2015, "year stated in summary"],
};
const PERIODS = [
  ["MV-000003", "ja_incarceration", "Japanese Americans unjustly incarcerated during World War II"],
  ["MV-000009", "argentina_dictatorship", "1976-1983 military dictatorship"],
  ["MV-000014", "partition", "1947 Partition of British India"],
  ["MV-000015", "hiroshima", "1945 atomic bombing"],
  ["MV-000016", "khmer_rouge", "Khmer Rouge regime (1975-1979)"],
  ["MV-000020", "apartheid", "struggle against apartheid"],
  ["MV-000022", "rwanda", "1994 genocide against the Tutsi"],
  ["MV-000041", "nakba", "1948 Nakba"],
  ["MV-000042", "lebanese_civil_war", "1975-1990 Lebanese Civil War"],
  ["MV-000045", "holocaust", "Holocaust"],
  ["MV-000049", "troubles", "Northern Ireland's Troubles"],
  ["MV-000053", "solidarity", "from 1970 to 1989"],
  ["MV-000056", "bosnian_war", "1992-95 Bosnian War"],
  ["MV-000057", "holocaust", "during the Holocaust"],
  ["MV-000073", "jeju", "1947-54 Jeju uprising and massacre"],
  ["MV-000075", "korean_war", "Korean War oral histories"],
  ["MV-000076", "white_terror", "1949-1987 White Terror"],
  ["MV-000077", "vietnam_war", "Vietnam War"],
  ["MV-000078", "bangladesh_1971", "1971 Liberation War"],
  ["MV-000079", "nagasaki", "1945 atomic bombing"],
  ["MV-000080", "okinawa", "Battle of Okinawa"],
  ["MV-000081", "gej_earthquake", "2011 Great East Japan Earthquake and tsunami"],
  ["MV-000106", "angel_island", "detained at Angel Island between 1910 and 1940"],
  ["MV-000108", "bracero", "oral histories of braceros"],
  ["MV-000114", "holocaust", "Holocaust witnesses and survivors"],
  ["MV-000115", "ww2", "World War II veterans"],
  ["MV-000116", "sept_11", "September 11, 2001 attacks"],
  ["MV-000117", "katrina_rita", "Hurricanes Katrina and Rita"],
  ["MV-000118", "armenian_genocide", "Armenian Genocide survivors"],
  ["MV-000119", "holocaust", "oral histories of the Holocaust"],
  ["MV-000126", "khmer_rouge", "Khmer Rouge survivors"],
  ["MV-000127", "el_salvador_war", "1980-1992 civil war"],
  ["MV-000128", "peru_conflict", "1980-2000 internal armed conflict"],
  ["MV-000129", "chile_dictatorship", "1973-1990 military dictatorship"],
  ["MV-000130", "timor_occupation", "1974-1999 Indonesian occupation"],
  ["MV-000167", "ww2", "WWII resistance fighters"],
  ["MV-000172", "guatemala_conflict", "Guatemala's internal armed conflict"],
  ["MV-000179", "uruguay_dictatorship", "Uruguay's civil-military dictatorship"],
  ["MV-000203", "baltimore_2015", "2015 Baltimore protests"],
  ["MV-000206", "bosnian_war", "lived through the Bosnian war"],
];

// ---------------------------------------------------------------------------

const CANONICAL_ORDER = [
  "id", "mv_id", "title", "archive", "country", "lat", "lng", "languages", "language_note", "themes",
  "decade_start", "decade_end", "historical_period_start", "historical_period_end", "summary", "url",
  "citation", "access_notes", "access", "archive_type", "related_ids", "preview_url",
  "verification_status", "verification_note", "last_reviewed", "provenance", "date_added",
];
function reorder(rec) {
  const unknown = Object.keys(rec).filter((k) => !CANONICAL_ORDER.includes(k));
  if (unknown.length) throw new Error(`${rec.mv_id}: unknown field(s) ${unknown.join(", ")}`);
  return Object.fromEntries(CANONICAL_ORDER.filter((k) => k in rec).map((k) => [k, rec[k]]));
}

const byMv = new Map(records.map((r) => [r.mv_id, r]));
const pending = new Map(); // mv_id -> { changes: {}, notes: [] }
const note = (mv, field, value, why) => {
  const rec = byMv.get(mv);
  if (rec[field] !== undefined && rec[field] !== null) return; // never overwrite
  const entry = pending.get(mv) || { changes: {}, notes: [] };
  entry.changes[field] = { from: null, to: value };
  if (why) entry.notes.push(why);
  pending.set(mv, entry);
};

for (const [mv, value, phrase] of ACCESS) {
  const rec = byMv.get(mv);
  if (!rec) throw new Error(`access: unknown ${mv}`);
  if (!accessTerms.has(value)) throw new Error(`access: ${value} not in vocab`);
  if (!rec.access_notes || !rec.access_notes.includes(phrase)) {
    throw new Error(`access: ${mv} access_notes no longer contain "${phrase}"`);
  }
  note(mv, "access", value, `access "${value}" from access_notes: "${phrase}"`);
}

for (const rec of records) {
  const d = deriveArchiveType(rec);
  if (!d) continue;
  if (!typeTerms.has(d.type)) throw new Error(`archive_type: ${d.type} not in vocab`);
  note(rec.mv_id, "archive_type", d.type, `archive_type "${d.type}" from the holder's name ("${d.matched}" in "${rec.archive}")`);
}

for (const [mv, key, phrase] of PERIODS) {
  const rec = byMv.get(mv);
  const ev = EVENTS[key];
  if (!rec || !ev) throw new Error(`period: bad row ${mv} ${key}`);
  if (!`${rec.title} ${rec.summary}`.includes(phrase)) throw new Error(`period: ${mv} no longer contains "${phrase}"`);
  const [label, start, end, basis] = ev;
  const why = `period discussed ${start === end ? start : `${start}–${end}`} (${label}; ${basis}) from the summary: "${phrase}"`;
  note(mv, "historical_period_start", start, why);
  note(mv, "historical_period_end", end, null);
}

// Apply, log, and write.
const logged = new Set(log.entries.filter((e) => e.method === "derived" && e.check === CHECK).map((e) => e.mv_id));
let changedRecords = 0;
for (const [mv, { changes, notes }] of [...pending].sort((a, b) => a[0].localeCompare(b[0]))) {
  const rec = byMv.get(mv);
  for (const [field, { to }] of Object.entries(changes)) rec[field] = to;
  changedRecords++;
  if (logged.has(mv)) continue;
  log.entries.push({
    date: DATE,
    mv_id: mv,
    check: CHECK,
    method: "derived",
    reviewer: REVIEWER,
    finding: `Derived mechanically from the record's own text: ${notes.join("; ")}.`,
    evidence: [rec.url],
    changes,
    outcome: "derived",
  });
}

const out = records.map(reorder);
writeFileSync(p("data/collections.json"), JSON.stringify(out, null, 2) + "\n");
writeFileSync(p("data/review-log.json"), JSON.stringify(log, null, 2) + "\n");

const count = (f) => out.filter((r) => r[f] !== undefined && r[f] !== null).length;
console.log(`records changed this run: ${changedRecords}`);
console.log(`access: ${count("access")} · archive_type: ${count("archive_type")} · historical period: ${count("historical_period_start")} (of ${out.length})`);
