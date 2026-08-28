# Tour Route Intent — visual thesis

## Direction: generative geometry / survey notebook

Tour planning is an act of drawing a deliberate line through uncertainty. The interface uses a changing field of contour-like rings, waypoint nodes, and a single vermilion route thread rather than a generic outdoor photograph or map-app chrome. It should feel like a careful field notebook laid over a survey chart: specific, calm, and trustworthy without implying live routing or safety guarantees.

The product is a focused workbench, not a marketing landing page. On desktop, the route canvas and intent ledger share the screen; on a 390 px phone they become a clear step sequence. Decoration is limited to geometry that teaches the central idea: a route is a line plus human decisions.

## Palette

### Light — “field sheet”

- `--paper: #f4f0e6` — warm map paper
- `--paper-raised: #fffdf7` — working surfaces
- `--ink: #17231f` — primary text (13.7:1 on paper)
- `--ink-muted: #52615b` — supporting text (6.0:1 on paper)
- `--route: #c33d2e` — deliberate route / primary action
- `--route-deep: #8c281f` — interactive route text and hover
- `--moss: #285d4b` — locks, successful validation
- `--water: #17637a` — information / water intent
- `--warning: #8b520b` — caution
- `--danger: #9b2c2c` — destructive and failed validation
- `--line: #c8c2b3` — quiet boundaries

### Dark — “night chart”

- `--paper: #111916`
- `--paper-raised: #1a2521`
- `--ink: #f5f0e5`
- `--ink-muted: #bbc7c1`
- `--route: #ff806d`
- `--route-deep: #ffae9f`
- `--moss: #72c7a2`
- `--water: #71c6dc`
- `--warning: #f2bd65`
- `--danger: #ff8b87`
- `--line: #425049`

Theme follows `prefers-color-scheme`; both treatments preserve at least 4.5:1 body-text contrast. Status always combines color with a label and icon.

## Type

- Interface and data: `Inter`, `Avenir Next`, `Segoe UI`, sans-serif system stack. No network font request; tabular numerals for coordinates, distances, and validation counts.
- Editorial emphasis: `Iowan Old Style`, `Palatino Linotype`, `Book Antiqua`, Georgia, serif. Used only for the one H1 and brief explanatory phrases.
- Scale: 14 px metadata; 16 px body; 20 px section; 28 px subhead; clamp(36–58 px) H1. Body line-height 1.55 and explanatory measure capped at 68 characters.

## Spacing and form

- 4 px base rhythm; primary steps are 8, 12, 16, 24, 32, 48, and 64 px.
- Corners are clipped or lightly rounded (4–10 px), echoing folded charts rather than pill-heavy SaaS UI.
- Controls are at least 44 px high with 8 px between adjacent targets.
- Route nodes are diamond/hexagonal; annotations use small numbered discs. Panels group by proximity before borders.

## Interaction grammar

- The current planning step is marked by the moving end of the route thread and a solid step number.
- Clicking the canvas plants a waypoint; dragging moves it; selecting a waypoint exposes its terse intent note. The same actions are available through labeled coordinate fields for keyboard and screen-reader users.
- A lock is explicit and persistent. Locked segments are drawn double-stroked and listed in the intent ledger.
- Import and validation are separate, clearly labeled actions. Export never claims another app will honor its route; the validator checks the returned GPX geometry against the saved intent envelope.
- Editing actions use verbs. Destructive route clearing asks for confirmation; individual point deletion supports undo.

## Motion

- 180–240 ms transform/opacity transitions for panels, selected points, and validation feedback.
- The route draws only after a user adds a point; no ambient looping animation.
- With `prefers-reduced-motion: reduce`, drawing and panel motion become immediate opacity/state changes. Function and hierarchy remain unchanged.

## Asset plan and provenance

### `route-geometry.webp`

- Use: compact welcome/empty-state illustration and social preview source, never presented as an actual map.
- Prompt sheet:
  - Use case: `stylized-concept`
  - Asset type: wide landing/workbench illustration
  - Subject: an abstract long-distance bicycle route expressed as a vermilion thread passing through five precise geometric waypoint markers, with two visibly locked route spans and tiny symbolic water/ferry/surface cues
  - World: topographic survey sheet, layered paper terrain contours, subtle coordinate grid, no literal UI
  - Materials: cut paper, graphite, screen-printed ink, fine embossed contour lines
  - Light/lens: flat overhead editorial composition, soft raking daylight, crisp edges
  - Palette words: warm bone paper, forest ink, vermilion route, teal water, ochre note markers
  - Composition: 3:2 landscape, route travels lower-left to upper-right, generous quiet margin, readable at small size
  - Negative list: no text, letters, numbers, logos, watermark, people, bicycles, roadsigns, branded maps, photorealistic map labels, gradients, UI screenshots
- Generation: Azure AI Foundry factory image deployment via `/opt/fleet/lib/gen-image.sh`, 2026-08-28. Original generated asset for this product; no third-party source material.
- Delivery: retain PNG source and prompt sidecar in `assets/src/`; ship an optimized WebP at ≤300 KB with explicit dimensions.

All interface icons and map geometry are original inline SVG/CSS authored for this product. The footer discloses the generated illustration.
