---
name: site-audit
description: Run the browser and accessibility audit (axe-core WCAG 2.1 AA, device emulation, reflow, keyboard, reduced motion, RTL) against a local server and fix what fails. Use after UI changes, before a release, or when asked to "test the site", "check accessibility", "check mobile".
context: fork
agent: general-purpose
---

# Site audit

1. Serve the repo: `python3 -m http.server 8765` (background).
2. Get dependencies without polluting the repo, e.g. in a scratch dir:
   `npm pack axe-core leaflet@1.9.4` and extract (both unpack to `package/`
   — extract one at a time into separate folders). Playwright: use a global
   install if present (`npm root -g`), Chromium at `/opt/pw-browsers`; do
   not run `playwright install`.
3. Run:
   ```bash
   PW=$(npm root -g)/playwright AXE=<dir>/axe.min.js LEAFLET_DIR=<dir>/dist \
     node tests/browser/audit.mjs http://localhost:8765
   ```
   (`LEAFLET_DIR` only if the unpkg CDN is unreachable.)
4. For each FAIL: reproduce, fix in the page's CSS/JS, re-run until green.
   Contrast failures on animated elements may be mid-transition — the audit
   waits for animations; confirm at rest before changing colours.
5. If you add a page, add it to the page lists in `tests/browser/audit.mjs`.
6. Update the "Last run" line and results table in
   docs/testing/BROWSER-TESTING.md. Only Chromium can run here — keep the
   manual Safari/Firefox/device/screen-reader checklist honest.
7. Stop the server.
