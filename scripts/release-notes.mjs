#!/usr/bin/env node
// Prints the CHANGELOG.md section for one dataset version, for use as
// GitHub release notes (see .github/workflows/release.yml).
//
// Usage: node scripts/release-notes.mjs [version]   (default: data/dataset-meta.json)
// Exits non-zero if the version has no CHANGELOG section.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function releaseNotes(changelog, version) {
  const lines = changelog.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
  if (start === -1) return null;
  let end = lines.findIndex((l, i) => i > start && /^## \[/.test(l));
  if (end === -1) end = lines.length;
  return lines.slice(start + 1, end).join("\n").trim() + "\n";
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const version =
    process.argv[2] || JSON.parse(readFileSync(path.join(ROOT, "data", "dataset-meta.json"), "utf8")).version;
  const notes = releaseNotes(readFileSync(path.join(ROOT, "CHANGELOG.md"), "utf8"), version);
  if (!notes) {
    console.error(`CHANGELOG.md has no "## [${version}]" section.`);
    process.exit(1);
  }
  const meta = JSON.parse(readFileSync(path.join(ROOT, "data", "dataset-meta.json"), "utf8"));
  process.stdout.write(
    `${notes}\n---\n\n${meta.scope_statement}\n\nData: CC BY 4.0 · Code: MIT · Methodology: ${meta.methodology}\n`
  );
}
