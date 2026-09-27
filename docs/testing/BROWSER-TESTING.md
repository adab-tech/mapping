# Browser, device, and accessibility testing

**Last run:** 2026-09-27, dataset v0.3.0 · **Automated result:** 42 / 42 checks passed

## What was tested, and how

Automated with `tests/browser/audit.mjs` (Playwright + axe-core 4.13) in
**Chromium** — the only engine available in the environment that ran it.
Map tiles and web fonts were blocked during the run so results don't depend
on third-party servers.

| Area | Checks | Result |
|---|---|---|
| Accessibility (axe-core, WCAG 2.1 A + AA) | Atlas; atlas with a record and map popup open; About; Language Explorer; atlas in Arabic (RTL) | ✅ 0 violations |
| JavaScript errors | All four page states | ✅ none |
| Device emulation | iPhone SE, iPhone 13, Pixel 7, Galaxy S9+, iPad (gen 7), iPad Pro 11 landscape × atlas / Language Explorer / About | ✅ no horizontal overflow (18/18) |
| Reflow (WCAG 1.4.10) | All three pages at 320 CSS px (≈ 400 % zoom) | ✅ no horizontal scrolling |
| Keyboard | Skip link first; search reachable by Tab; result opens with Enter; visible focus; map pins are labelled, focusable buttons; mobile drawer takes focus, traps Tab, closes on Escape and restores focus; Explorer entries open with Enter | ✅ all |
| Reduced motion | `prefers-reduced-motion` removes drawer animation | ✅ |
| RTL | Arabic switches `dir=rtl`, keeps the open record, no overflow, passes axe | ✅ |

One issue found and fixed in the test itself: axe initially flagged the map
popup's text contrast because it measured during Leaflet's fade-in
animation. At full opacity the popup passes; the audit now waits for
animations to finish before measuring.

### Earlier fixes from testing (v0.2.0)

- Filter column overflowed its panel on desktop (long option labels).
- Record sheet was offset on phones narrower than 480 px.
- Detail labels raised from a 3.6 : 1 to a ≥ 4.5 : 1 contrast colour.

## What was **not** tested — manual checklist

Device emulation in Chromium reproduces viewport size, pixel density,
touch, and user agent, but **not** the rendering engines of Safari
(WebKit) or Firefox (Gecko), and not real screen readers. Automated
accessibility tools catch only part of what a person will. Before calling
the v1.0 accessibility and browser items done, someone should run through
this list on real browsers and devices:

| Browser / device | Atlas: map, pins, popup | Search + filters + URL | Record panel / bottom sheet | Language Explorer | About |
|---|---|---|---|---|---|
| Safari (macOS) | ☐ | ☐ | ☐ | ☐ | ☐ |
| Firefox (desktop) | ☐ | ☐ | ☐ | ☐ | ☐ |
| Chrome / Edge (desktop) | ☐ | ☐ | ☐ | ☐ | ☐ |
| iOS Safari (iPhone) | ☐ | ☐ | ☐ | ☐ | ☐ |
| Android Chrome | ☐ | ☐ | ☐ | ☐ | ☐ |

For each cell, check: the page loads; nothing overlaps or scrolls
sideways; pinch-zoom and rotation work (mobile); back/forward restore the
filtered view; copy-link works; switching to Arabic mirrors the layout.

Screen readers:

- ☐ VoiceOver (iOS Safari and macOS Safari): pins announce their
  collection; the result count is announced when filters change; the
  bottom sheet is announced and can be dismissed.
- ☐ NVDA or JAWS with Firefox/Chrome on Windows: same checks, plus the
  Explorer's expandable entries announce expanded/collapsed.
- ☐ TalkBack (Android Chrome).

## Re-running the automated audit

```bash
npm i --no-save playwright axe-core     # or point PW / AXE at existing installs
python3 -m http.server 8765 &
node tests/browser/audit.mjs            # exits non-zero if any check fails
```

If the Leaflet CDN is unreachable, set `LEAFLET_DIR` to a local copy of
`leaflet/dist`.
