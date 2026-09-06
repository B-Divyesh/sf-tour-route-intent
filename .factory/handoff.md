# Tour Route Intent — review handoff

- Status: **FAIL**
- Work order: `tour-route-intent-review-1`
- Implementation reviewed: `c54b000f8161da80cf1ee1c82d7985b7ccfaabe3`
- Documentation reviewed: `87ea5b6dc27446b14f9044f0f14ea0ee406d6323`
- Live URL: <https://tour-route-intent.sociobot.in/>
- Date: 2026-09-06 UTC
- Full evidence: `.factory/review-1.md`

## Result

The core GPX planner and the earlier release repairs work in the live build, but the product does not pass this review. It has no isolated sample-data demo, and its `Try an example` control writes to the real draft namespace. It also has no claims manifest or claim-test commands, leaving 16 public-reliance claim categories untested.

The first screen uses metaphor copy instead of plainly naming the job, audience, and sample action. A real 404 response and required route metadata are absent.

## Verification run

```sh
npm ci
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
```

All commands passed. The local production output matched the deployed files by SHA-256. Playwright axe scans had no violations in the checked light and dark/reduced-motion states; normal, invalid, boundary, keyboard, privacy, and offline paths were exercised live.

## Required next steps

1. Build and document the isolated `/demo` sandbox with reset and start-for-real controls.
2. Add `.factory/claims.json` and a tagged, runnable test for every public claim.
3. Rewrite the first screen/title in plain words and add the required copy audit.
4. Add full metadata, a styled real 404, and consistent legal-route skeletons.

No product code was modified during this review.
