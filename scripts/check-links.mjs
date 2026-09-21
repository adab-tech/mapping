#!/usr/bin/env node
// Zero-dependency link checker for every `url` (and `preview_url`, where
// set) in data/collections.json. The entire value of this dataset is that
// its links actually work — this project's own SPEC.md data-honesty rule
// depends on entries pointing at something real, and link rot is the
// single biggest way a real, honest entry silently becomes a dead one.
// Meant to run on a schedule (see .github/workflows/check-links.yml), not
// as a merge gate — a source flapping/rate-limiting us for a few hours
// isn't a reason to block a PR, but it is worth a human noticing.
//
// Usage: node scripts/check-links.mjs
// Prints a markdown report to stdout. Exit code is always 0 (this is a
// report, not a validator) — see check-links.yml for how failures become
// a tracking issue instead of a red CI check.

import { appendFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "collections.json");

const TIMEOUT_MS = 30_000;
const CONCURRENCY = 4;
// A generic browser UA — some institutional sites block bare `fetch`/curl
// user agents outright regardless of the request otherwise being fine.
const USER_AGENT =
  "Mozilla/5.0 (compatible; MappingVoicesLinkCheck/1.0; +https://github.com/adab-tech/mapping)";

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // HEAD first (cheaper), fall back to GET. Servers reject HEAD for more
    // reasons than 405/501: institutional sites and WAFs commonly answer 403
    // (and sometimes 400) to a HEAD they would serve as a GET, and 429 is a
    // rate-limit that a single retry often clears. Treating any of these as a
    // dead link produces false positives, so retry once with GET before
    // believing them.
    const RETRY_WITH_GET = new Set([400, 403, 405, 429, 501]);
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal, headers: { "User-Agent": USER_AGENT } });
    if (RETRY_WITH_GET.has(res.status)) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal, headers: { "User-Agent": USER_AGENT } });
    }
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: null, error: err.name === "AbortError" ? "timeout" : err.message };
  } finally {
    clearTimeout(timeout);
  }
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function runOne() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runOne));
  return results;
}

async function main() {
  const collections = JSON.parse(readFileSync(DATA_PATH, "utf8"));

  const checks = [];
  for (const c of collections) {
    checks.push({ id: c.id, title: c.title, field: "url", url: c.url });
    if (c.preview_url) {
      checks.push({ id: c.id, title: c.title, field: "preview_url", url: c.preview_url });
    }
  }

  console.error(`Checking ${checks.length} link(s) across ${collections.length} entries (concurrency ${CONCURRENCY})...`);

  const results = await runWithConcurrency(checks, CONCURRENCY, async (check) => {
    const result = await checkUrl(check.url);
    return { ...check, ...result };
  });

  const failures = results.filter((r) => !r.ok);

  console.log(`# Mapping Voices link check — ${new Date().toISOString().slice(0, 10)}`);
  console.log("");
  console.log(`Checked ${results.length} links across ${collections.length} entries. ${failures.length} failed.`);
  console.log("");

  if (failures.length === 0) {
    console.log("All links responded successfully. Nothing to report.");
  } else {
    console.log("| Entry | Field | URL | Result |");
    console.log("|---|---|---|---|");
    for (const f of failures) {
      const result = f.status ? `HTTP ${f.status}` : f.error || "unknown error";
      console.log(`| \`${f.id}\` (${f.title}) | \`${f.field}\` | ${f.url} | ${result} |`);
    }
    console.log("");
    console.log(
      "A failure here doesn't always mean the link is truly dead — some sites " +
        "block automated requests, rate-limit, or have transient outages. Worth " +
        "a manual check before editing/removing an entry."
    );
  }

  // If running in GitHub Actions, expose the failure count as a step
  // output so the workflow can decide whether to open/close a tracking
  // issue without having to parse the markdown report's prose.
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `failure_count=${failures.length}\n`);
  }

  // Exit 0 regardless — see file header. Failures are surfaced via the
  // markdown report above, which the calling workflow turns into an issue.
}

main();
