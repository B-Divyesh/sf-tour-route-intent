# Tour Route Intent — verification 3 handoff

- Status: **FAIL**
- Work order: `tour-route-intent-verify-3`
- Live URL: <https://tour-route-intent.sociobot.in/>
- Demo URL: <https://tour-route-intent.sociobot.in/demo/>
- Date: 6 September 2026 UTC
- Implementation SHA: `1cab72a4f9822eae6344bf74b4403cecf464b05b`
- Product documentation SHA before this report: `cb93ce7e43ce05c0bfd3ae2a904abad21fdf3c88`

The deployed product image comes from the implementation SHA. `cb93ce7` is report-only relative to `1cab72a`; this handoff and `.factory/verification-3.md` are also report-only changes.

## Verification 3 result

The clean clone passed `npm ci`, audit, lint, typecheck, 8 unit tests, 26 browser tests, build, every one of the 18 declared claim commands, and the aggregate 18-claim suite. The live deployment exactly matched 16 checked files from that build. Fresh phone and desktop first screens, the isolated demo/reset/real-data protection, accessibility, keyboard focus, reduced motion, privacy requests, legal routes, links, offline claim suite, metadata, headers, and the deliberate HTTP 404 all passed.

**Do not treat this as a release PASS.** Verification found one S2 claims-contract issue: the public Field kit statements about its $12 one-time price, unavailable new purchases, and no payment being taken by this site are not entries in `.factory/claims.json` and have no exact outcome test. This yields **3 untested public claims**. See `.factory/verification-3.md` for evidence and the required repair.

## Delivered repair

- Added a one-click `/demo/` with a realistic nine-point touring route and three practical intent notes.
- Kept demo changes in `sessionStorage` keys prefixed with `demo:`. Demo mode does not read or write the real draft, theme, workspaces, or license.
- Added the persistent **Demo — sample data, nothing is saved** label, **Reset demo**, and **Start for real**.
- Replaced metaphor copy with the GPX job, touring-cyclist audience, sample action, outcome note, and three facts on the first screen.
- Added 18 public claims and one outcome-based `@claim:` browser test for each claim.
- Added real `/demo/`, `/privacy/`, `/terms/`, and designed 404 build outputs. Unknown URLs now return HTTP 404 instead of the home page.
- Added route-specific titles, descriptions, canonicals, Open Graph, Twitter cards, a 1200 × 630 social image, and an Apple touch icon.
- Rebuilt privacy and terms pages with the shared header, footer, route identity, focus treatment, and responsive layout.
- Removed the inline-style CSP allowance. Security policy remains response-header based and keeps anti-framing enabled.
- Preserved the free GPX workflow and the paid Field kit deliverables. The public offer remains $12 once, with no checkout link while registration is unavailable.
- Added a production-artifact test server and URL verification command, including real local 404 behavior.

## Current review findings

| Finding | Current disposition |
| --- | --- |
| Sample route used real storage | Fixed. A seeded real draft remained byte-for-byte present through demo edits and reset, then returned after **Start for real**. |
| No claims contract; 16 claim categories untested | Fixed. `.factory/claims.json` now declares 18 claims, and all 18 commands passed individually from a clean checkout. |
| Metaphor first-screen copy and missing sample action | Fixed. Fresh phone and desktop screens state the GPX job, touring-cyclist audience, next result, and sample action before scrolling. |
| Missing metadata, common legal skeleton, and real 404 | Fixed. All routes have required metadata and common structure; `/not-a-real-route` returns the designed page with HTTP 404. |

## Earlier findings and minor observations

| Earlier item | Current disposition |
| --- | --- |
| Locked-line false pass | Remains fixed. The distant 12-point detour fails the two-way locked-line check in unit and browser claim tests. |
| Unavailable checkout | Product behavior remains honest. No checkout link is shown. The $12 paid tools and restore path remain documented. |
| Dark-mode action contrast | Remains fixed. Live dark/reduced-motion axe scan has zero violations. |
| Self-closing GPX points rejected | Remains fixed. Unit and browser recovery tests import self-closing track and route points. |
| Hashed assets lacked immutable caching | Remains fixed. Live hashed JS and CSS return one-year immutable caching. |
| Top-level complementary landmark warning | Remains fixed. Live axe scan has zero violations. |
| Mobile brand target below 44 px | Remains fixed. The live touch-target audit found no visible control below 44 px. |
| Missing CSP and anti-framing policy | Remains fixed. Live headers include CSP `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, and permissions restrictions. |
| Hidden populated-demo button lacked a verifier label | Fixed in `1cab72a`. Final URL verification reports zero unlabeled buttons. |
| External source link was not identified | Fixed. The visible label now reads `Source ↗` and its accessible name says it is external. |
| Brief target of 90% retention in two navigation apps | Still requires a field study. It is not presented as a public product claim. |

## Clean verification

A detached clean worktree at implementation SHA `1cab72a` ran:

```sh
npm ci
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
```

Results:

- Install: 140 packages from the committed lockfile.
- Audit: 0 vulnerabilities.
- Unit tests: 8 passed.
- Browser tests: 26 passed.
- Lint and strict typecheck: passed.
- Build: passed with `dist/index.html`, real route pages, and `dist/404.html`.
- Declared claims: all 18 `.factory/claims.json` commands passed individually in the same clean checkout.

Production sizes:

- Initial JavaScript: 33.85 KB raw / 12.00 KB gzip.
- Main CSS: 18.68 KB raw / 4.76 KB gzip.
- Legal CSS: 4.11 KB raw / 1.57 KB gzip.
- Fonts: none.
- Home illustration: 62.44 KB desktop / 19.10 KB mobile.
- Social image: 147.62 KB and 1200 × 630.

## Live verification

The exact `dist/` from `1cab72a` was deployed to the existing `sf-tour-route-intent` Static Web App. Sixteen checked live files matched local SHA-256 values, including all HTML routes, the deliberate 404 body, hashed assets, images, service worker, robots, and sitemap.

- Factory URL verification: home and demo return 200, one H1, English language, one main landmark, complete image alternatives, zero unlabeled buttons, and zero console errors.
- Fresh first screens: sample action starts at 479 px on 1440 × 1000 desktop and 352 px on 390 × 844 phone.
- Demo journey: 9 points and 3 intent markers; reset restored the seed; the real draft was unchanged.
- Route responses: privacy 200, terms 200, deliberate unknown route 404 with the correct title and return link.
- Metadata: all checked routes have title, description, canonical, Open Graph, Twitter card, Apple icon, and one H1.
- Accessibility: live axe in phone dark mode with reduced motion found zero violations. All visible controls were at least 44 px.
- Keyboard and zoom: first Tab reached the skip link with a 3 px focus ring; 200% text retained a 390 px layout without horizontal overflow.
- Offline: service worker controlled the demo after first visit, had no waiting update, and restored the nine-point sample offline without errors.
- Privacy: the complete live sample export/reimport check made only same-origin requests and wrote no real local-storage key.
- Links: every internal link returned 200; mail links were explicit; the external source returned 200. The 404 skip link correctly remains on the deliberate 404 response.
- Cache policy: hashed JS/CSS use `public, max-age=31536000, immutable`; documents and service worker use short revalidation.

Live Lighthouse 13.0.1 mobile/default throttling:

| Category or metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.9 s |
| LCP | 1.0 s |
| TBT | 30 ms |
| CLS | 0 |

INP was not measured in the navigation-only lab run. Browser journeys separately exercised pointer, touch, and keyboard actions.

## Evidence

- Clean final run and every declared claim: `/work/.evidence/clean-verification-final.log`
- Factory URL checks and screenshots: `/work/.evidence/live-final-home-v2/`, `/work/.evidence/live-final-demo-v2/`
- Fresh browser journey: `/work/.evidence/live-browser-check.txt`
- Phone and desktop cold screenshots: `/work/.evidence/live-cold-phone.png`, `/work/.evidence/live-cold-desktop.png`
- Offline/update: `/work/.evidence/live-offline-check.txt`
- Privacy request log: `/work/.evidence/live-privacy-check.txt`
- Metadata and links: `/work/.evidence/live-metadata-check.txt`, `/work/.evidence/live-link-check-final.txt`
- Responsive, target, and keyboard checks: `/work/.evidence/live-responsive-keyboard-check-final.txt`
- Local/live SHA matches: `/work/.evidence/live-sha256-match.txt`
- Lighthouse JSON: `/work/.evidence/lighthouse-live.json`
- Catalog description: `/work/.evidence/catalog-description.txt`
- Billing offer metadata: `/work/.evidence/billing-offer.json`

## Remaining external work

1. Factory billing registration is still required before new Field kit purchases can be offered. Existing license verification remains available; no credentials or fake checkout are present.
2. The researched 90% two-app retention outcome still needs a real field study with two target navigation apps. The product does not claim that result.

No backend, tenant database, CLI, desktop package, or multi-replica state exists for this static product, so backend isolation, restart persistence, health, 429, and consumer-install checks do not apply.
