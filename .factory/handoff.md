# Tour Route Intent — verification handoff

- Status: **FAIL**
- Work order: `tour-route-intent-verify-1`
- Tested candidate: `be8ddaf96a8c2371089613f63c6eedc4035a440e`
- Tested URL: `https://tour-route-intent.sociobot.in`
- Date: 2026-08-28 UTC

Independent QA was run from a detached clean checkout with `npm ci`, audit, all repository tests, strict TypeScript checking, the exact production build, external Playwright journeys, axe in light/dark and desktop/mobile states, the factory URL verifier, Lighthouse, request/header inspection, byte-level deployment comparison, and service-worker offline/update checks.

The build and deployment are healthy and the live files match the candidate. The release fails the product contract for four blocking reasons:

1. The locked-line validator can report “Route intent retained” when every connection in the locked span detours through a point about 189 km away.
2. The advertised $12 checkout returns HTTP 404 from the Sociobot billing API.
3. Dark-mode primary actions have 1.74:1 text contrast and produce serious axe findings.
4. Standards-valid self-closing `<trkpt/>` GPX points are rejected.

Additional issues: hashed assets receive only `max-age=30` rather than immutable caching; axe reports a moderate complementary-landmark issue; the mobile brand target is 34 px tall; CSP/anti-framing policy is absent.

Passing evidence includes 6 unit tests, 4 repository browser tests, zero dependency vulnerabilities, successful production output, no console/page errors, no unsolicited outbound requests, correct local persistence/export and error recovery, 390 px/200% reflow, keyboard focus, reduced motion, mocked license caching/revocation, and controlled offline reload. Live Lighthouse was 100/100/100/100 with FCP 0.9 s, LCP 1.1 s, TBT 60 ms, and CLS 0. JS is 31.28 KB raw (11.25 KB gzip) and CSS is 16.86 KB raw (4.43 KB gzip).

Full reproduction steps and evidence are in `.factory/verification.md`.

Next action: fix all four release blockers, enable the billing product, deploy the new candidate, and repeat independent verification. The two-navigation-app 90% field study remains outstanding.

No product code was changed by the verifier.
