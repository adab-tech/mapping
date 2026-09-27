// Checks the hand-maintained reference list of UN member states
// (data/reference/un-m49-countries.json) used by gaps.html, and that it
// agrees with the controlled country vocabulary wherever the two overlap.
//
// Run: node --test tests/*.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"));

const reference = load("data/reference/un-m49-countries.json").terms;
const vocab = load("data/vocab/countries.json").terms;

const REGIONS = {
  Africa: ["Northern Africa", "Sub-Saharan Africa"],
  Americas: ["Latin America and the Caribbean", "Northern America"],
  Asia: ["Central Asia", "Eastern Asia", "South-eastern Asia", "Southern Asia", "Western Asia"],
  Europe: ["Eastern Europe", "Northern Europe", "Southern Europe", "Western Europe"],
  Oceania: ["Australia and New Zealand", "Melanesia", "Micronesia", "Polynesia"],
};

test("lists exactly 193 UN member states", () => {
  assert.equal(reference.length, 193);
});

test("alpha-2 codes and names are unique and well-formed", () => {
  const codes = reference.map((t) => t.iso3166_1_alpha2);
  const names = reference.map((t) => t.name);
  assert.equal(new Set(codes).size, codes.length, "duplicate alpha-2 code");
  assert.equal(new Set(names).size, names.length, "duplicate name");
  for (const c of codes) assert.match(c, /^[A-Z]{2}$/);
});

test("every entry has a valid M49 region and subregion", () => {
  for (const t of reference) {
    assert.ok(REGIONS[t.region], `${t.name}: unknown region ${t.region}`);
    assert.ok(REGIONS[t.region].includes(t.subregion), `${t.name}: unknown subregion ${t.subregion}`);
  }
});

test("regional totals match UN membership (54/35/47/43/14)", () => {
  const n = {};
  for (const t of reference) n[t.region] = (n[t.region] || 0) + 1;
  assert.deepEqual(n, { Africa: 54, Americas: 35, Asia: 47, Europe: 43, Oceania: 14 });
});

test("every UN member in the country vocabulary matches by name, code, and region", () => {
  const byCode = new Map(reference.map((t) => [t.iso3166_1_alpha2, t]));
  for (const v of vocab.filter((t) => t.un_member)) {
    const r = byCode.get(v.iso3166_1_alpha2);
    assert.ok(r, `${v.name} (${v.iso3166_1_alpha2}) missing from reference list`);
    assert.equal(r.name, v.name, `name mismatch for ${v.iso3166_1_alpha2}`);
    assert.equal(r.region, v.region, `region mismatch for ${v.name}`);
    assert.equal(r.subregion, v.subregion, `subregion mismatch for ${v.name}`);
  }
});

test("non-member entities in the vocabulary are not listed as members", () => {
  const codes = new Set(reference.map((t) => t.iso3166_1_alpha2));
  for (const v of vocab.filter((t) => !t.un_member)) {
    assert.ok(!codes.has(v.iso3166_1_alpha2), `${v.name} is not a UN member`);
  }
});
