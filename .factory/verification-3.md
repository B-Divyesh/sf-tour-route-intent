# Independent product verification 3 — FAIL

- Work order: `tour-route-intent-verify-3`
- Reviewed implementation: `1cab72a4f9822eae6344bf74b4403cecf464b05b`
- Reviewed documentation/report commit: `cb93ce7e43ce05c0bfd3ae2a904abad21fdf3c88`
- Live URL: <https://tour-route-intent.sociobot.in/>
- Verified: 6 September 2026 UTC
- Artifact: static web PWA
- Verdict: **FAIL — 1 S2 finding; 3 untested public claims.**

## Job, audience, and first action

The job is to preserve deliberate touring-route choices in a GPX file and check whether another app kept them. The audience is self-supported touring cyclists who know the roads or paths they want. Before scrolling, fresh 1440 × 1000 desktop and 390 × 844 phone pages state this job and audience. Both show **Try it with sample data**; its top edge is 479 px on desktop and 352 px on phone. It loads a nine-point route with three practical notes.

## Finding

### S2 — Three Field kit payment and availability claims have no claims-contract evidence

The claims manifest contains 18 entries, all with a passing outcome test, but it omits these public statements:

1. `The Field kit is a $12 one-time license.` (README and terms)
2. `New purchases are unavailable until factory billing registration is complete.` (README; equivalent copy appears in the app)
3. `No payment is taken by this site.` (app)

These are visitor-reliance claims about price, purchase availability, and payment handling. None is listed in `.factory/claims.json`, so none has the required exact `@claim:<id>` command and sandbox outcome. The existing `license-on-action` test proves that verification is contacted only after a token is supplied; it does not prove any of these three statements. `existing-license-tools` proves the named-workspace/template behavior, not the advertised price or sale status.

This is a claims-contract defect, not a checkout defect: no purchase link is present, and the known billing registration prerequisite remains honestly disclosed. The public claims must either be removed while registration is unavailable or each be declared and tested. Per the work order, this prevents PASS.

## Clean checkout and declared claims

A fresh clone at `cb93ce7` was used. The only difference from implementation `1cab72a` is `.factory/handoff.md`, so the built product code is the specified implementation candidate.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 140 packages |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 8 unit and 26 browser tests |
| `npm run build` | PASS — `dist/index.html` present |
| Each of 18 manifest `test` commands | PASS independently |
| Aggregate `npm run test:claims` | PASS — 18 tests |

The independently executed manifest commands covered demo isolation, browser-local processing, route-order preservation, no live services, GPX import, pointer/touch/keyboard selection, waypoint export, two-way line locks, standard GPX, corridor boundaries, autosave, offline reload, free core, analytics, map tiles, self-hosted assets, license-on-action, and existing-license tools. The aggregate output is at `/work/.evidence/verify-3-all-claims.log`.

## Live checks

- The live home, demo, privacy, and terms routes return 200; the deliberate unknown route returns HTTP 404 with `Page not found — Tour Route Intent`. The 404 is expected and not a console/product defect.
- The official URL verifier found a title, `lang=en`, one H1, one main landmark, image alternatives, no unlabeled buttons, and no home-page console errors.
- Live dark/reduced-motion axe scan found zero violations. Keyboard focus starts at the demo skip link and has a 3 px visible outline. The real-data check loaded the sample, selected a realistic intent note, reset it, and found no real draft storage value.
- The demo banner reads `Demo — sample data, nothing is saved`, includes Reset demo and Start for real, and its observed requests were only product-origin document, script, and stylesheet requests.
- Home/demo/privacy/terms/source links resolved successfully. The home, demo, privacy, terms, and 404 route titles and canonical metadata were present.
- The 16 deployable product files checked against the clean local build matched SHA-256 exactly, including all route HTML bodies, JS, CSS, service worker, images, icons, robots, and sitemap. This establishes that the live runtime is the `1cab72a` product image, not merely the later report commit.
- Live headers include CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, restrictive permissions, and immutable cache policy for hashed JS/CSS. The service worker is short-revalidated as expected.

Evidence: `/work/.evidence/verify-3-live/result.json`, `/work/.evidence/verify-3-url/verify.json`, `/work/.evidence/verify-3-all-claims.log`, and the clean-checkout command output from this verification.

## Earlier findings and current disposition

| Earlier finding | Current disposition |
| --- | --- |
| Locked-line false pass | Fixed; declared two-way line-lock test passes. |
| Self-closing GPX point rejection | Fixed; declared GPX import test passes. |
| Dark-mode contrast | Fixed; live dark/reduced-motion axe scan has zero violations. |
| Missing CSP/anti-framing and immutable assets | Fixed; live headers confirm both. |
| Mobile brand target and landmark issue | Fixed; current browser/a11y checks pass. |
| Missing demo sandbox, claims contract, plain first screen, metadata, and 404 | Fixed for the 18 declared product claims and routes. This verification found the three remaining unlisted paid-copy claims above. |
| 90% two-app field-study outcome | Still unproven external research; it is not advertised as a product result. |
| Field kit billing registration | Still an external factory prerequisite. No fake checkout is shown. |

Backend tenant isolation, restart persistence, health, 429, and consumer-installed-artifact checks do not apply to this static web product.

## Required next step

Remove the three paid-copy claims while billing registration is unavailable, or add a manifest entry and a passing observable sandbox test for each. Re-run independent verification afterward.
