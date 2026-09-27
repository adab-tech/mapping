# Browser, device, and accessibility testing

**Last run:** 2026-09-27, dataset v0.4.0 · **Automated result:** 69 / 69 checks passed

## What was tested, and how

Automated with `tests/browser/audit.mjs` (Playwright + axe-core 4.13) in
**Chromium** — the only engine available in the environment that ran it.
Map tiles and web fonts were blocked during the run so results don't depend
on third-party servers.

| Area | Checks | Result |
|---|---|---|
| Accessibility (axe-core, WCAG 2.1 A + AA) | Atlas; atlas with a record and map popup open; About; Language Explorer; Theme Explorer; Coverage gaps; atlas in Arabic (RTL) | ✅ 0 violations |
| JavaScript errors | All six page states | ✅ none |
| Device emulation | iPhone SE, iPhone 13, Pixel 7, Galaxy S9+, iPad (gen 7), iPad Pro 11 landscape × atlas / Language Explorer / Theme Explorer / Coverage gaps / About | ✅ no horizontal overflow (30/30) |
| Reflow (WCAG 1.4.10) | All five pages at 320 CSS px (≈ 400 % zoom) | ✅ no horizontal scrolling |
| Keyboard | Skip link first; search reachable by Tab; result opens with Enter; visible focus; map pins are labelled, focusable buttons; mobile drawer takes focus, traps Tab, closes on Escape and restores focus; Explorer entries open with Enter | ✅ all |
| Reduced motion | `prefers-reduced-motion` removes drawer animation | ✅ |
| RTL | Arabic switches `dir=rtl`, keeps the open record, no overflow, passes axe | ✅ |
| Viewports | Atlas with a record open at 844×390, 667×375, 1024×768, 1440×900, 2560×1440, 3840×2160 (fits the screen on desktop, map usable, landscape record is a side sheet); About at 2560 and 3840 (text scales up, line length bounded); 44 px touch targets on iPhone 13 | ✅ |

## Viewport matrix (responsive pass, 2026-09-27)

Every page (atlas, atlas with a record open, atlas with the filters drawer
open, About, Languages, Themes, Coverage gaps) was screenshotted and
measured in Chromium at each size below, plus Arabic (RTL) at 390×844,
844×390 and 1440×900, and 200 % / 400 % zoom equivalents (640×400,
960×540, 720×450, 320×200). Touch emulation was on for widths up to 1024.
After the fixes: **no horizontal overflow in any of the 89 page states**.

| Viewport | Before | After |
|---|---|---|
| 320×568 | Eyebrow wrapped to two lines; footer links 3 rows of 19 px targets | One-line eyebrow; single swipeable footer row, 44 px targets |
| 375×667, 390×844 | Leaflet zoom buttons painted **over** the open filters drawer; header controls 40 px / 25 px tall | Map is its own stacking context; controls ≥ 44 px |
| 844×390, 667×375 (landscape) | Header 83 px + map 320 px min-height > screen, page scrolled; record bottom sheet covered 80 % of the map, full width | Compact 55 px header, one-line footer, map fills the rest (282 / 267 px); record is a 416 px side sheet with the pin centred in the visible map |
| 768×1024 (tablet portrait) | Record sheet 80 % tall | 62 % tall, pin centred above it |
| 1024×768, 1024×1366 | 3-column atlas left the map 320 px wide; **page 18,823 px tall** | Map 448 px wide; atlas exactly one screen tall |
| 1280×800 – 1440×900 | Page and map ~18,700 px tall (index list stretched the grid row), map centre far below the fold | One screen tall; panels scroll inside |
| 1920, 2560, 3840 wide | Same 18,700 px page; 16 px text and 21 rem panels on a 3840 screen; reading pages' header pinned to the far edges | UI scales from 1800 px (24 px text at 3840); panels up to 24 / 30 rem; header/footer in a centred 90 rem frame |
| Reading pages, phones | Header nav wrapped to 3 rows (163 px) of 20 px-tall links | One swipeable row, "Open the atlas" first, 44 px targets (header 123 px) |
| 200 % / 400 % zoom | As the matching mobile / landscape sizes above | No horizontal scroll; at 320×200 the map keeps 192 px and the record opens as a side sheet |

Inline links inside running text and data tables, and Leaflet's own
attribution links, are left at text size (WCAG 2.5.8 inline exception).

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
