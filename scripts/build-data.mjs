#!/usr/bin/env node
// Builds the open-data exports from the canonical sources:
//
//   sources:  data/collections.json, data/vocab/*.json, data/dataset-meta.json
//   outputs:  data/collections.csv        one row per collection
//             data/collections.geojson    one Point feature per collection
//             data/languages.json         language vocabulary + usage
//             data/themes.json            theme taxonomy + usage
//             data/countries.json         country vocabulary + usage
//             data/stats.json             aggregate counts for the indexed dataset
//             data/datapackage.json       Frictionless Data Package descriptor
//
// Outputs are committed (the site has no build step), so CI runs this with
// --check to fail if they are stale. Zero dependencies.
//
// Usage: node scripts/build-data.mjs [--check]

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (f) => path.join(ROOT, f);
const readJson = (f) => JSON.parse(readFileSync(p(f), "utf8"));

const CHECK = process.argv.includes("--check");

const records = readJson("data/collections.json");
const meta = readJson("data/dataset-meta.json");
const countriesVocab = readJson("data/vocab/countries.json").terms;
const languagesVocab = readJson("data/vocab/languages.json").terms;
const themesVocab = readJson("data/vocab/themes.json");

const countryByName = new Map(countriesVocab.map((c) => [c.name, c]));
const themeByName = new Map(themesVocab.terms.map((t) => [t.name, t]));
const groupLabel = new Map(themesVocab.groups.map((g) => [g.id, g.label]));

const byName = (a, b) => a.localeCompare(b, "en");
const uniqSorted = (arr) => [...new Set(arr)].sort(byName);
const countBy = (items) => {
  const out = {};
  for (const k of items) out[k] = (out[k] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1] || byName(a[0], b[0])));
};

const header = {
  dataset: meta.title,
  version: meta.version,
  released: meta.released,
  license: meta.license.name,
  homepage: meta.homepage,
  methodology: meta.methodology,
  scope_statement: meta.scope_statement,
};

// ---- collections.csv ----------------------------------------------------

const CSV_COLUMNS = [
  "mv_id", "id", "title", "archive", "country", "iso3166_1_alpha2", "region", "subregion",
  "lat", "lng", "languages", "language_note", "themes", "theme_groups",
  "decade_start", "decade_end", "summary", "url", "citation", "access_notes",
  "related_ids", "preview_url", "verification_status", "verification_note",
  "provenance", "date_added",
];

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const s = Array.isArray(value) ? value.join("; ") : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function flatRecord(r) {
  const c = countryByName.get(r.country) || {};
  return {
    ...r,
    iso3166_1_alpha2: c.iso3166_1_alpha2,
    region: c.region,
    subregion: c.subregion,
    theme_groups: uniqSorted(r.themes.map((t) => groupLabel.get(themeByName.get(t)?.group)).filter(Boolean)),
  };
}

const csv =
  [CSV_COLUMNS.join(","), ...records.map((r) => {
    const f = flatRecord(r);
    return CSV_COLUMNS.map((k) => csvCell(f[k])).join(",");
  })].join("\r\n") + "\r\n";

// ---- collections.geojson --------------------------------------------------

const geojson = {
  type: "FeatureCollection",
  metadata: header,
  features: records.map((r) => {
    const { lat, lng, ...props } = flatRecord(r);
    return {
      type: "Feature",
      id: r.mv_id,
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: props,
    };
  }),
};

// ---- languages / themes / countries indexes -----------------------------

const languages = {
  ...header,
  terms: languagesVocab.map((l) => {
    const recs = records.filter((r) => r.languages.includes(l.name));
    return {
      ...l,
      collection_count: recs.length,
      countries: uniqSorted(recs.map((r) => r.country)),
      collections: recs.map((r) => r.mv_id),
    };
  }),
};

const themes = {
  ...header,
  groups: themesVocab.groups.map((g) => ({
    ...g,
    collection_count: records.filter((r) => r.themes.some((t) => themeByName.get(t)?.group === g.id)).length,
  })),
  terms: themesVocab.terms.map((t) => {
    const recs = records.filter((r) => r.themes.includes(t.name));
    return { ...t, collection_count: recs.length, collections: recs.map((r) => r.mv_id) };
  }),
};

const countries = {
  ...header,
  terms: countriesVocab.map((c) => {
    const recs = records.filter((r) => r.country === c.name);
    return {
      ...c,
      collection_count: recs.length,
      languages: uniqSorted(recs.flatMap((r) => r.languages)),
      collections: recs.map((r) => r.mv_id),
    };
  }),
};

// ---- stats ----------------------------------------------------------------

const currentDecade = Math.floor(Number(meta.released.slice(0, 4)) / 10) * 10;
const decadeCounts = {};
for (const r of records) {
  const end = r.decade_end ?? currentDecade;
  for (let d = Math.floor(r.decade_start / 10) * 10; d <= end; d += 10) {
    decadeCounts[d] = (decadeCounts[d] || 0) + 1;
  }
}
const coverage = (field) => {
  const n = records.filter((r) => {
    const v = r[field];
    return v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0) && v !== "";
  }).length;
  return { records: n, percent: Math.round((n / records.length) * 1000) / 10 };
};
const individualLanguages = new Set(
  languagesVocab.filter((l) => l.type !== "collective").map((l) => l.name)
);

const stats = {
  ...header,
  totals: {
    collections: records.length,
    countries: new Set(records.map((r) => r.country)).size,
    languages: new Set(records.flatMap((r) => r.languages).filter((l) => individualLanguages.has(l))).size,
    language_terms_including_collective: new Set(records.flatMap((r) => r.languages)).size,
    themes: new Set(records.flatMap((r) => r.themes)).size,
    institutions: new Set(records.map((r) => r.archive)).size,
    decades: Object.keys(decadeCounts).length,
  },
  by_region: countBy(records.map((r) => countryByName.get(r.country)?.region)),
  by_verification_status: countBy(records.map((r) => r.verification_status)),
  by_country: countBy(records.map((r) => r.country)),
  by_language: countBy(records.flatMap((r) => r.languages)),
  by_theme_group: Object.fromEntries(themes.groups.map((g) => [g.label, g.collection_count])),
  by_decade: decadeCounts,
  field_coverage: Object.fromEntries(
    ["language_note", "citation", "access_notes", "related_ids", "preview_url", "verification_note"].map((f) => [f, coverage(f)])
  ),
  url_scheme: countBy(records.map((r) => new URL(r.url).protocol.replace(":", ""))),
};

// ---- datapackage.json -------------------------------------------------------

const datapackage = {
  profile: "data-package",
  name: meta.name,
  title: meta.title,
  version: meta.version,
  created: meta.released,
  description: meta.description,
  homepage: meta.homepage,
  licenses: [meta.license],
  contributors: [{ title: meta.creator, role: "author" }],
  sources: [{ title: "Holding institutions' own public pages; see each record's url and provenance fields." }],
  resources: [
    { name: "collections", path: "collections.json", format: "json", mediatype: "application/json", description: "Canonical records." },
    {
      name: "collections-csv", path: "collections.csv", format: "csv", mediatype: "text/csv", encoding: "utf-8",
      description: "Flattened records. Multi-valued fields are joined with '; '.",
      schema: {
        primaryKey: "mv_id",
        fields: CSV_COLUMNS.map((name) => ({
          name,
          type: ["lat", "lng"].includes(name) ? "number" : ["decade_start", "decade_end"].includes(name) ? "integer" : "string",
        })),
      },
    },
    { name: "collections-geojson", path: "collections.geojson", format: "geojson", mediatype: "application/geo+json", description: "One Point feature per record (RFC 7946, [lng, lat])." },
    { name: "languages", path: "languages.json", format: "json", mediatype: "application/json", description: "Language vocabulary with per-language usage." },
    { name: "themes", path: "themes.json", format: "json", mediatype: "application/json", description: "Theme taxonomy with per-theme usage." },
    { name: "countries", path: "countries.json", format: "json", mediatype: "application/json", description: "Country vocabulary with per-country usage." },
    { name: "stats", path: "stats.json", format: "json", mediatype: "application/json", description: "Aggregate statistics describing the indexed dataset." },
  ],
};

// ---- write / check ----------------------------------------------------------

const json = (v) => JSON.stringify(v, null, 2) + "\n";
const outputs = {
  "data/collections.csv": csv,
  "data/collections.geojson": json(geojson),
  "data/languages.json": json(languages),
  "data/themes.json": json(themes),
  "data/countries.json": json(countries),
  "data/stats.json": json(stats),
  "data/datapackage.json": json(datapackage),
};

let stale = 0;
for (const [file, content] of Object.entries(outputs)) {
  if (CHECK) {
    const current = existsSync(p(file)) ? readFileSync(p(file), "utf8") : null;
    if (current !== content) {
      console.error(`stale: ${file}`);
      stale++;
    }
  } else {
    writeFileSync(p(file), content);
    console.log(`wrote ${file}`);
  }
}
if (CHECK) {
  if (stale) {
    console.error(`\n${stale} generated file(s) are out of date. Run: node scripts/build-data.mjs`);
    process.exit(1);
  }
  console.log("OK: generated data files are up to date.");
}
