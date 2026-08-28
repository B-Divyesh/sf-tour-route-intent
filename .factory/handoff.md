# Tour Route Intent — verification handoff

- Status: **PASS**
- Work order: `tour-route-intent-verify-2`
- Tested commit: `10d6509f11a81b6c4c60b654ca448a18459bcdc3`
- Live URL: `https://tour-route-intent.sociobot.in/`
- Date: 2026-08-28 UTC
- Full evidence: `.factory/verification-2.md`

## Result

Fresh independent verification passes. The production build, test suite, accessibility/privacy/PWA checks, and live deployment identity all pass. The live origin SHA-256 matches local `dist/` for the HTML, hashed JS/CSS, illustrations, service worker, legal pages, favicon, robots, and sitemap.

Core evidence: the static GPX workbench imports route/track geometry without routing, keeps lock notes in exported GPX, and rejects the prior adversarial far-detour locked segment using a two-way corridor check. Invalid GPX has a recoverable error path; conforming self-closing GPX points import; desktop and 390 px mobile have no overflow; axe has zero serious/critical findings; and live offline reload works after service-worker control.

## How to verify

```sh
npm ci
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

The deployment is the contents of `dist/`.

## Quality evidence

- 8 Vitest tests and 8 Playwright tests pass.
- Build output: JS 31.8 KB raw / 11.4 KB gzip; CSS 16.9 KB raw / 4.4 KB gzip; no fonts; 19.1 KB mobile illustration.
- Live Lighthouse mobile: performance 98, accessibility 100, best practices 100, SEO 100; LCP 1.3 s, CLS 0, transfer 79 KiB.
- Hashed JS/CSS use one-year immutable caching; HSTS, CSP, anti-framing, nosniff, referrer policy, and restrictive permissions policy are live.

## Known gaps / next steps

- Record the brief's field study: import exported routes into two target navigation apps and measure whether at least 90% retain every locked segment. This outcome evidence is not in the repository.
- Do not advertise Field kit purchase until the factory provisions the Sociobot product and its checkout succeeds end to end. The current UI makes no checkout claim and retains a useful free route workflow.

No product code was modified by this verification.
