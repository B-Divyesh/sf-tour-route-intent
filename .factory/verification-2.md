# Independent product verification — PASS

- Work order: `tour-route-intent-verify-2`
- Candidate commit: `10d6509f11a81b6c4c60b654ca448a18459bcdc3`
- Repository: `https://github.com/B-Divyesh/sf-tour-route-intent.git`
- Live URL: `https://tour-route-intent.sociobot.in/`
- Verified: 2026-08-28 UTC
- Artifact: static web PWA
- Verdict: **PASS**

This is a fresh verification of the repaired candidate, not a reuse of the earlier failure report. The checkout began at the specified commit with a clean worktree. `npm ci` was used before all repository gates and a fresh production build. No product code was changed during verification.

## Release decision

**PASS — the deployed static product matches candidate `10d6509f11a81b6c4c60b654ca448a18459bcdc3` and meets the core GPX intent preservation job.** The application imports a known line without routing it, records point/segment locks and concise notes, exports standard GPX, and locally rejects a returned route that departs from a locked segment.

No S1, S2, or S3 product defects were found in this verification.

The prior release blockers were independently reproduced as fixed:

- A 12-point candidate which inserts `56.5,-4.5` between every affected original locked-span vertex now returns **“Some intent was lost”** and a two-way-corridor failure, rather than a false pass.
- Valid self-closing `<trkpt/>` GPX imports as a two-point route.
- The product does not advertise or link an unavailable checkout; its free export and validation workflow is complete without an account.
- System dark mode (including reduced motion at 390 px) has no axe serious/critical contrast findings.

## Clean checkout and production gates

| Check | Evidence | Result |
| --- | --- | --- |
| Candidate identity | `git rev-parse HEAD` returned `10d6509f11a81b6c4c60b654ca448a18459bcdc3`; worktree clean before verification | PASS |
| Install | `npm ci`: 140 packages from committed lockfile | PASS |
| Dependency audit | `npm audit --audit-level=high`: 0 vulnerabilities | PASS |
| Lint | `npm run lint` (ESLint 10) | PASS |
| Type check | `npm run typecheck` (`tsc --noEmit`) | PASS |
| Unit and browser tests | `npm test`: 8 Vitest tests and 8 Playwright tests | PASS |
| Exact build | `npm run build` (`tsc --noEmit && vite build`) produced `dist/index.html` | PASS |

Production bundle sizes from this build:

- JavaScript: 31,806 bytes raw / 11,448 bytes gzip (under 200 KB budget).
- CSS: 16,872 bytes raw / 4,406 bytes gzip (under 50 KB budget).
- Fonts: none; no remote font dependency.
- Illustration: 62,444 bytes desktop and 19,102 bytes mobile WebP (under 300 KB mobile-image budget).

## End-to-end product evidence

Fresh Chromium/Playwright checks against the production preview covered:

- Empty state, example route, intent selection/editing, standard GPX export, return validation, and the clear confirmation cancel/confirm paths.
- Core adversarial case: the locked segment detour above fails; the rendered result explicitly cites the two-way line check.
- Boundary manual coordinates: `90, 180` appends successfully. Latitude `91` fails native validation and does not mutate the route; the form remains usable afterward.
- Invalid-file recovery: non-GPX input displays a clear alert, and importing a valid self-closing GPX afterward restores a two-point route named “Self closing”, with no browser error.
- Keyboard-only operation: the first Tab reaches the skip link, whose computed focus indicator is a `rgb(23, 99, 122) solid 3px` outline; route ArrowRight then Enter creates an intent and moves focus to `#intent-note`.
- Desktop 1440×1000 and mobile 390×844 had no horizontal overflow. The mobile brand control measured 44 px high. Reduced-motion mode reported `0s` transition duration.
- Console and page-error listeners were empty throughout the normal, invalid, recovery, desktop, mobile, and offline flows.

## Accessibility, privacy, performance, and PWA

- Axe 4.10.2 on the live site found **zero serious/critical violations** in desktop light and loaded 390 px mobile dark/reduced-motion states (zero violations at every impact in these scans). The document has one H1, a main landmark, English language, labels, legal pages, and a functional skip link.
- Fresh first loads of both preview and live site wrote no `localStorage` entries, made no cross-origin requests, and emitted no console/page errors. There are no analytics, map tiles, CDN scripts, or remote font requests. A license API request is only possible after a user provides/restores a token.
- Live response policy includes HSTS, `nosniff`, `DENY` anti-framing, strict-origin referrer policy, restrictive geolocation/camera/microphone permissions, and CSP with `frame-ancestors 'none'`. Hashed JS and CSS have `Cache-Control: public, max-age=31536000, immutable`; documents and the service worker have short revalidation caching.
- Live Lighthouse 12.5.1 mobile/default configuration: Performance **98**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.0 s, LCP 1.3 s, TBT 160 ms, CLS 0, total transfer 79 KiB.
- PWA checks on both preview and live: service worker activated and controlled after reload; `registration.update()` yielded active `activated` with no waiting worker; a 390 px offline reload restored `<main>`, showed “Offline.”, and generated no errors.

## Live deployment identity

SHA-256 comparisons between local `dist/` and the live origin matched all 11 checked release files: `/`, hashed JS, hashed CSS, desktop and mobile WebPs, `/sw.js`, `/privacy/`, `/terms/`, favicon, robots, and sitemap. The deployed HTML therefore refers to the same `app-BCeilpTZ.js` and `app-BMZDkkK1.css` produced by the candidate build.

## Defects by severity / remaining external work

| Severity | Finding | Disposition |
| --- | --- | --- |
| S1 | None found | — |
| S2 | None found | — |
| S3 | None found | — |
| Non-release evidence gap | The brief's 90% retention outcome requires a real field study importing exported routes into two target navigation apps. No such study is present in the repository. | Plan and record the field study; this does not prevent the local product from correctly performing its stated export/validation workflow. |
| Operational prerequisite | The one-time Field kit catalog/checkout is not provisioned. The candidate correctly makes no buy claim/link and leaves core work free. | Factory must provision and test Sociobot billing before offering new purchases. |

Package/consumer testing and backend concurrency checks are not applicable to this static-web artifact. No code changes were made during verification.
