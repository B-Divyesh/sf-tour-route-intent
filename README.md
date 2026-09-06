# Tour Route Intent

Tour Route Intent helps self-supported touring cyclists preserve deliberate route choices in GPX files and check returned routes.

Live product: <https://tour-route-intent.sociobot.in/>

One-click sample: <https://tour-route-intent.sociobot.in/demo/>

## What it does

- Imports GPX track or route geometry without calculating a new route.
- Selects route points with pointer, touch, or keyboard input.
- Exports notes as GPX waypoints and stores lock details in a namespaced extension.
- Checks locked places and both directions of locked lines within a 20–250 metre corridor.
- Saves the real draft in browser storage and works offline after the first visit.
- Keeps GPX import, export, route checks, accessibility, and safety information free.

It does not provide navigation, map tiles, live traffic, or safety checks. Riders must check current conditions and legal access.

## Try the isolated demo

Open `/demo/` or select **Try it with sample data** on the first screen. The sample contains nine route points and three practical notes.

Demo edits use the `demo:tour-route-intent:draft` session-storage key. Demo mode never reads or writes the real draft, saved workspaces, theme, or license keys.

Use **Reset demo** to restore the sample. Use **Start for real** to discard demo changes and return to your existing real draft.

## Run locally

Install Node.js 20 or newer, then run:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite.

## Test and build

From a clean checkout:

```sh
npm ci
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` runs GPX unit tests and browser journeys. The browser suite covers the demo, keyboard and touch use, invalid input, offline reload, accessibility, legal pages, and a real 404 response.

Every public claim is mapped in [`.factory/claims.json`](.factory/claims.json). Run one claim with its documented command, for example:

```sh
npm run test:claims -- --grep @claim:demo-isolation
```

The production build is written to `dist/`, with `dist/index.html` at its root. To inspect that artifact with its real local 404 behavior:

```sh
npm run build
npm run serve:test
```

## Data and privacy

Route files, coordinates, notes, export, and validation stay in the browser. The app has no analytics, advertising, map tiles, third-party fonts, or runtime CDN requests.

The billing API is contacted only after a visitor provides an existing Field kit license. See the [privacy policy](privacy/index.html) and [terms](terms/index.html).

## Field kit

The Field kit is a $12 one-time license for local named workspaces and four note templates. New purchases are unavailable until factory billing registration is complete.

Existing license holders can still verify a license and use those paid tools. The free GPX workflow does not require an account or license.

## Design and asset provenance

The visual system and original generated-art prompt are documented in [`.factory/design.md`](.factory/design.md). Source artwork and provenance are in `assets/src/`.

## Deploy

Deploy `dist/` as the `sf-tour-route-intent` Azure Static Web App. The committed static-web configuration defines redirects, cache rules, security headers, and the 404 response.

The factory owns DNS, billing registration, and release configuration.

## License

MIT — see [LICENSE](LICENSE).
