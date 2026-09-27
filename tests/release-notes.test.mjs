import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { releaseNotes } from "../scripts/release-notes.mjs";

const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
const meta = JSON.parse(readFileSync(new URL("../data/dataset-meta.json", import.meta.url), "utf8"));

test("the current dataset version has a CHANGELOG section (a release can be cut)", () => {
  const notes = releaseNotes(changelog, meta.version);
  assert.ok(notes && notes.length > 50, `no CHANGELOG section for ${meta.version}`);
  assert.ok(!notes.includes("## ["), "section must stop before the next version");
});

test("unknown versions return null", () => {
  assert.equal(releaseNotes(changelog, "9.9.9"), null);
});
