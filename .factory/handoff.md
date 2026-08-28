# Tour Route Intent — build handoff

Build work order: `tour-route-intent-build-1`
Completed: 2026-08-28

## What shipped

- A responsive, local-first GPX route-intent workbench built with Vite and strict vanilla TypeScript.
- GPX track and route import with explicit malformed/empty/oversize file errors.
- An abstract coordinate canvas with pointer selection and full keyboard operation (arrow keys to move, Enter/Space to add intent).
- Surface, water, ferry, avoid-at-night, and freeform intent notes attached to route points.
- Independent locks for places and for the original line between consecutive markers.
- Standards-compatible GPX export: readable waypoints/descriptions plus a namespaced extension that preserves lock metadata for re-import.
- Local geometric validation of a GPX returned by another navigation app, with an adjustable 20–250 m corridor, marker ordering checks, and sampled locked-segment coverage.
- Autosaved local draft, named local workspaces and note templates in the optional Field kit, offline/empty/error/result states, destructive confirmation, and undo for marker deletion.
- Sociobot one-time paid unlock contract: $12 checkout link, return-token capture and URL cleanup, local token storage, once-daily verification caching, optimistic offline behavior, invalid-license handling, restore field, and local license removal. Core import/export/validation and safety behavior are not gated.
- Light and dark survey-notebook visual treatments, reduced-motion handling, responsive 390 px layout, privacy and terms pages, service worker, sitemap, robots file, and Azure Static Web Apps configuration.
- Original generated route illustration with reviewed source/provenance in `assets/src/` and 64 KB/20 KB WebP runtime variants.

## How to run and verify

```sh
npm install
npm test
npm run build
```

The exact deploy command is `npm run build`. It produces `dist/index.html`, `dist/privacy/index.html`, and `dist/terms/index.html`. Deploy `dist/`.

Verification completed locally:

- `npm test`: 6 Vitest unit tests and 4 Playwright browser journeys passed.
- Browser journey covers example load, intent edit, GPX download, re-import of that download, successful lock validation, zero console errors, keyboard-only marker creation, legal routes, and 390 px horizontal-overflow check.
- Playwright axe integration: zero serious or critical violations.
- Factory `verify-url.sh`: HTTP 200, 525 ms local load, one H1, English language, main landmark present, no missing image alt text, no unlabeled buttons, and zero console/page errors.
- `npm run build`: passed with TypeScript strict checks.
- Bundle: 31.28 KB JS (11.25 KB gzip), 16.86 KB CSS (4.43 KB gzip), 64 KB desktop hero, 20 KB mobile hero. No runtime font, map-tile, script, or analytics requests.
- `npm audit --audit-level=high`: zero vulnerabilities.
- Lighthouse 12.5.1, mobile/default throttling against the production preview:
  - Performance: 100
  - Accessibility: 100
  - Best practices: 100
  - SEO: 100
  - FCP: 0.9 s
  - LCP: 1.1 s
  - Total blocking time: 0 ms
  - CLS: 0
- Visual inspection completed at 1440×1000 and 390×844 in Chromium, including the empty workbench and full-page layout.

## Known gaps and next steps

- The product-level success measure still needs a real field test: export representative routes, import into two target navigation apps, export the resulting geometry from each, and measure whether at least 90% retain every lock. The app includes the exact return validator needed for that study.
- The factory must register `tour-route-intent` with the Sociobot billing engine and configure its return URL before a real purchase can complete. The UI intentionally contains no hardcoded product ID and points only to the product-slug checkout/verify contract.
- Validation is geometry-based and cannot detect access legality, surface changes, live hazards, ferry cancellation, or what an app will do during turn-by-turn navigation. This is stated beside the workbench, validator, and in the terms.
- The service worker is production-only; its caching behavior should receive a final smoke test on the deployed HTTPS origin.
