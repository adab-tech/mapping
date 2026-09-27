#!/usr/bin/env node
// Review-queue pass, 2026-09-27 (dataset v0.3.0).
//
// Adds 11 records completed from docs/review-queue.csv leads by search-based
// research (each record's evidence is in data/review-log.json), adds the
// one vocabulary term they need, cross-links related records both ways,
// and writes a triage outcome for every open lead back into the queue.
// Idempotent: records already present (by id) are not added twice.
//
// Usage: node scripts/migrations/2026-09-27-queue-additions.mjs

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv, toCsv } from "../lib-csv.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const p = (f) => path.join(ROOT, f);
const readJson = (f) => JSON.parse(readFileSync(p(f), "utf8"));
const writeJson = (f, v) => writeFileSync(p(f), JSON.stringify(v, null, 2) + "\n");

const DATE = "2026-09-27";
const REVIEWER = "Claude (AI-assisted, search-based; source pages not opened)";
const PROVENANCE =
  "Review-queue lead from the September 2026 Wikipedia/Wikidata harvest (docs/review-queue.csv), completed by search-based research on 2026-09-27; evidence in data/review-log.json.";
const LANG_INFERRED = "Languages inferred from country and subject; not stated by the source.";

// Each: record fields + evidence URLs + the queue row(s) it resolves.
const NEW = [
  {
    queue: ["Schweizerisches Volksliedarchiv"],
    evidence: ["https://volksliedarchiv.ch/", "https://volksliedarchiv.ch/collection/sva-01", "https://www.unibas.ch/de/Universitaet/Administration-Services/Generalsekretariat/Archive-Sammlungen/Wissenschaftliche-Sammlungen/Alphabetisch-sortiert/Volkskunde--Fotosammlung-der-Schweizerischen-Gesellschaft-f-r-Volkskunde1.html"],
    rec: {
      id: "schweizerisches-volksliedarchiv",
      title: "Schweizerisches Volksliedarchiv (Swiss Folk Song Archive)",
      archive: "Empirische Kulturwissenschaft Schweiz (formerly Swiss Society for Folklore), Basel",
      country: "Switzerland", lat: 47.5596, lng: 7.5886,
      languages: ["Multiple languages"],
      language_note: "Swiss folk song; the source does not list the languages or dialects of the recordings.",
      themes: ["music", "folklore", "oral tradition"],
      decade_start: 1906, decade_end: null,
      summary: "Founded in 1906 by the Swiss Society for Folklore to collect and study Swiss folk song, the archive in Basel holds song collections alongside sound recordings, including historical field recordings and some 400 records and tapes from the Armin Breu collection; its tape recordings were transferred to digital formats between 1998 and 2000.",
      url: "https://volksliedarchiv.ch/",
      verification_note: "Recording languages not stated by the source.",
    },
  },
  {
    queue: ["Uysal–Walker Archive of Turkish Oral Narrative"],
    evidence: ["https://www.aton.ttu.edu/", "https://swco-ir.tdl.org/communities/73d85258-5c2f-4bb7-901a-fb5da9628605", "https://www.asianstudies.org/publications/eaa/archives/archive-of-turkish-oral-narrative-an-introduction/"],
    rec: {
      id: "uysal-walker-archive-turkish-oral-narrative",
      title: "Uysal–Walker Archive of Turkish Oral Narrative",
      archive: "Southwest Collection/Special Collections Library, Texas Tech University",
      country: "Turkey", lat: 39.9334, lng: 32.8597,
      languages: ["Turkish", "English"],
      language_note: "Tales recorded in Turkish; about 2,000 translated into English by native Turkish speakers.",
      themes: ["oral tradition", "folklore", "music"],
      decade_start: 1961, decade_end: null,
      summary: "Folktales and other oral narratives collected in Turkey from 1961 by Ahmet E. Uysal, Warren S. Walker and Barbara K. Walker and donated to Texas Tech University in 1980. The archive's site offers transcriptions and English translations of some 2,000 tales, audio recordings, and over forty hours of Turkish folk music.",
      url: "https://www.aton.ttu.edu/",
      verification_note: "End year of collecting not stated by the source; decade_end left open.",
    },
  },
  {
    queue: ["Sound Heritage (Sound Heritage Series)"],
    evidence: ["https://search-bcarchives.royalbcmuseum.bc.ca/sound-heritage-series-sound-programs", "https://search-bcarchives.royalbcmuseum.bc.ca/oral-history"],
    rec: {
      id: "bc-archives-sound-heritage-series",
      title: "Sound Heritage Series sound programs",
      archive: "BC Archives, Royal BC Museum",
      country: "Canada", lat: 48.4198, lng: -123.3675,
      languages: ["English"],
      themes: ["history", "social history", "community memory"],
      decade_start: 1976, decade_end: 1983,
      summary: "Twenty documentary sound programs produced by the Provincial Archives of British Columbia's Aural History Programme to accompany its Sound Heritage publications (1976–1983), built from excerpts of oral history interviews in the archives' collection. The materials are held by the Royal BC Museum, which merged with the provincial archives in 2003.",
      url: "https://search-bcarchives.royalbcmuseum.bc.ca/sound-heritage-series-sound-programs",
      verification_note: LANG_INFERRED,
    },
  },
  {
    queue: ["Foundation for Iranian Studies"],
    evidence: ["https://fis-iran.org/oralhistory/", "https://fis-iran.org/oralhistory/background/", "https://fis-iran.org/en/oralhistory/listbylang/eng/e"],
    rec: {
      id: "fis-oral-history-of-iran",
      title: "Oral History of Iran",
      archive: "Foundation for Iranian Studies",
      country: "Iran", lat: 35.6892, lng: 51.389,
      languages: ["Persian", "English"],
      language_note: "The foundation lists interviews by language; English interviews were conducted jointly with Columbia University.",
      themes: ["political history", "history", "national memory"],
      decade_start: 1982, decade_end: null,
      summary: "Begun in 1982 by the Bethesda-based Foundation for Iranian Studies, the program recorded structured interviews with about 180 political, diplomatic, cultural and economic figures of Pahlavi-era Iran, both proponents and opponents of the state's decisions. Tapes and transcripts are kept by the foundation; copies of the English interviews are held in Columbia University's Oral History Archives.",
      url: "https://fis-iran.org/oralhistory/",
      related_ids: ["harvard-iranian-oral-history", "columbia-oral-history-archives"],
      verification_note: "Persian inferred from the foundation's by-language listing; end year not stated by the source.",
    },
  },
  {
    queue: ["Samuel Proctor Oral History Program", "Mississippi Freedom Project"],
    evidence: ["https://oral.history.ufl.edu/", "https://ufdc.ufl.edu/oral", "https://oral.history.ufl.edu/welcome/staff/dr-samuel-proctor"],
    rec: {
      id: "samuel-proctor-oral-history-program",
      title: "Samuel Proctor Oral History Program",
      archive: "University of Florida",
      country: "United States", lat: 29.6436, lng: -82.3549,
      languages: ["English"],
      themes: ["history", "social history", "indigenous history", "military history"],
      decade_start: 1967, decade_end: null,
      summary: "Founded at the University of Florida in 1967, the program holds more than 10,000 interviews and sound recordings documenting Florida, the U.S. Southeast and beyond, with major projects on Native American, African American, military and county history; about 8,000 are publicly available through UF Digital Collections. Its projects include the Mississippi Freedom Project interviews with civil rights veterans.",
      url: "https://oral.history.ufl.edu/",
      access_notes: "About 8,000 interviews freely accessible online through UF Digital Collections.",
      related_ids: ["sohp-unc"],
      verification_note: LANG_INFERRED,
    },
  },
  {
    queue: ["Columbia University Center for Oral History Research"],
    evidence: ["https://library.columbia.edu/libraries/rbml/collecting/oral-history.html", "https://www.ccohr.incite.columbia.edu/"],
    rec: {
      id: "columbia-oral-history-archives",
      title: "Oral History Archives at Columbia",
      archive: "Rare Book & Manuscript Library, Columbia University",
      country: "United States", lat: 40.8064, lng: -73.9632,
      languages: ["English"],
      themes: ["history", "political history", "social history"],
      decade_start: 1948, decade_end: null,
      summary: "Founded by historian Allan Nevins, who recorded his first interview on 18 May 1948, the archive is widely credited with starting the modern oral history movement. It now holds over 10,000 interviews with people in politics, philanthropy, business, media, medicine, science, law, the military, architecture and the arts, and is open to all at the Rare Book & Manuscript Library.",
      url: "https://library.columbia.edu/libraries/rbml/collecting/oral-history.html",
      access_notes: "Open to all researchers at the Rare Book & Manuscript Library, Butler Library.",
      related_ids: ["fis-oral-history-of-iran"],
      verification_note: LANG_INFERRED,
    },
  },
  {
    queue: ["Oral History Center"],
    evidence: ["https://www.lib.berkeley.edu/visit/bancroft/oral-history-center", "https://www.lib.berkeley.edu/visit/bancroft/oral-history-center/about"],
    rec: {
      id: "bancroft-oral-history-center",
      title: "Oral History Center of The Bancroft Library",
      archive: "Bancroft Library, University of California, Berkeley",
      country: "United States", lat: 37.8721, lng: -122.2585,
      languages: ["English"],
      themes: ["history", "political history", "social history"],
      decade_start: 1954, decade_end: null,
      summary: "Established in 1954 as the Regional Oral History Office to interview leading figures of the American West — the second university oral history office in the U.S. after Columbia — and renamed the Oral History Center in 2014. Its collection holds over 5,000 interviews with governors, industrialists, artists, activists and scholars, most of them available online.",
      url: "https://www.lib.berkeley.edu/visit/bancroft/oral-history-center",
      access_notes: "Most interviews available online.",
      related_ids: ["roho-disability-rights"],
      verification_note: LANG_INFERRED,
    },
  },
  {
    queue: ["Black Women Oral History Project"],
    evidence: ["https://www.radcliffe.harvard.edu/schlesinger-library/collections/black-women-oral-history-project", "https://guides.library.harvard.edu/schlesinger_bwohp/interviews"],
    rec: {
      id: "black-women-oral-history-project",
      title: "Black Women Oral History Project",
      archive: "Schlesinger Library, Harvard Radcliffe Institute",
      country: "United States", lat: 42.3764, lng: -71.1226,
      languages: ["English"],
      themes: ["women's history", "social history", "civil rights"],
      decade_start: 1976, decade_end: 1981,
      summary: "Between 1976 and 1981 the project interviewed 72 African American women, many then in their 70s to 90s, who had made significant contributions to American life in the first half of the 20th century, covering family, education, careers, voluntary and union work, and how race and gender shaped their choices.",
      url: "https://www.radcliffe.harvard.edu/schlesinger-library/collections/black-women-oral-history-project",
      access_notes: "Transcripts and audio are fully digitized and available online through the library's research guide.",
      verification_note: LANG_INFERRED,
    },
  },
  {
    queue: ["Queens Memory Project"],
    evidence: ["https://www.queensmemory.org/about-us/", "https://en.wikipedia.org/wiki/Queens_Memory_Project"],
    rec: {
      id: "queens-memory-project",
      title: "Queens Memory Project",
      archive: "Queens Public Library and Queens College Libraries (CUNY)",
      country: "United States", lat: 40.7057, lng: -73.7967,
      languages: ["English", "Bengali", "Hindi", "Korean", "Mandarin Chinese", "Nepali", "Tagalog", "Tibetan", "Urdu"],
      language_note: "The project has produced bilingual episodes in Bangla, Hindi, Korean, Mandarin, Nepali, Tagalog, Tibetan and Urdu, widely spoken Asian languages in Queens.",
      themes: ["community memory", "migration", "everyday life"],
      decade_start: 2010, decade_end: null,
      summary: "A community archive founded in 2010 by Queens College and Queens Public Library that records oral histories with residents of Queens, New York — one of the most linguistically diverse places in the world — about their neighborhoods, migrations and everyday lives.",
      url: "https://www.queensmemory.org/",
      related_ids: ["storycorps-national-archive"],
    },
  },
  {
    queue: ["Voices of Oklahoma"],
    evidence: ["https://voicesofoklahoma.com/about/", "https://voicesofoklahoma.com/interviews/"],
    rec: {
      id: "voices-of-oklahoma",
      title: "Voices of Oklahoma",
      archive: "Voices of Oklahoma, in partnership with the Oklahoma Historical Society",
      country: "United States", lat: 36.154, lng: -95.9928,
      languages: ["English"],
      themes: ["history", "community memory", "political history"],
      decade_start: 2009, decade_end: null,
      summary: "An oral history website founded in Tulsa by radio broadcaster John Erling, recording in-depth interviews with Oklahomans including political and tribal leaders, entertainers, business figures and survivors of the Tulsa Race Massacre; it works in partnership with the Oklahoma Historical Society.",
      url: "https://voicesofoklahoma.com/",
      access_notes: "Interviews freely available online, with audio and transcripts.",
      verification_note: "Sources give 2009 or 2010 as the start year; languages inferred.",
    },
  },
  {
    queue: ["West Point Center for Oral History"],
    evidence: ["https://www.westpoint.edu/directory/center-for-oral-history", "https://en.wikipedia.org/wiki/West_Point_Center_for_Oral_History"],
    rec: {
      id: "west-point-center-for-oral-history",
      title: "West Point Center for Oral History",
      archive: "United States Military Academy",
      country: "United States", lat: 41.3915, lng: -73.9565,
      languages: ["English"],
      themes: ["war and conflict", "military history"],
      decade_start: 2008, decade_end: null,
      summary: "A video oral history archive founded at the U.S. Military Academy in 2008 to record the experiences of soldiers, statesmen and others who have shaped the profession of arms, with collections on Vietnam, the wars in Iraq and Afghanistan, the African-American military experience, and women in the military.",
      url: "https://www.westpoint.edu/directory/center-for-oral-history",
      related_ids: ["veterans-history-project"],
      verification_note: LANG_INFERRED,
    },
  },
];

// Triage outcome for every open lead: [collection, outcome, note]
const TRIAGE = [
  ["StoryCorps", "duplicate", "Covered by MV-000001 StoryCorps Archive."],
  ["National Day of Listening / StoryCorps", "duplicate", "Covered by MV-000001 StoryCorps Archive."],
  ["Disability Visibility Project", "duplicate", "Its oral histories were recorded with and archived by StoryCorps (MV-000001)."],
  ["Veterans History Project", "duplicate", "Covered by MV-000002."],
  ["USC Shoah Foundation Institute for Visual History", "duplicate", "Covered by MV-000004 Visual History Archive."],
  ["Berliner Phonogramm-Archiv", "duplicate", "Covered by MV-000058."],
  ["Southern Oral History Program", "duplicate", "Covered by MV-000097."],
  ["Southern Historical Collection", "duplicate", "Holds the SOHP interviews, covered by MV-000097."],
  ["An Oral History of British Science", "duplicate", "A National Life Stories project, covered by MV-000010."],
  ["AJR Refugee Voices Testimony Archive", "duplicate", "Covered by MV-000050."],
  ["Forgotten Voices", "duplicate", "Book series drawn from the IWM Sound Archive (MV-000048)."],
  ["Jewish Women's Archive", "duplicate", "Its oral history collection Weaving Women's Words is MV-000094."],
  ["School of Scottish Studies", "duplicate", "Its archive is the holder of MV-000011 Tobar an Dualchais."],
  ["Federal Writers' Project", "duplicate", "Its ex-slave interviews are MV-000209; the programme itself is not a single collection."],
  ["Mississippi Freedom Project", "merged", "A Samuel Proctor Oral History Program project; described in that record."],
  ["Oral History Society", "out of scope", "A membership society, not a collection."],
  ["Archive on 4", "out of scope", "A BBC radio programme, not a collection."],
  ["BBC Sound Archive", "out of scope", "General broadcast archive; no oral-history holding evidenced."],
  ["British Library Sounds", "out of scope", "General sound-archive portal; its oral history collections are listed separately (e.g. MV-000010)."],
  ["Witness seminar", "out of scope", "A research method, not a collection."],
  ["Chronicles of Terror (Zapisy Terroru)", "curator decision", "Written witness depositions (1940s commission records), not sound recordings; include only if the scope is widened to written testimony. URL: https://www.zapisyterroru.pl/dlibra"],
  ["Hall–Carpenter Archives", "curator decision", "The oral history interviews (from 1985) are held by the British Library; no holder page found to link to."],
  ["The Belfast Project", "curator decision", "Sensitive: interviews subject to legal proceedings and restricted access; include only after an ethics review (METHODOLOGY §11)."],
  ["7 Billion Others", "needs URL", "In scope (6,000 filmed testimonies, 84 countries, 50+ languages; GoodPlanet Foundation, Paris) but a live official page could not be confirmed."],
];

const records = readJson("data/collections.json");
const langVocab = readJson("data/vocab/languages.json");
const log = readJson("data/review-log.json");

if (!langVocab.terms.some((t) => t.name === "Tibetan")) {
  langVocab.terms.push({ name: "Tibetan", iso639_3: "bod", type: "language", alt_names: ["Standard Tibetan", "Central Tibetan"] });
  langVocab.terms.sort((a, b) => (a.type === "collective") - (b.type === "collective") || a.name.localeCompare(b.name, "en"));
  writeJson("data/vocab/languages.json", langVocab);
}

const ids = new Set(records.map((r) => r.id));
let nextMv = Math.max(...records.map((r) => Number(r.mv_id.slice(3)))) + 1;
const ORDER = ["id", "mv_id", "title", "archive", "country", "lat", "lng", "languages", "language_note", "themes", "decade_start", "decade_end", "summary", "url", "citation", "access_notes", "related_ids", "preview_url", "verification_status", "verification_note", "last_reviewed", "provenance", "date_added"];
const added = [];

for (const { rec, evidence } of NEW) {
  if (ids.has(rec.id)) continue;
  const full = {
    ...rec,
    mv_id: `MV-${String(nextMv++).padStart(6, "0")}`,
    citation: `${rec.archive}. ${rec.title}. Retrieved from ${rec.url}.`,
    verification_status: "partially_verified",
    provenance: PROVENANCE,
    date_added: DATE,
  };
  const ordered = {};
  for (const k of ORDER) if (full[k] !== undefined) ordered[k] = full[k];
  records.push(ordered);
  ids.add(rec.id);
  added.push(ordered);
  log.entries.push({
    date: DATE, mv_id: ordered.mv_id, check: "new record", method: "search-based", reviewer: REVIEWER,
    finding: "Completed from a review-queue lead: holder's page, location, dates, and scope confirmed from search results pointing to the holder's own pages.",
    evidence, changes: null, outcome: "added",
  });
}

// Make every related_ids link reciprocal.
const byId = new Map(records.map((r) => [r.id, r]));
for (const r of added) {
  for (const other of r.related_ids || []) {
    const o = byId.get(other);
    if (!o) throw new Error(`${r.id}: related id ${other} not found`);
    o.related_ids = Array.from(new Set([...(o.related_ids || []), r.id])).sort();
  }
}

writeJson("data/collections.json", records);
writeJson("data/review-log.json", log);

// Queue: add/refresh a triage column.
const queuePath = p("docs/review-queue.csv");
const rows = parseCsv(readFileSync(queuePath, "utf8"));
const outcome = new Map(TRIAGE.map(([c, o, n]) => [c, `${o}: ${n}`]));
for (const { rec, queue } of NEW) {
  const r = records.find((x) => x.id === rec.id);
  for (const q of queue) if (!outcome.has(q)) outcome.set(q, `added: ${r.mv_id} ${r.title}`);
}
for (const row of rows) {
  if (/reject/i.test(row.missing)) continue;
  if (outcome.has(row.collection)) row.triage_2026_09_27 = outcome.get(row.collection);
  else row.triage_2026_09_27 ||= "open: not yet researched";
}
const cols = [...Object.keys(rows[0]).filter((c) => c !== "triage_2026_09_27"), "triage_2026_09_27"];
writeFileSync(queuePath, toCsv(cols, rows));
console.log(`added ${added.length} records (${added.map((r) => r.mv_id).join(", ")})`);
