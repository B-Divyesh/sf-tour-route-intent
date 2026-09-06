# Review 1: Preserve deliberate GPX route choices

- Work order: `tour-route-intent-review-1`
- Reviewed: 2026-09-06 UTC
- Live URL: <https://tour-route-intent.sociobot.in/>
- Implementation candidate: `c54b000f8161da80cf1ee1c82d7985b7ccfaabe3` (`fix: resolve verification release blockers`)
- Documentation commit: `87ea5b6dc27446b14f9044f0f14ea0ee406d6323` (`docs: record independent verification pass`)
- Verdict: **FAIL**

## Job, audience, and first action

The job is to preserve a touring cyclist's deliberate route choices in a GPX file and check a GPX returned by another app. The audience is self-supported touring cyclists who already know the roads or paths they want. In fresh desktop (1440 × 1000) and phone (390 × 844) browsers, the first available action was **Import GPX**. The required **Try it with sample data** action was not on the first screen or available under that name.

Fresh-page evidence is saved as `/work/.evidence/live-desktop.png` and `/work/.evidence/live-phone.png`.

## Findings

### S1 — Sample route is not an isolated one-click demo

`/demo` and `/?demo=1` both return the ordinary planner. Neither exposes a `Try it with sample data` control, a persistent `Demo — sample data, nothing is saved` label, `Reset demo`, or `Start for real`.

The only sample control is `Try an example`. From a clean browser it writes the sample into the real namespace `tour-route-intent:draft`; it does not use a `demo:` namespace and has no reset or exit action. This breaks the required demo sandbox and means a trial can change the visitor's real local draft. No `.factory/demo.md` documents a demo URL, seed, reset, or namespace.

### S1 — Public claims have no claim contract or executable evidence

`.factory/claims.json` is absent. Consequently there are no `@claim:<id>` tests and no declared claim commands to run from a clean checkout. The required claim-verification gate cannot be performed.

I counted 16 distinct public-reliance claim categories that are therefore untested by the required contract: local processing/privacy; no routing or silent rerouting; no live maps, traffic, or safety guarantee; GPX import; pointer/touch/keyboard selection; GPX waypoints and lock extensions; point and line locks; standard-GPX export; adjustable-corridor validation; local autosave; offline operation after caching; free core workflow; no analytics; no map-tile requests; no third-party fonts/runtime CDN; and license requests only after a license action. They appear across the landing page, README, and privacy page.

**Untested public-claim count: 16.** Existing unit and Playwright coverage is useful, but it is not tagged or mapped to these claims and cannot substitute for the missing manifest.

### S2 — First screen fails the plain-words and first-action contract

The H1 is `Keep the line. Keep the reason.` and the eyebrow says `A portable memory for your route`. These are metaphor and mood copy, not the job in the rider's words. The first-screen text does not name touring cyclists, and it does not tell the visitor to try a realistic sample first. On a 390 px phone, `Try an example` appears below the hero illustration rather than in the first screen.

The home title, `Tour Route Intent — protect the route you chose`, likewise does not plainly say it exports and checks GPX route intent. `.factory/copy-audit.md`, required to show the copy review and terminology table, is absent.

### S2 — Required route structure, metadata, and 404 behavior are incomplete

There is no designed `404.html` or configured 404 response. `GET /not-a-real-route` returns HTTP 200 and renders the home planner with the home title, rather than a real 404 page with a way back.

The landing page has a description and favicon, but lacks a canonical URL, Open Graph tags, Twitter card tags, apple-touch icon, and a real 1200 × 630 social image. Privacy and terms have route titles, but no descriptions, canonical URLs, or social metadata. Their headers/footers also do not use the required consistent site header and footer.

## Previous findings: current disposition

| Earlier finding | Current evidence | Disposition |
| --- | --- | --- |
| Locked-line validation false-pass | A 12-point GPX with a 185 km detour now reports `Some intent was lost`; the two-way locked-line check reports only 2% inside the 75 m corridor. | Fixed |
| Unavailable $12 checkout | The page says new purchases are unavailable and contains no checkout link. | Fixed |
| Dark-mode contrast | Live axe scans in empty desktop/light and populated 390 px dark/reduced-motion states had zero violations, including zero serious/critical. | Fixed |
| Self-closing GPX points rejected | A two-point self-closing `<trkpt/>` GPX imported live as `Self closing`. | Fixed |
| Hashed asset cache policy | Live JS and CSS return `Cache-Control: public, max-age=31536000, immutable`. | Fixed |
| Top-level `aside` axe moderate finding | The live page contains no `aside`; axe found no violations in the tested states. | Fixed |
| Mobile brand target too short | Fresh 390 px measurement: 154.1 × 44 px. | Fixed |
| Missing anti-framing/CSP | Live headers include `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`. | Fixed |
| Brief's 90% two-app field outcome | No field-import study is present. This remains an outcome-evidence gap, not a public product claim. | Still unproven |

## Checks that passed

- Fresh desktop and phone pages loaded with no console or page errors. The live response has one H1, English language, a main landmark, and image alt text.
- `npm ci`, `npm audit --audit-level=high`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` all passed from the supplied clean commit. Tests: 8 Vitest and 8 Playwright. `dist/index.html` was produced.
- The local production build exactly matched the live HTML, JS, CSS, both illustrations, service worker, legal pages, favicon, robots, and sitemap by SHA-256.
- Normal flow: the example route loads realistic route points and intent markers; export produces `harbour-to-high-pass-intent.gpx`; importing that export passes validation.
- Invalid and recovery paths: invalid latitude 91 is rejected by native validation without changing the nine-point route; valid 90,180 then appends successfully. A self-closing GPX imports after the invalid path.
- Keyboard: first Tab reaches the skip link with a visible 3 px `rgb(23, 99, 122)` outline. Route arrow navigation plus Enter adds an intent and moves focus to the note field. No horizontal overflow was found at 390 px or with the root size set to 200%.
- Accessibility: Playwright axe 4.10.2 found zero violations in empty desktop/light and loaded phone/dark/reduced-motion scans. Reduced-motion, focus, and touch-size checks passed in the exercised paths.
- Privacy and offline: a fresh page made no cross-origin requests and wrote no storage. After service-worker control, an offline reload retained main content and displayed `Offline.` with no errors. License verification was not triggered in this flow.
- Links checked in the product flow, privacy, terms, source, and mail links were reachable or explicit external/mail destinations. Privacy and terms load with their own titles and H1s.

## Claims and verification commands

No `.factory/claims.json` exists, so there were **zero declared claim commands to execute**. This is not a pass: it is the S1 claim-contract finding above. `verify-url.sh`, requested by the accessibility baseline, is also absent; equivalent live browser checks were run manually, but the required script has no repository evidence.

## Scope notes

This is a static web product. There is no backend, tenant store, rate-limit endpoint, CLI artifact, or desktop artifact to test. Backend tenant-isolation, restart-persistence, health, and 429 checks are not applicable. The review did not modify product code.

## Required next steps

1. Implement `/demo` (or `?demo=1`) as an isolated `demo:` storage namespace with the specified first-screen sample action, persistent label, reset, and exit; document it in `.factory/demo.md`.
2. Add `.factory/claims.json` for every public reliance claim and one independently runnable `@claim:` test per entry; remove any claims that cannot be tested.
3. Replace the home copy/title with plain job/audience/first-action wording and add `.factory/copy-audit.md`.
4. Add complete route metadata and a real styled 404 response; make headers and footers consistent on legal routes.

**Final verdict: FAIL — 4 findings, including 2 S1 findings, and 16 untested public claims.**
