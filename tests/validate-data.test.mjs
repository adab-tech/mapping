// Data tests for scripts/validate-data.mjs (Work Plan §16 "Data tests").
// Run: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validate, validateReviewLog, loadVocab, canonicalUrl } from "../scripts/validate-data.mjs";

const vocab = loadVocab();
const dataset = JSON.parse(readFileSync(new URL("../data/collections.json", import.meta.url), "utf8"));

const base = () => ({
  id: "test-collection",
  mv_id: "MV-999999",
  title: "Test Collection",
  archive: "Test Archive",
  country: "Niger",
  lat: 13.5,
  lng: 2.1,
  languages: ["Hausa"],
  themes: ["oral tradition"],
  decade_start: 1990,
  decade_end: null,
  summary: "A test.",
  url: "https://example.org/collection",
  verification_status: "needs_review",
  provenance: "test fixture",
  date_added: "2026-09-27",
});

const errorsFor = (records) => validate(records, vocab).errors;

test("the committed dataset passes", () => {
  assert.deepEqual(errorsFor(dataset), []);
});

test("a minimal valid record passes", () => {
  assert.deepEqual(errorsFor([base()]), []);
});

test("required fields: missing title, url, mv_id, verification_status, provenance", () => {
  for (const field of ["title", "url", "mv_id", "verification_status", "provenance"]) {
    const r = base();
    delete r[field];
    assert.ok(errorsFor([r]).some((e) => e.includes(`"${field}"`)), field);
  }
});

test("duplicate detection: id, mv_id, canonical URL, title+archive", () => {
  const a = base();
  const b = { ...base(), url: "http://www.example.org/collection/" };
  const errs = errorsFor([a, b]).join("\n");
  assert.match(errs, /"id" \("test-collection"\) is not unique/);
  assert.match(errs, /"mv_id" \("MV-999999"\) is not unique/);
  assert.match(errs, /"url" duplicates test-collection/);
  assert.match(errs, /same title and archive/);
});

test("canonicalUrl ignores scheme, www and trailing slash", () => {
  assert.equal(canonicalUrl("https://www.Example.org/a/"), canonicalUrl("http://example.org/a"));
});

test("malformed mv_id", () => {
  assert.ok(errorsFor([{ ...base(), mv_id: "MV-12" }]).some((e) => e.includes("MV-000123")));
});

test("coordinate validation: out of range and Null Island", () => {
  assert.ok(errorsFor([{ ...base(), lat: 91 }]).some((e) => e.includes('"lat"')));
  assert.ok(errorsFor([{ ...base(), lng: -181 }]).some((e) => e.includes('"lng"')));
  assert.ok(errorsFor([{ ...base(), lat: 0, lng: 0 }]).some((e) => e.includes("Null Island")));
});

test("URL validation rejects non-http schemes", () => {
  assert.ok(errorsFor([{ ...base(), url: "javascript:alert(1)" }]).some((e) => e.includes('"url"')));
});

test("controlled vocabularies: country, language, theme", () => {
  assert.ok(errorsFor([{ ...base(), country: "USA" }]).some((e) => e.includes("countries.json")));
  assert.ok(errorsFor([{ ...base(), languages: ["Hausa language"] }]).some((e) => e.includes("languages.json")));
  assert.ok(errorsFor([{ ...base(), themes: ["Oral Tradition"] }]).some((e) => e.includes("themes.json")));
});

test("'Multiple languages' requires a language_note", () => {
  assert.ok(errorsFor([{ ...base(), languages: ["Multiple languages"] }]).some((e) => e.includes("language_note")));
  assert.deepEqual(errorsFor([{ ...base(), languages: ["Multiple languages"], language_note: "multiple Nigerien languages" }]), []);
});

test("verification_status must be from the controlled list", () => {
  assert.ok(errorsFor([{ ...base(), verification_status: "done" }]).some((e) => e.includes("verification_status")));
});

test("period: end before start, future end", () => {
  assert.ok(errorsFor([{ ...base(), decade_end: 1980 }]).some((e) => e.includes("precedes")));
  assert.ok(errorsFor([{ ...base(), decade_end: 3000 }]).some((e) => e.includes("future")));
});

test("related_ids must resolve and not self-reference", () => {
  assert.ok(errorsFor([{ ...base(), related_ids: ["nope"] }]).some((e) => e.includes('"nope"')));
  assert.ok(errorsFor([{ ...base(), related_ids: ["test-collection"] }]).some((e) => e.includes("own")));
});

test("http:// URLs warn but do not fail", () => {
  const { errors, warnings } = validate([{ ...base(), url: "http://example.org/x" }], vocab);
  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 1);
});

test("historical period: optional, integer years, ordered", () => {
  assert.deepEqual(errorsFor([{ ...base(), historical_period_start: 1947, historical_period_end: 1947 }]), []);
  assert.ok(errorsFor([{ ...base(), historical_period_start: "1940s" }]).some((e) => e.includes("historical_period_start")));
  assert.ok(errorsFor([{ ...base(), historical_period_start: 1960, historical_period_end: 1950 }]).some((e) => e.includes("precedes")));
});

test("'verified' requires last_reviewed", () => {
  assert.ok(errorsFor([{ ...base(), verification_status: "verified" }]).some((e) => e.includes("last_reviewed")));
  assert.deepEqual(errorsFor([{ ...base(), verification_status: "verified", last_reviewed: "2026-09-27" }]), []);
  assert.ok(errorsFor([{ ...base(), last_reviewed: "27/09/2026" }]).some((e) => e.includes("last_reviewed")));
});

test("review log: committed log is valid", () => {
  const log = JSON.parse(readFileSync(new URL("../data/review-log.json", import.meta.url), "utf8"));
  assert.deepEqual(validateReviewLog(log, dataset), []);
});

test("review log: rejects unknown mv_id, bad method, bad evidence", () => {
  const entry = { date: "2026-09-27", mv_id: "MV-000001", check: "link", method: "search-based", reviewer: "x", finding: "y", evidence: ["https://example.org"] };
  assert.deepEqual(validateReviewLog({ entries: [entry] }, dataset), []);
  assert.equal(validateReviewLog({ entries: [{ ...entry, mv_id: "MV-999999" }] }, dataset).length, 1);
  assert.equal(validateReviewLog({ entries: [{ ...entry, method: "vibes" }] }, dataset).length, 1);
  assert.equal(validateReviewLog({ entries: [{ ...entry, evidence: ["ftp://x"] }] }, dataset).length, 1);
});
