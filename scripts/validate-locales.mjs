#!/usr/bin/env node
// Zero-dependency validator that every locale in locales/*.json defines
// the same set of keys as the default locale (en.json). Catches two real
// mistakes a contributor could otherwise make silently: adding a new
// UI-chrome string to one locale and forgetting the others (that key then
// falls back to English at runtime, with only a console.warn to notice
// it), or a typo'd key that never gets used because it doesn't match what
// js/app.js actually looks up.
//
// Usage: node scripts/validate-locales.mjs

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, "..", "locales");
const DEFAULT_LOCALE = "en";

const errors = [];

// A locale is allowed to define MORE plural categories than en.json under
// results.count.* — Intl.PluralRules categories are zero/one/two/few/many/
// other, and English only ever needs one/other, but a richer language
// (Arabic needs all six) legitimately defines more. js/app.js's
// announceCount() falls back to "other" for any category a locale doesn't
// define. So this prefix is exempt from the "extra key" check below; every
// locale still must define at minimum results.count.one and
// results.count.other, checked separately.
const PLURAL_PREFIX = "results.count.";
const REQUIRED_PLURAL_CATEGORIES = ["one", "other"];

function fail(context, message) {
  errors.push(`${context}: ${message}`);
}

/** Flattens a nested object into a Set of dot-paths, e.g.
 * { results: { count: { one: "..." } } } -> Set(["results.count.one"]) */
function flattenKeys(obj, prefix = "") {
  const keys = new Set();
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      for (const nested of flattenKeys(value, path)) {
        keys.add(nested);
      }
    } else {
      keys.add(path);
    }
  }
  return keys;
}

function loadLocale(code) {
  const filePath = path.join(LOCALES_DIR, `${code}.json`);
  let raw;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch {
    fail(code, `could not read ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    fail(code, `invalid JSON — ${err.message}`);
    return null;
  }
}

function main() {
  const files = readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json"));
  const locales = files.map((f) => f.replace(/\.json$/, ""));

  if (!locales.includes(DEFAULT_LOCALE)) {
    fail("locales", `no ${DEFAULT_LOCALE}.json found — it's the required fallback locale`);
    report();
    return;
  }

  const defaultData = loadLocale(DEFAULT_LOCALE);
  if (!defaultData) {
    report();
    return;
  }
  const defaultKeys = flattenKeys(defaultData);

  for (const code of locales) {
    if (code === DEFAULT_LOCALE) continue;
    const data = loadLocale(code);
    if (!data) continue;

    const keys = flattenKeys(data);

    const missing = [...defaultKeys].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !defaultKeys.has(k) && !k.startsWith(PLURAL_PREFIX));

    // Missing keys aren't a hard failure — the app falls back to English
    // for them at runtime (with a console.warn) — but they should be rare
    // and deliberate, not silent drift, so surface them as a warning.
    if (missing.length) {
      console.warn(`WARNING ${code}: missing ${missing.length} key(s) present in ${DEFAULT_LOCALE}.json: ${missing.join(", ")}`);
    }
    // Extra keys are more likely a typo (a key that doesn't match what
    // app.js actually looks up) or leftover cruft — worth failing on.
    // (results.count.* is exempt — see PLURAL_PREFIX comment above.)
    if (extra.length) {
      fail(code, `${extra.length} key(s) not present in ${DEFAULT_LOCALE}.json (likely a typo or leftover key): ${extra.join(", ")}`);
    }

    for (const category of REQUIRED_PLURAL_CATEGORIES) {
      if (!keys.has(PLURAL_PREFIX + category)) {
        fail(code, `missing required plural category "${category}" (${PLURAL_PREFIX}${category})`);
      }
    }
  }

  report();
}

function report() {
  if (errors.length) {
    console.error(`FAILED: ${errors.length} problem(s) found in locales/`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("OK: all locale files are structurally consistent with en.json.");
}

main();
