import './styles.css';
import { exportGpx, parseGpx } from './gpx';
import { routeDistance, validateRoute } from './geo';
import { captureReturnedLicense, optimisticLicenseState, removeLicense, storeLicense, verifyLicense, type LicenseState } from './license';
import type { IntentKind, RouteDocument, RouteIntent, TrackPoint, ValidationReport } from './types';

const DRAFT_KEY = 'tour-route-intent:draft';
const SAVED_KEY = 'tour-route-intent:workspaces';
const THEME_KEY = 'tour-route-intent:theme';
const kindLabels: Record<IntentKind, string> = {
  surface: 'Surface choice', water: 'Water stop', ferry: 'Ferry timing', 'avoid-night': 'Avoid at night', other: 'Other reason',
};

interface AppState {
  route: RouteDocument;
  selectedIndex: number | null;
  selectedIntentId: string | null;
  report: ValidationReport | null;
  tolerance: number;
  status: string;
  error: string;
  online: boolean;
  licenseToken: string | null;
  license: LicenseState;
  undoIntent: RouteIntent | null;
}

function emptyRoute(): RouteDocument { return { name: 'My deliberate tour', track: [], intents: [] }; }

function loadDraft(): RouteDocument {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '') as RouteDocument;
    if (Array.isArray(draft.track) && Array.isArray(draft.intents)) return draft;
  } catch { /* use empty route */ }
  return emptyRoute();
}

const token = captureReturnedLicense();
const state: AppState = {
  route: loadDraft(), selectedIndex: null, selectedIntentId: null, report: null, tolerance: 75,
  status: '', error: '', online: navigator.onLine, licenseToken: token, license: optimisticLicenseState(token), undoIntent: null,
};

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root not found');

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char);
}

function saveDraft(): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(state.route));
}

function announce(message: string): void {
  state.status = message;
  state.error = '';
}

function fail(message: string): void {
  state.error = message;
  state.status = '';
}

function setRoute(route: RouteDocument, message: string): void {
  state.route = route;
  state.selectedIndex = route.track.length ? 0 : null;
  state.selectedIntentId = null;
  state.report = null;
  saveDraft();
  announce(message);
  render();
}

function exampleRoute(): RouteDocument {
  return {
    name: 'Harbour to high pass',
    track: [
      { lat: 54.9681, lon: -3.1802 }, { lat: 54.9804, lon: -3.1421 }, { lat: 54.9918, lon: -3.1074 },
      { lat: 55.0128, lon: -3.0829 }, { lat: 55.0275, lon: -3.0402 }, { lat: 55.0516, lon: -3.0121 },
      { lat: 55.0683, lon: -2.9688 }, { lat: 55.0834, lon: -2.9239 }, { lat: 55.1024, lon: -2.8810 },
    ],
    intents: [
      { id: crypto.randomUUID(), trackIndex: 2, kind: 'surface', note: 'Stay on the signed gravel towpath', lockPoint: true, lockToNext: true },
      { id: crypto.randomUUID(), trackIndex: 5, kind: 'water', note: 'Reliable tap at the village hall', lockPoint: true, lockToNext: false },
      { id: crypto.randomUUID(), trackIndex: 7, kind: 'avoid-night', note: 'Pass before dusk: exposed moor road', lockPoint: true, lockToNext: false },
    ],
  };
}

function projectTrack(track: TrackPoint[]): { points: string; xy: Array<[number, number]> } {
  const width = 800; const height = 520; const pad = 58;
  const lats = track.map((point) => point.lat); const lons = track.map((point) => point.lon);
  const minLat = Math.min(...lats); const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons); const maxLon = Math.max(...lons);
  const latSpan = Math.max(maxLat - minLat, 0.001); const lonSpan = Math.max(maxLon - minLon, 0.001);
  const xy = track.map((point): [number, number] => [
    pad + ((point.lon - minLon) / lonSpan) * (width - pad * 2),
    height - pad - ((point.lat - minLat) / latSpan) * (height - pad * 2),
  ]);
  return { points: xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '), xy };
}

function canvasMarkup(): string {
  if (!state.route.track.length) {
    return `<div class="canvas-empty">
      <img src="/assets/route-geometry.webp" srcset="/assets/route-geometry-mobile.webp 480w, /assets/route-geometry.webp 960w" sizes="(max-width: 880px) 100vw, 65vw" width="960" height="640" alt="Abstract paper terrain crossed by a red route thread, geometric waypoints and two lock markers" fetchpriority="high" decoding="async">
      <div class="empty-copy"><p class="eyebrow">No route loaded</p><h2>Begin with the line you mean to ride.</h2><p>Import a GPX, try the example, or add coordinates. This tool does not calculate roads or silently reroute your choices.</p>
      <div class="button-row"><button class="button primary" id="empty-import">Import GPX</button><button class="button secondary" id="example-route">Try an example</button></div></div>
    </div>`;
  }
  const projected = projectTrack(state.route.track);
  const intentNodes = state.route.intents.map((intent, ordinal) => {
    const point = projected.xy[intent.trackIndex]; if (!point) return '';
    const selected = intent.id === state.selectedIntentId ? ' selected' : '';
    return `<g class="intent-node${selected}" data-intent="${intent.id}" role="button" tabindex="0" aria-label="Intent marker ${ordinal + 1}: ${escapeHtml(intent.note || kindLabels[intent.kind])}">
      <circle cx="${point[0]}" cy="${point[1]}" r="18"></circle><text x="${point[0]}" y="${point[1] + 5}" text-anchor="middle">${ordinal + 1}</text>
    </g>`;
  }).join('');
  const lockedSegments = [...state.route.intents].sort((a, b) => a.trackIndex - b.trackIndex).map((intent, index, intents) => {
    const next = intents[index + 1];
    if (!intent.lockToNext || !next) return '';
    return `<polyline class="locked-line" points="${projected.xy.slice(intent.trackIndex, next.trackIndex + 1).map(([x, y]) => `${x},${y}`).join(' ')}"></polyline>`;
  }).join('');
  const selected = state.selectedIndex === null ? null : projected.xy[state.selectedIndex];
  return `<div class="route-canvas-wrap">
    <svg id="route-canvas" class="route-canvas" viewBox="0 0 800 520" role="application" tabindex="0" aria-label="Route line. Use left and right arrow keys to move along it; press Enter to add an intent marker.">
      <title>${escapeHtml(state.route.name)} route geometry</title>
      <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none"></path></pattern></defs>
      <rect width="800" height="520" class="canvas-paper"></rect><rect width="800" height="520" fill="url(#grid)" class="canvas-grid"></rect>
      <path class="contour" d="M-20 390C150 290 216 456 390 352S650 255 830 320"></path><path class="contour" d="M-20 116C120 208 220 44 405 130S688 167 830 72"></path>
      <polyline class="route-halo" points="${projected.points}"></polyline>${lockedSegments}<polyline class="route-line" points="${projected.points}"></polyline>
      ${selected ? `<circle class="cursor-point" cx="${selected[0]}" cy="${selected[1]}" r="10"></circle>` : ''}${intentNodes}
    </svg>
    <p class="canvas-help">Click near the line to choose a place · Arrow keys move point by point · Enter adds intent</p>
  </div>`;
}

function formatDistance(meters: number): string { return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`; }

function selectedIntent(): RouteIntent | undefined { return state.route.intents.find((intent) => intent.id === state.selectedIntentId); }

function editorMarkup(): string {
  if (!state.route.track.length) return `<section class="panel editor-panel" aria-labelledby="editor-heading"><div class="section-number">2</div><div><p class="eyebrow">Describe the decisions</p><h2 id="editor-heading">Intent ledger</h2><p class="muted">Intent markers will appear here after a route is loaded.</p></div></section>`;
  const intent = selectedIntent();
  const selected = state.selectedIndex ?? 0;
  const point = state.route.track[selected];
  return `<section class="panel editor-panel" aria-labelledby="editor-heading">
    <div class="section-head"><div class="section-number">2</div><div><p class="eyebrow">Describe the decisions</p><h2 id="editor-heading">Intent ledger</h2></div></div>
    <div class="point-readout"><span>Selected point ${selected + 1} of ${state.route.track.length}</span><code>${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}</code></div>
    ${intent ? `<form id="intent-form" class="intent-form">
      <label>Reason type<select id="intent-kind">${Object.entries(kindLabels).map(([value, label]) => `<option value="${value}"${intent.kind === value ? ' selected' : ''}>${label}</option>`).join('')}</select></label>
      <label>Short note<textarea id="intent-note" maxlength="180" rows="3" aria-describedby="note-help">${escapeHtml(intent.note)}</textarea><span id="note-help" class="field-help">Portable: written to the GPX waypoint description.</span></label>
      <label class="check-row"><input id="lock-point" type="checkbox"${intent.lockPoint ? ' checked' : ''}><span><strong>Lock this place</strong><small>The checked route must pass within the validation corridor.</small></span></label>
      <label class="check-row"><input id="lock-segment" type="checkbox"${intent.lockToNext ? ' checked' : ''}><span><strong>Lock line to the next marker</strong><small>The checked route must follow this part of your original line.</small></span></label>
      ${state.license === 'unlocked' ? `<div class="templates"><span>Apply field-kit template</span><div class="chip-row"><button type="button" class="chip" data-template="Water: confirm seasonal availability">Water</button><button type="button" class="chip" data-template="Ferry: check final sailing and booking">Ferry</button><button type="button" class="chip" data-template="Surface: loaded-bike clearance checked">Rough surface</button><button type="button" class="chip" data-template="Avoid after dusk">Night</button></div></div>` : ''}
      <button class="text-button danger-text" id="delete-intent" type="button">Delete this marker</button>
    </form>` : `<div class="add-intent-block"><p>No marker at this point yet. Add one to record why this place or the route after it matters.</p><button class="button primary" id="add-intent">Add intent here</button></div>`}
    <ol class="intent-list" aria-label="Route intent markers">${[...state.route.intents].sort((a, b) => a.trackIndex - b.trackIndex).map((item, index) => `<li><button data-select-intent="${item.id}"${item.id === state.selectedIntentId ? ' aria-current="true"' : ''}><span class="marker-number">${index + 1}</span><span><strong>${escapeHtml(item.note || kindLabels[item.kind])}</strong><small>${kindLabels[item.kind]} · point ${item.trackIndex + 1}${item.lockToNext ? ' · line locked' : item.lockPoint ? ' · place locked' : ' · note only'}</small></span></button></li>`).join('')}</ol>
    ${state.undoIntent ? `<button class="undo" id="undo-delete">Undo deleted marker</button>` : ''}
  </section>`;
}

function validationMarkup(): string {
  const report = state.report;
  return `<section class="validation panel" aria-labelledby="validate-heading">
    <div class="section-head"><div class="section-number">3</div><div><p class="eyebrow">Check the round trip</p><h2 id="validate-heading">Export & validate</h2></div></div>
    <p>Export this exact line, open it in a target app, then bring that app’s GPX back here. Validation is geometric—it cannot guarantee road safety or app behavior.</p>
    <label class="range-label" for="tolerance">Validation corridor <output id="tolerance-output">${state.tolerance} m</output></label>
    <input id="tolerance" type="range" min="20" max="250" step="5" value="${state.tolerance}">
    <div class="button-stack"><button class="button primary" id="export-route"${state.route.track.length < 2 ? ' disabled' : ''}>Export intent GPX</button><button class="button secondary" id="validate-file"${state.route.intents.length === 0 ? ' disabled' : ''}>Check returned GPX</button></div>
    <input class="visually-hidden" id="candidate-input" type="file" aria-label="Returned GPX file to validate" accept=".gpx,application/gpx+xml,application/xml,text/xml">
    ${report ? `<div class="report ${report.pass ? 'pass' : 'fail'}" tabindex="-1" id="validation-report">
      <h3>${report.pass ? '✓ Route intent retained' : '△ Some intent was lost'}</h3><p>${report.candidatePoints} candidate points checked against a ${report.toleranceMeters} m corridor.</p>
      <ul>${report.checks.map((check) => `<li><span aria-hidden="true">${check.pass ? '✓' : '×'}</span><div><strong>${escapeHtml(check.label)}</strong><small>${escapeHtml(check.detail)}</small></div></li>`).join('')}</ul>
    </div>` : `<div class="pending-check"><span aria-hidden="true">↗</span><p><strong>No returned route checked yet.</strong><br>Its track line is compared locally in this browser.</p></div>`}
  </section>`;
}

function paidMarkup(): string {
  const stateCopy = state.license;
  if (stateCopy === 'unlocked') {
    const saved = loadSaved();
    return `<section class="field-kit" aria-labelledby="field-kit-heading"><div><p class="eyebrow">Field kit unlocked</p><h2 id="field-kit-heading">Reusable planning, still local</h2><p>Save named workspaces and apply fast intent-note templates. Core GPX export and validation remain free.</p></div>
      <form id="save-workspace" class="inline-form"><label for="workspace-name">Workspace name</label><div><input id="workspace-name" value="${escapeHtml(state.route.name)}"><button class="button secondary">Save locally</button></div></form>
      ${saved.length ? `<div class="saved-routes"><h3>Saved workspaces</h3><ul>${saved.map((route, index) => `<li><button data-load-saved="${index}">${escapeHtml(route.name)}<small>${route.track.length} points · ${route.intents.length} intents</small></button></li>`).join('')}</ul></div>` : ''}
      <button class="text-button" id="remove-license">Remove license from this device</button></section>`;
  }
  const notice = stateCopy === 'invalid' ? 'License no longer active. You can keep using every free route tool.' : stateCopy === 'offline' ? 'Verification is unavailable offline. Free tools still work.' : stateCopy === 'checking' ? 'Checking saved license…' : '';
  return `<section class="field-kit locked" aria-labelledby="field-kit-heading"><div><p class="eyebrow">Field kit</p><h2 id="field-kit-heading">Reusable planning, coming later</h2><p>New purchases are not available yet. Existing license holders can still restore multiple local workspaces and water, ferry, surface, and night templates. Core export, validation, accessibility, and safety notices stay free.</p></div>
    ${notice ? `<p class="license-notice">${notice}</p>` : ''}
    <form id="restore-license" class="inline-form"><label for="license-token">Have a license? Paste it here</label><div><input id="license-token" autocomplete="off" spellcheck="false"><button class="button secondary">Verify license</button></div></form>
    <p class="legal-small">No payment is taken by this site. See <a href="/privacy/">privacy</a> and <a href="/terms/">terms</a>.</p></section>`;
}

function loadSaved(): RouteDocument[] {
  try { const routes = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') as RouteDocument[]; return Array.isArray(routes) ? routes : []; } catch { return []; }
}

function render(): void {
  const distance = routeDistance(state.route.track);
  app!.innerHTML = `<header class="site-header"><a class="brand" href="/" aria-label="Tour Route Intent home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>Tour Route<br><strong>Intent</strong></span></a>
    <nav aria-label="Utility navigation"><a href="#how">How it works</a><a href="#field-kit">Field kit</a><button id="theme-toggle" class="icon-button" aria-label="Toggle color theme"><span aria-hidden="true">◐</span></button></nav></header>
    <main id="main"><section class="intro" aria-labelledby="page-title"><div><p class="eyebrow">A portable memory for your route</p><h1 id="page-title">Keep the line.<br><em>Keep the reason.</em></h1><p class="lede">Mark the places and segments you chose on purpose. Carry those decisions in GPX, then check whether another app kept them.</p></div>
      <div class="scope-note"><span class="scope-symbol" aria-hidden="true">⌁</span><div><strong>This is not a routing engine.</strong><p>No live map, traffic, or safety guarantee. Your route and notes stay in this browser and exported files unless you share them.</p></div></div></section>
    ${state.online ? '' : `<div class="offline-banner" role="status"><strong>Offline.</strong> Planning, export, and local validation still work. License verification will wait.</div>`}
    <div class="live-region" aria-live="polite" aria-atomic="true">${escapeHtml(state.status)}</div>${state.error ? `<div class="error-banner" role="alert"><strong>Couldn’t complete that.</strong> ${escapeHtml(state.error)}</div>` : ''}
    <section class="workbench" aria-labelledby="workbench-heading"><div class="workbench-bar"><div><span class="section-number">1</span><div><p class="eyebrow">Bring your chosen line</p><h2 id="workbench-heading">Route workbench</h2></div></div>
      <div class="route-actions"><button class="button secondary" id="import-route">Import GPX</button><button class="button ghost" id="clear-route"${state.route.track.length ? '' : ' disabled'}>Clear</button><input class="visually-hidden" id="route-input" type="file" aria-label="GPX route file to import" accept=".gpx,application/gpx+xml,application/xml,text/xml"></div></div>
      ${state.route.track.length ? `<div class="route-meta"><label>Route name<input id="route-name" value="${escapeHtml(state.route.name)}" maxlength="80"></label><dl><div><dt>Track points</dt><dd>${state.route.track.length}</dd></div><div><dt>Line length</dt><dd>${formatDistance(distance)}</dd></div><div><dt>Intent markers</dt><dd>${state.route.intents.length}</dd></div></dl></div>` : ''}
      <div class="canvas-shell">${canvasMarkup()}</div>
      ${state.route.track.length ? `<details class="coordinate-add"><summary>Add a coordinate manually</summary><form id="coordinate-form"><label>Latitude<input name="lat" type="number" min="-90" max="90" step="any" required></label><label>Longitude<input name="lon" type="number" min="-180" max="180" step="any" required></label><button class="button secondary">Append point</button></form></details>` : ''}
    </section>
    <div class="lower-grid" id="how">${editorMarkup()}${validationMarkup()}</div>
    <div id="field-kit">${paidMarkup()}</div>
    <section class="method"><p class="eyebrow">What the file carries</p><div><h2>The line remains standard GPX.</h2><p>Intent markers are ordinary GPX waypoints with readable names and descriptions. Lock details also live in a namespaced extension. Apps that ignore extensions can still show the line and notes; they may still recalculate it, which is why the return check exists.</p></div><ol><li><span>01</span>Import or draw your known line</li><li><span>02</span>Mark deliberate places and spans</li><li><span>03</span>Export, open elsewhere, validate</li></ol></section>
    </main><footer><div class="brand footer-brand"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>Tour Route <strong>Intent</strong></span></div><p>Local-first route preparation for self-supported touring cyclists.</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/B-Divyesh/sf-tour-route-intent">Source</a></nav><small>Illustration generated for this product with Azure AI Foundry. © 2026 Sociobot.</small></footer>`;
  bindEvents();
}

function click(id: string, handler: () => void): void { document.querySelector<HTMLElement>(`#${id}`)?.addEventListener('click', handler); }

function readFile(input: HTMLInputElement, callback: (text: string) => void): void {
  const file = input.files?.[0]; if (!file) return;
  if (file.size > 15_000_000) { fail('That GPX is larger than 15 MB. Simplify the track first, then import it again.'); render(); return; }
  const reader = new FileReader();
  reader.onload = () => callback(String(reader.result));
  reader.onerror = () => { fail('The file could not be read. Try exporting it again.'); render(); };
  reader.readAsText(file);
}

function download(name: string, contents: string): void {
  const blob = new Blob([contents], { type: 'application/gpx+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url);
}

function addIntent(): void {
  if (state.selectedIndex === null) return;
  const existing = state.route.intents.find((intent) => intent.trackIndex === state.selectedIndex);
  if (existing) { state.selectedIntentId = existing.id; render(); return; }
  const intent: RouteIntent = { id: crypto.randomUUID(), trackIndex: state.selectedIndex, kind: 'other', note: '', lockPoint: true, lockToNext: false };
  state.route.intents.push(intent); state.selectedIntentId = intent.id; saveDraft(); announce('Intent marker added.'); render();
  requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>('#intent-note')?.focus());
}

function bindEvents(): void {
  click('theme-toggle', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; localStorage.setItem(THEME_KEY, next);
  });
  const routeInput = document.querySelector<HTMLInputElement>('#route-input');
  const openImport = () => routeInput?.click();
  click('import-route', openImport); click('empty-import', openImport);
  routeInput?.addEventListener('change', () => readFile(routeInput, (text) => {
    try { const route = parseGpx(text); setRoute(route, `Imported ${route.track.length} route points and ${route.intents.length} intent markers.`); } catch (error) { fail(error instanceof Error ? error.message : 'The GPX could not be parsed.'); render(); }
  }));
  click('example-route', () => setRoute(exampleRoute(), 'Example route loaded. Try changing its intent markers or validating an exported copy.'));
  click('clear-route', () => { if (confirm(`Clear “${state.route.name}” and its ${state.route.intents.length} intent markers?`)) setRoute(emptyRoute(), 'Route cleared.'); });
  document.querySelector<HTMLInputElement>('#route-name')?.addEventListener('change', (event) => { state.route.name = (event.target as HTMLInputElement).value.trim() || 'Untitled tour'; saveDraft(); announce('Route name saved locally.'); render(); });
  document.querySelector<HTMLFormElement>('#coordinate-form')?.addEventListener('submit', (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget as HTMLFormElement); const lat = Number(data.get('lat')); const lon = Number(data.get('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) { fail('Enter latitude from −90 to 90 and longitude from −180 to 180.'); render(); return; }
    state.route.track.push({ lat, lon }); state.selectedIndex = state.route.track.length - 1; saveDraft(); announce('Coordinate appended to the route line.'); render();
  });
  const canvas = document.querySelector<SVGSVGElement>('#route-canvas');
  canvas?.addEventListener('click', (event) => {
    if ((event.target as Element).closest('.intent-node')) return;
    const rect = canvas.getBoundingClientRect(); const x = ((event.clientX - rect.left) / rect.width) * 800; const y = ((event.clientY - rect.top) / rect.height) * 520;
    const projected = projectTrack(state.route.track); let closest = 0; let distance = Number.POSITIVE_INFINITY;
    projected.xy.forEach(([px, py], index) => { const d = (px - x) ** 2 + (py - y) ** 2; if (d < distance) { distance = d; closest = index; } });
    state.selectedIndex = closest; state.selectedIntentId = state.route.intents.find((intent) => intent.trackIndex === closest)?.id ?? null; render();
  });
  canvas?.addEventListener('keydown', (event) => {
    if (!state.route.track.length) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); state.selectedIndex = Math.min(state.route.track.length - 1, (state.selectedIndex ?? 0) + 1); state.selectedIntentId = state.route.intents.find((item) => item.trackIndex === state.selectedIndex)?.id ?? null; render(); requestAnimationFrame(() => document.querySelector<SVGSVGElement>('#route-canvas')?.focus()); }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); state.selectedIndex = Math.max(0, (state.selectedIndex ?? 0) - 1); state.selectedIntentId = state.route.intents.find((item) => item.trackIndex === state.selectedIndex)?.id ?? null; render(); requestAnimationFrame(() => document.querySelector<SVGSVGElement>('#route-canvas')?.focus()); }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); addIntent(); }
  });
  document.querySelectorAll<SVGGElement>('[data-intent]').forEach((node) => {
    const select = () => { const id = node.dataset.intent ?? ''; const intent = state.route.intents.find((item) => item.id === id); if (!intent) return; state.selectedIntentId = id; state.selectedIndex = intent.trackIndex; render(); };
    node.addEventListener('click', select); node.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } });
  });
  click('add-intent', addIntent);
  document.querySelectorAll<HTMLButtonElement>('[data-select-intent]').forEach((button) => button.addEventListener('click', () => { const intent = state.route.intents.find((item) => item.id === button.dataset.selectIntent); if (!intent) return; state.selectedIntentId = intent.id; state.selectedIndex = intent.trackIndex; render(); }));
  const intent = selectedIntent();
  document.querySelector<HTMLSelectElement>('#intent-kind')?.addEventListener('change', (event) => { if (!intent) return; intent.kind = (event.target as HTMLSelectElement).value as IntentKind; saveDraft(); announce('Intent type updated.'); });
  document.querySelector<HTMLTextAreaElement>('#intent-note')?.addEventListener('change', (event) => { if (!intent) return; intent.note = (event.target as HTMLTextAreaElement).value.trim(); saveDraft(); announce('Intent note saved locally.'); render(); });
  document.querySelector<HTMLInputElement>('#lock-point')?.addEventListener('change', (event) => { if (!intent) return; intent.lockPoint = (event.target as HTMLInputElement).checked; saveDraft(); announce(intent.lockPoint ? 'Place locked.' : 'Place lock removed; note remains.'); render(); });
  document.querySelector<HTMLInputElement>('#lock-segment')?.addEventListener('change', (event) => { if (!intent) return; intent.lockToNext = (event.target as HTMLInputElement).checked; saveDraft(); announce(intent.lockToNext ? 'Line to the next marker locked.' : 'Line lock removed.'); render(); });
  document.querySelectorAll<HTMLButtonElement>('[data-template]').forEach((button) => button.addEventListener('click', () => { if (!intent) return; intent.note = button.dataset.template ?? ''; saveDraft(); announce('Field-kit template applied.'); render(); requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>('#intent-note')?.focus()); }));
  click('delete-intent', () => { if (!intent) return; state.undoIntent = { ...intent }; state.route.intents = state.route.intents.filter((item) => item.id !== intent.id); state.selectedIntentId = null; saveDraft(); announce('Intent marker deleted.'); render(); });
  click('undo-delete', () => { if (!state.undoIntent) return; state.route.intents.push(state.undoIntent); state.selectedIntentId = state.undoIntent.id; state.selectedIndex = state.undoIntent.trackIndex; state.undoIntent = null; saveDraft(); announce('Intent marker restored.'); render(); });
  const tolerance = document.querySelector<HTMLInputElement>('#tolerance');
  tolerance?.addEventListener('input', () => { state.tolerance = Number(tolerance.value); const output = document.querySelector<HTMLOutputElement>('#tolerance-output'); if (output) output.value = `${state.tolerance} m`; });
  tolerance?.addEventListener('change', () => { state.report = null; announce(`Validation corridor set to ${state.tolerance} metres.`); render(); });
  click('export-route', () => { download(`${state.route.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tour-route'}-intent.gpx`, exportGpx(state.route)); announce('Intent GPX exported. Open it in your target app, then return its GPX for checking.'); render(); });
  const candidateInput = document.querySelector<HTMLInputElement>('#candidate-input'); click('validate-file', () => candidateInput?.click());
  candidateInput?.addEventListener('change', () => readFile(candidateInput, (text) => { try { const candidate = parseGpx(text); state.report = validateRoute(state.route, candidate.track, state.tolerance); announce(state.report.pass ? 'Returned route retained every locked intent.' : 'Returned route lost at least one locked intent.'); render(); requestAnimationFrame(() => document.querySelector<HTMLElement>('#validation-report')?.focus()); } catch (error) { fail(error instanceof Error ? error.message : 'The returned GPX could not be checked.'); render(); } }));
  document.querySelector<HTMLFormElement>('#restore-license')?.addEventListener('submit', async (event) => { event.preventDefault(); const input = document.querySelector<HTMLInputElement>('#license-token'); const value = input?.value.trim() ?? ''; if (!value) { fail('Paste the license token from your purchase email.'); render(); return; } storeLicense(value); state.licenseToken = value; state.license = 'checking'; announce('Checking license…'); render(); state.license = await verifyLicense(value); announce(state.license === 'unlocked' ? 'Field kit unlocked on this device.' : 'That license could not be verified.'); render(); });
  click('remove-license', () => { removeLicense(); state.licenseToken = null; state.license = 'free'; announce('License removed from this device. Saved local routes were not deleted.'); render(); });
  document.querySelector<HTMLFormElement>('#save-workspace')?.addEventListener('submit', (event) => { event.preventDefault(); const name = document.querySelector<HTMLInputElement>('#workspace-name')?.value.trim() || state.route.name; const routes = loadSaved(); const copy = structuredClone(state.route); copy.name = name; const existing = routes.findIndex((route) => route.name === name); if (existing >= 0) routes[existing] = copy; else routes.push(copy); localStorage.setItem(SAVED_KEY, JSON.stringify(routes)); announce(`Saved “${name}” on this device.`); render(); });
  document.querySelectorAll<HTMLButtonElement>('[data-load-saved]').forEach((button) => button.addEventListener('click', () => { const route = loadSaved()[Number(button.dataset.loadSaved)]; if (route) setRoute(structuredClone(route), `Loaded “${route.name}”.`); }));
}

const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.dataset.theme = savedTheme;
render();

window.addEventListener('online', () => { state.online = true; announce('Back online.'); render(); });
window.addEventListener('offline', () => { state.online = false; announce('Offline mode. Local planning still works.'); render(); });

if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(() => { /* offline is an enhancement */ });
if (token) void verifyLicense(token).then((license) => { state.license = license; render(); });
