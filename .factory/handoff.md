# Tour Route Intent — repair handoff

- Status: **REPAIRED AND DEPLOYED**
- Work order: `tour-route-intent-repair-1`
- Failed candidate: `be8ddaf96a8c2371089613f63c6eedc4035a440e`
- Verification report: `c6639e7433de47ad8609f0519434a738c5042da4`
- Repair commit: `c54b000f8161da80cf1ee1c82d7985b7ccfaabe3`
- Live URL: `https://tour-route-intent.sociobot.in`
- Deployment ID: `2eab78a6-5354-4f80-9a60-132191900f8b`
- Date: 2026-08-28 UTC

## Release blockers repaired

1. Locked-line validation now performs a two-way corridor comparison over the matched candidate span. It includes every route vertex plus distance-based samples, checks endpoint order, and therefore rejects extra candidate excursions instead of only asking whether the original vertices occur somewhere on the candidate line. The verifier's exact 12-point route with `56.5, -4.5` inserted between locked-span vertices now reports `Some intent was lost`, 2% corridor coverage, and an approximately 185,141 m widest departure.
2. The unavailable billing offer is no longer advertised or linked. The production catalog does not contain this slug and its checkout returns 404, while the work order contains no billing-registration tool or merchant credentials. The UI and legal copy now state that new purchases are unavailable; existing license capture, verification, revocation, and restore behavior remains intact. Provisioning checkout is the prerequisite for reintroducing the one-time offer.
3. Dark-mode primary controls use a dedicated `--action: #a93429` token with warm-white text at 6.43:1. A reduced-motion rule now disables transitions outright, preventing a transient initial black text state. Axe serious/critical scans pass in system-dark, reduced-motion, empty, loaded, and 390 px states.
4. GPX parsing accepts both paired and standards-valid self-closing `<trkpt/>` and `<rtept/>` elements, including the verifier's two-point example.

The verifier's lower-severity findings were also resolved: hashed JS/CSS now ship with one-year immutable caching; the nested complementary landmark was removed; the mobile home link is 44 px high; CSP with `frame-ancestors 'none'` and `X-Frame-Options: DENY` are live. The service-worker cache was versioned and made build-aware so it precaches hashed JS/CSS and never substitutes HTML for a failed asset request.

## Regression coverage and clean gates

The final gate was run from `npm ci` using the committed lockfile:

- `npm ci`: 140 packages installed.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- `npm run lint`: PASS (ESLint 10 flat configuration).
- `npm run typecheck`: PASS (strict `tsc --noEmit`).
- `npm test`: PASS — 8 Vitest tests and 8 Playwright tests against a fresh production build.
- `npm run build`: PASS; `dist/index.html` is at the required static-web root.
- Build sizes: JS 31.81 KB raw / 11.48 KB gzip; CSS 16.87 KB raw / 4.42 KB gzip; route image 62.44 KB desktop / 19.10 KB mobile; no fonts.

Exact regressions cover the 12-point far-detour false pass, self-closing track and route points, system-dark/reduced-motion axe checks in empty and loaded mobile states, absence of a checkout link, privacy on first load, and production service-worker update/offline reload. Existing round-trip export, shortcut detection, keyboard route navigation, legal pages, and desktop/mobile reflow tests remain passing.

Run locally with:

```sh
npm ci
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
```

## Live verification

- Factory URL verifier: HTTP 200, 700 ms navigation, title and `lang="en"` present, one H1, main landmark present, zero missing image alts, zero unlabeled buttons, zero page/console errors.
- Live desktop 1440×1000 and mobile 390×844: zero horizontal overflow. Keyboard Arrow/Enter created an intent and moved focus to the note field. The mobile home target measures 44 px.
- Live axe 4.10.2: zero serious/critical findings in light desktop and system-dark/reduced-motion mobile states.
- Privacy: fresh first load wrote no local storage and made no cross-origin requests. Existing-license verification remains the only optional API path.
- Offline/update: service worker active and controlling, `registration.update()` completed with no waiting worker, and offline reload restored the title, main app, local UI, and visible Offline status with zero errors.
- Response policy: HSTS, `nosniff`, strict-origin referrer policy, restrictive permissions policy, CSP, anti-framing, and one-year `immutable` cache control on hashed assets are live.
- Deployment identity: SHA-256 matched local `dist/` for HTML, JS, CSS, both WebPs, service worker, privacy, and terms (8/8 files).
- Live Lighthouse 12.5.1 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.1 s, TBT 80 ms, CLS 0, Speed Index 1.0 s, total transfer 79 KiB.

## Known gaps / next steps

- The brief's success measure still needs a real field study showing at least 90% retention across two target navigation apps.
- The planned one-time Field kit cannot be sold until the factory provisions and enables `tour-route-intent` in the Sociobot billing engine. Do not restore the buy link before its production checkout is verified end to end.
- Package/consumer testing is not applicable to this static-web artifact; deployment remains Azure Static Web Apps with `dist/` unchanged as the artifact class.
