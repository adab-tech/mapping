#!/usr/bin/env node
// Zero-dependency validator for data/collections.json against the schema
// documented in SPEC.md and data/schema-notes.md. Uses only Node built-ins
// so it can run in CI (or locally) with no `npm install` step.
//
// Usage: node scripts/validate-data.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "collections.json");

const REQUIRED_STRING_FIELDS = ["id", "title", "archive", "country", "summary", "url"];
const REQUIRED_ARRAY_FIELDS = ["languages", "themes"];
const CURRENT_YEAR = new Date().getFullYear();
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Collects error strings instead of throwing immediately, so one run
 * reports every problem in the file rather than stopping at the first. */
const errors = [];

function fail(context, message) {
  errors.push(`${context}: ${message}`);
}

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

function validateEntry(entry, index, seenIds) {
  const context = `entry #${index} (${entry && typeof entry.id === "string" ? entry.id : "no id"})`;

  if (!isPlainObject(entry)) {
    fail(context, "is not a JSON object");
    return;
  }

  // --- required string fields ---
  for (const field of REQUIRED_STRING_FIELDS) {
    const value = entry[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      fail(context, `field "${field}" must be a non-empty string`);
    }
  }

  // --- id: kebab-case + uniqueness ---
  if (typeof entry.id === "string") {
    if (!KEBAB_CASE.test(entry.id)) {
      fail(context, `field "id" ("${entry.id}") must be kebab-case (lowercase letters, digits, hyphens only)`);
    }
    if (seenIds.has(entry.id)) {
      fail(context, `field "id" ("${entry.id}") is not unique — already used by another entry`);
    } else {
      seenIds.add(entry.id);
    }
  }

  // --- lat / lng ---
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

  // --- languages / themes: non-empty arrays of non-empty strings ---
  for (const field of REQUIRED_ARRAY_FIELDS) {
    const value = entry[field];
    if (!Array.isArray(value) || value.length === 0) {
      fail(context, `field "${field}" must be a non-empty array`);
    } else if (!value.every((item) => typeof item === "string" && item.trim().length > 0)) {
      fail(context, `field "${field}" must contain only non-empty strings`);
    }
  }

  // --- decade_start / decade_end ---
  if (!Number.isInteger(entry.decade_start)) {
    fail(context, `field "decade_start" must be an integer year, got ${JSON.stringify(entry.decade_start)}`);
  } else if (entry.decade_start < 1800 || entry.decade_start > CURRENT_YEAR) {
    fail(context, `field "decade_start" (${entry.decade_start}) is outside a plausible range (1800-${CURRENT_YEAR})`);
  }

  if (entry.decade_end !== null) {
    if (!Number.isInteger(entry.decade_end)) {
      fail(context, `field "decade_end" must be an integer year or null, got ${JSON.stringify(entry.decade_end)}`);
    } else {
      if (entry.decade_end > CURRENT_YEAR) {
        fail(context, `field "decade_end" (${entry.decade_end}) is in the future`);
      }
      if (Number.isInteger(entry.decade_start) && entry.decade_end < entry.decade_start) {
        fail(context, `field "decade_end" (${entry.decade_end}) precedes "decade_start" (${entry.decade_start})`);
      }
    }
  }

  // --- url ---
  if (typeof entry.url === "string" && !validUrl(entry.url)) {
    fail(context, `field "url" ("${entry.url}") is not a well-formed http(s) URL`);
  }
}

function main() {
  let raw;
  try {
    raw = readFileSync(DATA_PATH, "utf8");
  } catch (err) {
    console.error(`Could not read ${DATA_PATH}: ${err.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`data/collections.json is not valid JSON: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error("data/collections.json must be a JSON array of collection objects.");
    process.exit(1);
  }

  if (data.length === 0) {
    console.error("data/collections.json is empty — expected roughly 25-30 seed entries.");
    process.exit(1);
  }

  const seenIds = new Set();
  data.forEach((entry, index) => validateEntry(entry, index, seenIds));

  if (errors.length > 0) {
    console.error(`\nFound ${errors.length} problem(s) in data/collections.json:\n`);
    for (const message of errors) {
      console.error(`  - ${message}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log(`OK: data/collections.json has ${data.length} valid entries.`);
  process.exit(0);
}

main();
