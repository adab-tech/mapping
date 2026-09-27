#!/usr/bin/env node
// Zero-dependency validator for data/collections.json against the schema in
// DATA_DICTIONARY.md and the controlled vocabularies in data/vocab/. Uses
// only Node built-ins so it can run in CI (or locally) with no install step.
//
// Errors fail the run. Warnings are printed but don't fail it — they flag
// things worth a human look (e.g. an http:// URL) that aren't wrong as such.
//
// Usage: node scripts/validate-data.mjs

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED_STRING_FIELDS = ["id", "mv_id", "title", "archive", "country", "summary", "url", "verification_status", "provenance"];
const REQUIRED_ARRAY_FIELDS = ["languages", "themes"];
const OPTIONAL_STRING_FIELDS = ["citation", "access_notes", "language_note", "verification_note"];
export const VERIFICATION_STATUSES = ["verified", "partially_verified", "needs_review", "unavailable"];
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MV_ID = /^MV-\d{6}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const COLLECTIVE_NEEDING_NOTE = "Multiple languages";

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Canonical form of a URL for duplicate detection: scheme, "www.", and
 * trailing slashes don't make two links point at different collections. */
export function canonicalUrl(value) {
  return String(value).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
}

/** Checks a vocabulary file's own integrity: unique names, and no alt name
 * that collides with another term's canonical name. */
function validateVocab(label, terms, fail) {
  const names = new Set();
  for (const term of terms) {
    if (typeof term.name !== "string" || !term.name.trim()) {
      fail(`vocab/${label}`, `term without a name: ${JSON.stringify(term)}`);
      continue;
    }
    if (names.has(term.name)) fail(`vocab/${label}`, `duplicate term "${term.name}"`);
    names.add(term.name);
  }
  for (const term of terms) {
    for (const alt of term.alt_names || []) {
      if (names.has(alt)) fail(`vocab/${label}`, `alt name "${alt}" of "${term.name}" is itself a canonical term`);
    }
  }
  return names;
}

/**
 * Validates an array of collection records against the vocabularies.
 * Returns { errors, warnings } as arrays of strings; never throws on bad data.
 */
export function validate(data, vocab, { currentYear = new Date().getFullYear() } = {}) {
  const errors = [];
  const warnings = [];
  const fail = (context, message) => errors.push(`${context}: ${message}`);
  const warn = (context, message) => warnings.push(`${context}: ${message}`);

  if (!Array.isArray(data)) {
    fail("data/collections.json", "must be a JSON array of collection objects");
    return { errors, warnings };
  }
  if (data.length === 0) {
    fail("data/collections.json", "is empty");
    return { errors, warnings };
  }

  const countries = validateVocab("countries", vocab.countries, fail);
  const languages = validateVocab("languages", vocab.languages, fail);
  const themes = validateVocab("themes", vocab.themes, fail);
  // Optional controlled fields: when a vocabulary is not supplied (older
  // callers), any value is rejected rather than silently accepted.
  const accessTerms = validateVocab("access", vocab.access || [], fail);
  const archiveTypes = validateVocab("archive-types", vocab.archiveTypes || [], fail);
  const themeGroups = new Set((vocab.themeGroups || []).map((g) => g.id));
  if (vocab.themeGroups) {
    for (const t of vocab.themes) {
      if (!themeGroups.has(t.group)) fail("vocab/themes", `term "${t.name}" has unknown group "${t.group}"`);
    }
  }

  const seenIds = new Set();
  const seenMvIds = new Set();
  const seenUrls = new Map();
  const seenTitleArchive = new Map();

  data.forEach((entry, index) => {
    const context = `entry #${index} (${entry && typeof entry.id === "string" ? entry.id : "no id"})`;
    if (!isPlainObject(entry)) {
      fail(context, "is not a JSON object");
      return;
    }

    for (const field of REQUIRED_STRING_FIELDS) {
      const value = entry[field];
      if (typeof value !== "string" || value.trim().length === 0) {
        fail(context, `field "${field}" must be a non-empty string`);
      }
    }

    // --- id (kebab-case slug) and mv_id (persistent research identifier) ---
    if (typeof entry.id === "string") {
      if (!KEBAB_CASE.test(entry.id)) {
        fail(context, `field "id" ("${entry.id}") must be kebab-case (lowercase letters, digits, hyphens only)`);
      }
      if (seenIds.has(entry.id)) fail(context, `field "id" ("${entry.id}") is not unique`);
      seenIds.add(entry.id);
    }
    if (typeof entry.mv_id === "string") {
      if (!MV_ID.test(entry.mv_id)) fail(context, `field "mv_id" ("${entry.mv_id}") must look like MV-000123`);
      if (seenMvIds.has(entry.mv_id)) fail(context, `field "mv_id" ("${entry.mv_id}") is not unique`);
      seenMvIds.add(entry.mv_id);
    }

    // --- controlled country ---
    if (typeof entry.country === "string" && !countries.has(entry.country)) {
      fail(context, `field "country" ("${entry.country}") is not in data/vocab/countries.json — use the canonical name or add the country there`);
    }

    // --- coordinates ---
    if (!isFiniteNumber(entry.lat)) {
      fail(context, `field "lat" must be a number, got ${JSON.stringify(entry.lat)}`);
    } else if (entry.lat < -90 || entry.lat > 90) {
      fail(context, `field "lat" (${entry.lat}) must be between -90 and 90`);
    }
    if (!isFiniteNumber(entry.lng)) {
      fail(context, `field "lng" must be a number, got ${JSON.stringify(entry.lng)}`);
    } else if (entry.lng < -180 || entry.lng > 180) {
      fail(context, `field "lng" (${entry.lng}) must be between -180 and 180`);
    }
    if (entry.lat === 0 && entry.lng === 0) {
      fail(context, `coordinates are 0,0 ("Null Island") — almost certainly a missing value`);
    }

    // --- languages / themes: non-empty, unique, controlled ---
    for (const field of REQUIRED_ARRAY_FIELDS) {
      const value = entry[field];
      if (!Array.isArray(value) || value.length === 0) {
        fail(context, `field "${field}" must be a non-empty array`);
        continue;
      }
      if (!value.every((item) => typeof item === "string" && item.trim().length > 0)) {
        fail(context, `field "${field}" must contain only non-empty strings`);
        continue;
      }
      if (new Set(value).size !== value.length) fail(context, `field "${field}" contains duplicates`);
      const allowed = field === "languages" ? languages : themes;
      const vocabFile = field === "languages" ? "languages" : "themes";
      for (const item of value) {
        if (!allowed.has(item)) {
          fail(context, `${field.slice(0, -1)} "${item}" is not in data/vocab/${vocabFile}.json — use the canonical term or propose a new one`);
        }
      }
    }
    if (Array.isArray(entry.languages) && entry.languages.includes(COLLECTIVE_NEEDING_NOTE) && !entry.language_note) {
      fail(context, `uses "${COLLECTIVE_NEEDING_NOTE}" without a "language_note" recording what the source says`);
    }

    // --- recording/collection period ---
    if (!Number.isInteger(entry.decade_start)) {
      fail(context, `field "decade_start" must be an integer year, got ${JSON.stringify(entry.decade_start)}`);
    } else if (entry.decade_start < 1800 || entry.decade_start > currentYear) {
      fail(context, `field "decade_start" (${entry.decade_start}) is outside a plausible range (1800-${currentYear})`);
    }
    if (entry.decade_end !== null) {
      if (!Number.isInteger(entry.decade_end)) {
        fail(context, `field "decade_end" must be an integer year or null, got ${JSON.stringify(entry.decade_end)}`);
      } else {
        if (entry.decade_end > currentYear) fail(context, `field "decade_end" (${entry.decade_end}) is in the future`);
        if (Number.isInteger(entry.decade_start) && entry.decade_end < entry.decade_start) {
          fail(context, `field "decade_end" (${entry.decade_end}) precedes "decade_start" (${entry.decade_start})`);
        }
      }
    }

    // --- optional controlled fields: access, archive_type ---
    for (const [field, allowed, file] of [["access", accessTerms, "access"], ["archive_type", archiveTypes, "archive-types"]]) {
      if (entry[field] === undefined) continue;
      if (typeof entry[field] !== "string" || !allowed.has(entry[field])) {
        fail(context, `field "${field}" (${JSON.stringify(entry[field])}) is not in data/vocab/${file}.json — use a listed term or omit the field`);
      }
    }

    // --- historical period discussed (optional) ---
    for (const field of ["historical_period_start", "historical_period_end"]) {
      if (entry[field] !== undefined && entry[field] !== null && !Number.isInteger(entry[field])) {
        fail(context, `field "${field}" must be an integer year or null when present`);
      }
    }
    if (Number.isInteger(entry.historical_period_start) && Number.isInteger(entry.historical_period_end) &&
        entry.historical_period_end < entry.historical_period_start) {
      fail(context, `field "historical_period_end" precedes "historical_period_start"`);
    }

    // --- url + duplicates ---
    if (typeof entry.url === "string") {
      if (!validUrl(entry.url)) {
        fail(context, `field "url" ("${entry.url}") is not a well-formed http(s) URL`);
      } else {
        if (entry.url.startsWith("http:")) warn(context, `url uses http:// — check whether an https:// version works`);
        const key = canonicalUrl(entry.url);
        if (seenUrls.has(key)) fail(context, `field "url" duplicates ${seenUrls.get(key)}`);
        else seenUrls.set(key, entry.id);
      }
    }
    if (typeof entry.title === "string" && typeof entry.archive === "string") {
      const key = `${entry.title.trim().toLowerCase()}|${entry.archive.trim().toLowerCase()}`;
      if (seenTitleArchive.has(key)) fail(context, `same title and archive as ${seenTitleArchive.get(key)} — likely a duplicate record`);
      else seenTitleArchive.set(key, entry.id);
    }

    // --- verification / provenance ---
    if (typeof entry.verification_status === "string" && !VERIFICATION_STATUSES.includes(entry.verification_status)) {
      fail(context, `field "verification_status" ("${entry.verification_status}") must be one of ${VERIFICATION_STATUSES.join(", ")}`);
    }
    for (const field of ["last_reviewed"]) {
      if (entry[field] !== undefined && (typeof entry[field] !== "string" || !ISO_DATE.test(entry[field]) || Number.isNaN(Date.parse(entry[field])))) {
        fail(context, `field "${field}" must be a YYYY-MM-DD date when present`);
      }
    }
    if (entry.verification_status === "verified" && !entry.last_reviewed) {
      fail(context, `"verified" requires "last_reviewed" (the date of the field-by-field review) — see METHODOLOGY.md §4`);
    }
    if (entry.date_added !== undefined && entry.date_added !== null) {
      if (typeof entry.date_added !== "string" || !ISO_DATE.test(entry.date_added) || Number.isNaN(Date.parse(entry.date_added))) {
        fail(context, `field "date_added" must be a YYYY-MM-DD date or null, got ${JSON.stringify(entry.date_added)}`);
      }
    }

    // --- optional fields: validated for shape when present ---
    for (const field of OPTIONAL_STRING_FIELDS) {
      if (entry[field] !== undefined && (typeof entry[field] !== "string" || entry[field].trim().length === 0)) {
        fail(context, `field "${field}" must be a non-empty string when present`);
      }
    }
    if (entry.related_ids !== undefined) {
      if (!Array.isArray(entry.related_ids)) {
        fail(context, `field "related_ids" must be an array when present`);
      } else if (!entry.related_ids.every((item) => typeof item === "string" && item.trim().length > 0)) {
        fail(context, `field "related_ids" must contain only non-empty strings`);
      } else if (typeof entry.id === "string" && entry.related_ids.includes(entry.id)) {
        fail(context, `field "related_ids" must not reference the entry's own "id"`);
      }
    }
    if (entry.preview_url !== undefined && entry.preview_url !== null) {
      if (typeof entry.preview_url !== "string" || !validUrl(entry.preview_url)) {
        fail(context, `field "preview_url" must be null or a well-formed http(s) URL, got ${JSON.stringify(entry.preview_url)}`);
      }
    }
  });

  // related_ids must resolve, checked once every id is known.
  data.forEach((entry, index) => {
    if (!isPlainObject(entry) || !Array.isArray(entry.related_ids)) return;
    const context = `entry #${index} (${typeof entry.id === "string" ? entry.id : "no id"})`;
    for (const relatedId of entry.related_ids) {
      if (typeof relatedId === "string" && !seenIds.has(relatedId)) {
        fail(context, `field "related_ids" references "${relatedId}", which is not an "id" of any entry in this file`);
      }
    }
  });

  return { errors, warnings };
}

export const REVIEW_METHODS = ["field-by-field", "search-based", "link-check", "derived"];

/** Checks data/review-log.json: well-formed entries that point at real records. */
export function validateReviewLog(log, data) {
  const errors = [];
  const mvIds = new Set(Array.isArray(data) ? data.map((r) => r && r.mv_id) : []);
  if (!log || !Array.isArray(log.entries)) {
    return ["data/review-log.json: must be an object with an \"entries\" array"];
  }
  log.entries.forEach((e, i) => {
    const ctx = `review-log entry #${i} (${e && e.mv_id})`;
    if (!e || typeof e !== "object") return errors.push(`${ctx}: is not an object`);
    if (!ISO_DATE.test(e.date || "")) errors.push(`${ctx}: "date" must be YYYY-MM-DD`);
    if (!mvIds.has(e.mv_id)) errors.push(`${ctx}: "mv_id" does not match any record`);
    if (!REVIEW_METHODS.includes(e.method)) errors.push(`${ctx}: "method" must be one of ${REVIEW_METHODS.join(", ")}`);
    for (const f of ["check", "reviewer", "finding"]) {
      if (typeof e[f] !== "string" || !e[f].trim()) errors.push(`${ctx}: "${f}" must be a non-empty string`);
    }
    if (!Array.isArray(e.evidence)) errors.push(`${ctx}: "evidence" must be an array of URLs`);
    else if (!e.evidence.every(validUrl)) errors.push(`${ctx}: "evidence" contains a non-http(s) URL`);
  });
  return errors;
}

export function loadVocab(root = ROOT) {
  const read = (f) => JSON.parse(readFileSync(path.join(root, "data", "vocab", f), "utf8"));
  const themes = read("themes.json");
  return {
    countries: read("countries.json").terms,
    languages: read("languages.json").terms,
    themes: themes.terms,
    themeGroups: themes.groups,
    access: read("access.json").terms,
    archiveTypes: read("archive-types.json").terms,
  };
}

function main() {
  let data;
  let vocab;
  try {
    data = JSON.parse(readFileSync(path.join(ROOT, "data", "collections.json"), "utf8"));
  } catch (err) {
    console.error(`data/collections.json could not be read or parsed: ${err.message}`);
    process.exit(1);
  }
  try {
    vocab = loadVocab();
  } catch (err) {
    console.error(`data/vocab/*.json could not be read or parsed: ${err.message}`);
    process.exit(1);
  }

  const { errors, warnings } = validate(data, vocab);
  const logPath = path.join(ROOT, "data", "review-log.json");
  if (existsSync(logPath)) {
    try {
      errors.push(...validateReviewLog(JSON.parse(readFileSync(logPath, "utf8")), data));
    } catch (err) {
      errors.push(`data/review-log.json could not be parsed: ${err.message}`);
    }
  }

  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):\n`);
    for (const message of warnings) console.warn(`  - ${message}`);
    console.warn("");
  }
  if (errors.length) {
    console.error(`\nFound ${errors.length} problem(s) in data/collections.json:\n`);
    for (const message of errors) console.error(`  - ${message}`);
    console.error("");
    process.exit(1);
  }
  console.log(`OK: data/collections.json has ${data.length} valid entries.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
