# Independent product verification — FAIL

- Work order: `tour-route-intent-verify-1`
- Candidate: `be8ddaf96a8c2371089613f63c6eedc4035a440e`
- Repository: `https://github.com/B-Divyesh/sf-tour-route-intent.git`
- Live URL: `https://tour-route-intent.sociobot.in`
- Verified: 2026-08-28 UTC
- Artifact: static web/PWA
- Verdict: **FAIL**

The candidate builds and deploys successfully, and the live origin is byte-for-byte identical to the production build. It does not meet the acceptance contract because the core locked-segment validator can return a false pass for a radically divergent route, the advertised purchase flow is unavailable, system dark mode has serious contrast violations, and a standards-valid GPX form is rejected.

## Release-blocking defects

### S1 — Locked-segment validation can false-pass a route that does not follow the locked line

Reproduced in the clean production preview and at the live URL:

1. Load the example and export it.
2. Between each original vertex in the locked span, insert a GPX point at `56.5000000, -4.5000000` (about 189 km from the first affected original point).
3. Validate that 12-point returned GPX at the default 75 m corridor.

Actual: **“✓ Route intent retained”**, including **“All 4 route samples stay inside the 75 m corridor.”** Each original vertex is present, so the one-directional reference-to-candidate distance is zero even though the candidate travels via the far-away point between those vertices.

Expected: a locked line check must also reject candidate geometry that leaves the corridor between the locked markers. This is the product's central job and makes a passing result unreliable.

### S1 — Advertised $12 Field kit checkout is unavailable

Fresh request to the shipped buy URL:

```text
GET https://api.sociobot.in/api/v1/products/tour-route-intent/checkout
HTTP 404
{"error":"enabled factory product","status":404}
```

The UI advertises and links a purchasable one-time unlock, but a buyer cannot complete checkout. The verification endpoint itself responds correctly to an invalid token and permits CORS from the product origin.

### S2 — System dark mode fails the required contrast gate

Playwright axe 4.10.2 reports serious `color-contrast` violations in empty, loaded, reduced-motion, and 390 px states. Primary-action text is `#fffdf7` on `#ffae9f`, only **1.74:1** versus the required **4.5:1**. Confirmed examples:

- `Import GPX`
- `Add intent here`
- `Export intent GPX`
- `Buy field kit`

No axe critical findings were present. Light mode had no serious/critical findings.

### S2 — Valid self-closing GPX track points are rejected

The standards-valid input below is rejected with “No usable route line was found”:

```xml
<gpx version="1.1"><trk><trkseg>
  <trkpt lat="51" lon="-1"/>
  <trkpt lat="51.1" lon="-1.1"/>
</trkseg></trk></gpx>
```

The parser only recognizes explicit opening/closing point pairs. Users need to rewrite a conforming GPX file before the product can import it.

## Lower-severity defects and observations

- **S3 — Cache budget policy:** the live HTML, hashed JS/CSS, images, legal pages, and service worker all return `Cache-Control: public, must-revalidate, max-age=30`. Hashed assets are not served with long-lived immutable caching as required by the performance contract.
- **S3 — Axe moderate semantic finding:** `landmark-complementary-is-top-level` affects the scope-note `aside` in every tested state.
- **S3 — Touch target sizing:** at 390 px the home/brand link is 154×34 CSS px. Footer and inline legal links are also below 44 px height (inline-link exceptions apply to several of those, but not the brand control).
- **Policy observation:** HSTS, `nosniff`, referrer policy, and geolocation/camera/microphone restrictions are present. No CSP or anti-framing policy (`frame-ancestors`/`X-Frame-Options`) is sent.
- The brief's 90% retention success measure still requires field imports into two real navigation apps; that study was not represented in the repository. The false-pass above must be resolved before such a result would be trustworthy.

## Clean checkout and repository gates

A detached clean worktree was created directly from the candidate. No existing dependencies or build output were reused.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 58 packages installed from lockfile |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm test` | PASS — 6 Vitest tests and 4 Playwright tests |
| Type check | PASS — strict `tsc --noEmit` runs inside build |
| Lint | Not available — no lint script/configuration in repository |
| `npm run build` | PASS — exact production build created `dist/` |

Production output:

- JS: 31.28 KB raw / 11.25 KB gzip (budget 200 KB)
- CSS: 16.86 KB raw / 4.43 KB gzip (budget 50 KB)
- Fonts: none
- Hero: 62.44 KB desktop; 19.10 KB mobile (budget 300 KB)
- Lighthouse transfer: 78 KiB

## End-to-end and boundary coverage

Passing checks included:

- Empty state; example route; GPX import; edit intent type/note/locks; escaped special characters in export; export/re-import; passing same-route validation.
- Local draft survives reload; marker deletion is undoable.
- Malformed/unsupported import error recovery and greater-than-15 MB file rejection.
- Coordinate boundary `-90, 180` accepted; latitude `91` rejected with native validation and recovery remains available.
- Validation corridor boundaries 20 m and 250 m.
- Clear-route confirmation cancel preserves the route; confirm clears it.
- Keyboard skip link and designed 3 px focus outline; route arrow-key navigation and Enter intent creation; no trap in repository keyboard journey.
- Desktop 1440×1000 and mobile 390×844; no horizontal overflow before/after route load or at 200% root text size.
- Reduced motion leaves only the intentional near-zero (`0.00001s`) transition duration; no looping or flashing motion.
- License return token is stored and stripped from the URL; mocked valid verification unlocks; the cached verdict prevents a second daily request; invalid verification relocks; core export remains free.
- Privacy: first load wrote no storage, route/notes stayed in local storage/export, and no request left the site origin without a license action. No analytics, map tiles, third-party font, or runtime CDN requests were observed.
- Privacy and terms pages load with correct titles, language, headings, contrast treatment, and links.

## Live deployment identity and browser evidence

The live site returned HTTP 200. SHA-256 comparison matched the candidate's `dist/` for:

- `/`, hashed JS, hashed CSS
- both route illustration variants
- `/sw.js`, `/privacy/`, `/terms/`
- favicon, robots, and sitemap

The factory URL verifier reported one H1, English language, a main landmark, no missing image alt text, no unlabeled buttons, and no console/page errors. Live first navigation in that check was 567 ms.

Live Lighthouse 12.5.1, mobile/default throttling, light mode:

| Category/metric | Result |
| --- | --- |
| Performance | 100 |
| Accessibility | 100 (does not exercise system dark mode) |
| Best practices | 100 |
| SEO | 100 |
| FCP / LCP | 0.9 s / 1.1 s |
| TBT / CLS | 60 ms / 0 |
| INP | Not measured in this navigation-only lab run |

## PWA/offline

The production service worker installed and activated, controlled the page after reload, and `registration.update()` completed with no waiting worker for the current version. After a controlled online reload, a 390 px offline reload restored the title, main application, local route functionality, and visible Offline status with zero page errors. The fixed cache name (`tour-route-intent-v1`) requires disciplined manual version changes for future releases.

## Final decision

**FAIL. Do not promote this candidate.** Resolve the locked-line false pass, register/enable the billing product or remove the unavailable paid offer, fix dark-mode primary-action contrast, and accept valid self-closing GPX point elements. Re-run the full clean and live verification afterward.

No product code was modified during verification.
