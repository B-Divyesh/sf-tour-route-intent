# Tour Route Intent

Tour Route Intent is a local-first GPX workbench for self-supported touring cyclists who already know the line they want to ride. It lets a rider mark deliberate places and route spans, attach short reasons such as surface, water, ferry, or avoid-at-night, export those decisions in a portable GPX, and check whether a route returned by another app still follows them.

Live product: <https://tour-route-intent.sociobot.in>

## What it does

- Imports GPX track or route geometry without calling a routing engine.
- Selects route points with pointer, touch, or keyboard.
- Stores readable intent notes as standard GPX waypoints and lock metadata in a namespaced GPX extension.
- Locks a place or the original line between consecutive intent markers.
- Exports a standards-compatible GPX and validates a returned GPX against an adjustable 20–250 m corridor.
- Autosaves the current draft in browser storage and works offline after the production shell is cached.
- Offers an optional $12 one-time Field kit unlock for multiple local workspaces and note templates. Core import, export, validation, accessibility, and safety notices are free.

It deliberately does not calculate routes, provide turn-by-turn navigation, fetch map tiles, use live traffic, or guarantee that a road/path is legal or safe.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open the URL printed by Vite. No API key is required for the app. License verification uses the Sociobot billing API only when a license is present.

## Test and build

```sh
npm test
npm run build
```

`npm test` runs route/GPX unit tests and Playwright browser tests, including keyboard operation, export/reimport validation, a serious/critical axe scan, legal pages, and 390 px overflow. The exact production build command is `npm run build`; output lands in `dist/` with `dist/index.html` at its root.

To inspect the production build:

```sh
npm run preview
```

## Data and privacy

GPX files, coordinates, intent notes, and saved workspaces are processed locally. The app has no analytics, map-tile requests, third-party fonts, or runtime CDN dependencies. It contacts `api.sociobot.in` only for optional Field kit checkout/license verification. See [`privacy/index.html`](privacy/index.html) and [`terms/index.html`](terms/index.html).

## Design and asset provenance

The product-specific visual system and generated-asset prompt are documented in [`.factory/design.md`](.factory/design.md). The original illustration and provenance sidecars are in `assets/src/`; optimized runtime WebP variants are in `public/assets/`.

## Deploy

Deploy the contents of `dist/` as an Azure Static Web App. `public/staticwebapp.config.json` supplies the navigation fallback and security headers. The factory owns DNS, billing product registration, and release configuration.

## License

MIT — see [LICENSE](LICENSE).
