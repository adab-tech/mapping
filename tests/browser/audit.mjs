#!/usr/bin/env node
// Browser audit for Mapping Voices: accessibility (axe-core, WCAG 2.1 A/AA),
// device emulation, keyboard-only operation, reflow at 320 CSS px (≈400%
// zoom), reduced motion, and RTL. Not part of CI (it needs a browser);
// run it before a release.
//
// Requirements: Playwright with at least Chromium, and axe-core:
//   npm i --no-save playwright axe-core      (or set PW / AXE to their paths)
// Serve the site first:  python3 -m http.server 8765
// Then:                  node tests/browser/audit.mjs [baseUrl]
//
// Map tiles and web fonts are blocked during the run so results don't
// depend on third-party servers. If the Leaflet CDN is unreachable, set
// LEAFLET_DIR to a local copy of leaflet/dist.

import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const pw = require(process.env.PW || "playwright");
const axeSource = readFileSync(process.env.AXE || require.resolve("axe-core/axe.min.js"), "utf8");
const BASE = (process.argv[2] || "http://localhost:8765").replace(/\/$/, "");
const LEAFLET_DIR = process.env.LEAFLET_DIR;

const results = [];
const record = (area, name, ok, detail = "") => results.push({ area, name, ok, detail });

async function newPage(browser, contextOptions = {}) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  if (LEAFLET_DIR) {
    await page.route("**/unpkg.com/leaflet@1.9.4/dist/*", (r) => {
      const f = r.request().url().split("/").pop();
      const file = path.join(LEAFLET_DIR, f);
      if (!existsSync(file)) return r.abort();
      r.fulfill({ body: readFileSync(file), contentType: f.endsWith(".css") ? "text/css" : "application/javascript" });
    });
  }
  await page.route(/tile\.openstreetmap|fonts\.(googleapis|gstatic)/, (r) => r.abort());
  return { context, page };
}

async function axe(page, label) {
  // Let CSS transitions (e.g. Leaflet's popup fade-in) finish; axe measures
  // contrast at the current opacity and would report mid-fade false positives.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));
  await page.waitForTimeout(300);
  await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(async () =>
    window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })
  );
  const serious = res.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  record("a11y", `axe WCAG 2.1 AA — ${label}`, res.violations.length === 0,
    res.violations.map((v) => `${v.impact}: ${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`).join("\n      "));
  return { all: res.violations, serious };
}

const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

async function run() {
  const browser = await pw.chromium.launch();

  // ---- accessibility: every page, plus the atlas with a record open ----
  for (const [label, url, ready] of [
    ["atlas", "/", ".result-item"],
    ["atlas, record open", "/?c=MV-000023", ".detail-title"],
    ["about", "/about.html", "#page-title"],
    ["language explorer", "/languages.html#lang-hausa", "#lang-hausa[open]"],
  ]) {
    const { context, page } = await newPage(browser);
    await page.goto(BASE + url);
    await page.waitForSelector(ready);
    await axe(page, label);
    record("errors", `no JS errors — ${label}`, page.errors.length === 0, page.errors.join("; "));
    await context.close();
  }

  // ---- devices (Chromium emulation of viewport, DPR, touch, UA) ----
  for (const name of ["iPhone SE", "iPhone 13", "Pixel 7", "Galaxy S9+", "iPad (gen 7)", "iPad Pro 11 landscape"]) {
    const device = pw.devices[name];
    for (const [label, url, ready] of [["atlas", "/?c=MV-000001", ".detail-title"], ["languages", "/languages.html", ".lx-item"], ["about", "/about.html", "#page-title"]]) {
      const { context, page } = await newPage(browser, { ...device });
      await page.goto(BASE + url);
      await page.waitForSelector(ready);
      record("devices", `${name} — ${label}: no horizontal overflow`, await noOverflow(page));
      await context.close();
    }
  }

  // ---- reflow: 320 CSS px wide (WCAG 1.4.10) ----
  for (const url of ["/", "/about.html", "/languages.html"]) {
    const { context, page } = await newPage(browser, { viewport: { width: 320, height: 640 } });
    await page.goto(BASE + url);
    await page.waitForLoadState("networkidle");
    record("reflow", `320px ${url}: no horizontal scroll`, await noOverflow(page));
    await context.close();
  }

  // ---- keyboard-only: atlas ----
  {
    const { context, page } = await newPage(browser, { viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + "/");
    await page.waitForSelector(".result-item");
    await page.keyboard.press("Tab");
    const skip = await page.evaluate(() => document.activeElement.className);
    record("keyboard", "first Tab reaches the skip link", skip.includes("skip-link"), skip);
    // Reach the search field by tabbing, type, then tab to the first result and open it.
    let reached = false;
    for (let i = 0; i < 20 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(() => document.activeElement.id === "filter-search");
    }
    record("keyboard", "search field reachable by Tab", reached);
    await page.keyboard.type("griot");
    await page.waitForTimeout(300);
    let onResult = false;
    for (let i = 0; i < 12 && !onResult; i++) {
      await page.keyboard.press("Tab");
      onResult = await page.evaluate(() => document.activeElement.classList.contains("result-item"));
    }
    await page.keyboard.press("Enter");
    const opened = await page.$eval(".detail-title", (e) => e.textContent).catch(() => null);
    record("keyboard", "result opens its record with Enter", Boolean(opened), opened || "");
    const focusVisible = await page.evaluate(() => {
      const el = document.activeElement;
      const s = getComputedStyle(el);
      return s.outlineStyle !== "none" || s.boxShadow !== "none";
    });
    record("keyboard", "focused element has a visible focus indicator", focusVisible);
    // A map pin is focusable and activates with Enter.
    const pinOk = await page.evaluate(() => {
      const pin = document.querySelector(".leaflet-marker-icon");
      return Boolean(pin && pin.getAttribute("tabindex") === "0" && pin.getAttribute("role") === "button" && pin.getAttribute("aria-label"));
    });
    record("keyboard", "map pins are focusable buttons with labels", pinOk);
    await context.close();
  }

  // ---- keyboard-only: mobile drawer focus trap + Escape ----
  {
    const { context, page } = await newPage(browser, { viewport: { width: 375, height: 800 } });
    await page.goto(BASE + "/");
    await page.waitForSelector(".result-item", { state: "attached" });
    await page.focus("#filters-toggle");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(350);
    const inDrawer = await page.evaluate(() => document.getElementById("filters-drawer").contains(document.activeElement));
    record("keyboard", "mobile: opening filters moves focus into the drawer", inDrawer);
    for (let i = 0; i < 60; i++) await page.keyboard.press("Tab");
    const trapped = await page.evaluate(() => document.getElementById("filters-drawer").contains(document.activeElement));
    record("keyboard", "mobile: Tab stays inside the open drawer", trapped);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(350);
    const back = await page.evaluate(() => document.activeElement.id);
    record("keyboard", "mobile: Escape closes the drawer and restores focus", back === "filters-toggle", back);
    await context.close();
  }

  // ---- keyboard-only: language explorer ----
  {
    const { context, page } = await newPage(browser, { viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + "/languages.html");
    await page.waitForSelector(".lx-item");
    await page.focus("#lang-hausa summary");
    await page.keyboard.press("Enter");
    record("keyboard", "explorer: Enter expands a language", await page.$eval("#lang-hausa", (d) => d.open));
    await context.close();
  }

  // ---- reduced motion ----
  {
    const { context, page } = await newPage(browser, { viewport: { width: 375, height: 800 }, reducedMotion: "reduce" });
    await page.goto(BASE + "/");
    await page.waitForSelector(".result-item", { state: "attached" });
    const dur = await page.$eval("#filters-drawer", (e) => getComputedStyle(e).transitionDuration);
    record("motion", "prefers-reduced-motion removes drawer animation", parseFloat(dur) < 0.01, dur);
    await context.close();
  }

  // ---- RTL (Arabic) ----
  {
    const { context, page } = await newPage(browser, { viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + "/?c=MV-000023");
    await page.waitForSelector(".detail-title");
    await page.selectOption("#lang-select", "ar");
    await page.waitForTimeout(400);
    record("rtl", "Arabic sets dir=rtl and keeps the open record", (await page.evaluate(() => document.dir)) === "rtl" && Boolean(await page.$(".detail-title")));
    record("rtl", "Arabic: no horizontal overflow", await noOverflow(page));
    await axe(page, "atlas in Arabic (RTL)");
    await page.selectOption("#lang-select", "en");
    await context.close();
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  [${r.area}] ${r.name}${!r.ok && r.detail ? "\n      " + r.detail : ""}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  process.exitCode = failed.length ? 1 : 0;
}

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
