import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const sampleTrack = [
  [54.9681, -3.1802], [54.9804, -3.1421], [54.9918, -3.1074],
  [55.0128, -3.0829], [55.0275, -3.0402], [55.0516, -3.0121],
  [55.0683, -2.9688], [55.0834, -2.9239], [55.1024, -2.8810],
] as const;

function makeGpx(name: string, points: ReadonlyArray<readonly [number, number]>): string {
  return `<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${name}</name><trkseg>${points.map(([lat, lon]) => `<trkpt lat="${lat}" lon="${lon}"/>`).join('')}</trkseg></trk></gpx>`;
}

async function exportedText(page: Page): Promise<string> {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export intent GPX' }).click();
  const path = await (await pending).path();
  if (!path) throw new Error('The browser did not provide the exported file');
  return readFile(path, 'utf8');
}

async function exportedSummary(page: Page, xml: string) {
  return page.evaluate((source) => {
    const documentNode = new DOMParser().parseFromString(source, 'application/xml');
    const points = [...documentNode.querySelectorAll('trkpt')].map((point) => [Number(point.getAttribute('lat')), Number(point.getAttribute('lon'))]);
    return {
      root: documentNode.documentElement.localName,
      namespace: documentNode.documentElement.namespaceURI,
      version: documentNode.documentElement.getAttribute('version'),
      parserErrors: documentNode.querySelectorAll('parsererror').length,
      points,
      waypoints: [...documentNode.querySelectorAll('wpt')].map((waypoint) => ({
        note: waypoint.querySelector('desc')?.textContent,
        lockPoint: [...waypoint.getElementsByTagNameNS('*', 'lockPoint')][0]?.textContent,
        lockToNext: [...waypoint.getElementsByTagNameNS('*', 'lockToNext')][0]?.textContent,
      })),
    };
  }, xml);
}

test('@claim:demo-isolation sample work never changes the real draft', async ({ page }) => {
  await page.goto('/demo/');
  await page.evaluate(() => localStorage.setItem('tour-route-intent:draft', JSON.stringify({ name: 'My real coast route', track: [{ lat: 50, lon: -4 }, { lat: 50.1, lon: -4.1 }], intents: [] })));
  await page.getByLabel('Route name').fill('Changed sample');
  await page.getByLabel('Route name').press('Tab');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByLabel('Route name')).toHaveValue('Harbour to high pass');
  expect(await page.evaluate(() => localStorage.getItem('tour-route-intent:draft'))).toContain('My real coast route');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page.getByLabel('Route name')).toHaveValue('My real coast route');
});

test('@claim:local-processing editing, exporting, and checking do not upload route data', async ({ page }) => {
  await page.goto('/demo/');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.getByRole('button', { name: /^1 Stay on the signed gravel/ }).click();
  await page.getByLabel('Short note').fill('Use the west bank after rain');
  await page.getByLabel('Short note').press('Tab');
  const xml = await exportedText(page);
  await page.locator('#candidate-input').setInputFiles({ name: 'returned.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(xml) });
  await expect(page.getByRole('heading', { name: '✓ Route intent retained' })).toBeVisible();
  expect(requests.filter((url) => new URL(url).origin !== 'http://127.0.0.1:4173')).toEqual([]);
});

test('@claim:no-routing imports and exports the supplied point order without recalculating it', async ({ page }) => {
  const original = [[51, -1], [51.07, -1.19], [51.03, -1.04]] as const;
  await page.goto('/demo/');
  await page.locator('#route-input').setInputFiles({ name: 'zigzag.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(makeGpx('Zigzag', original)) });
  const summary = await exportedSummary(page, await exportedText(page));
  expect(summary.points).toEqual(original.map((point) => [...point]));
});

test('@claim:no-live-services route editing requests no map, traffic, location, or safety service', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, '__locationCalls', { value: 0, writable: true });
    navigator.geolocation.getCurrentPosition = () => { (window as Window & { __locationCalls: number }).__locationCalls += 1; };
  });
  const external: string[] = [];
  page.on('request', (request) => { if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') external.push(request.url()); });
  await page.goto('/demo/');
  await page.getByRole('application', { name: /Route line/ }).click({ position: { x: 120, y: 120 } });
  expect(await page.evaluate(() => (window as Window & { __locationCalls: number }).__locationCalls)).toBe(0);
  expect(external).toEqual([]);
});

test('@claim:gpx-import imports track and route point forms including self-closing points', async ({ page }) => {
  await page.goto('/demo/');
  await page.locator('#route-input').setInputFiles({
    name: 'route-points.gpx', mimeType: 'application/gpx+xml',
    buffer: Buffer.from('<gpx version="1.1"><rte><name>Ferry approach</name><rtept lat="51" lon="-1"/><rtept lat="51.1" lon="-1.1"/></rte></gpx>'),
  });
  await expect(page.getByLabel('Route name')).toHaveValue('Ferry approach');
  await expect(page.locator('.route-meta dd').first()).toHaveText('2');
});

test('@claim:point-selection pointer, touch, and keyboard actions select route points', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/demo/');
  const canvas = page.getByRole('application', { name: /Route line/ });
  await canvas.tap({ position: { x: 280, y: 80 } });
  await expect(page.locator('.point-readout')).not.toContainText('Selected point 1 of 9');
  await page.reload();
  const reloadedCanvas = page.getByRole('application', { name: /Route line/ });
  await reloadedCanvas.focus();
  await reloadedCanvas.press('ArrowRight');
  await reloadedCanvas.press('Enter');
  await expect(page.getByLabel('Short note')).toBeFocused();
  await context.close();
});

test('@claim:export-waypoints exports readable notes and lock metadata', async ({ page }) => {
  await page.goto('/demo/');
  const summary = await exportedSummary(page, await exportedText(page));
  expect(summary.waypoints).toHaveLength(3);
  expect(summary.waypoints[0]).toEqual({ note: 'Stay on the signed gravel towpath', lockPoint: 'true', lockToNext: 'true' });
});

test('@claim:point-and-line-locks rejects a returned route that leaves a locked line', async ({ page }) => {
  const detour = [56.5, -4.5] as const;
  const returned = sampleTrack.flatMap((point, index) => index >= 3 && index <= 5 ? [detour, point] : [point]);
  await page.goto('/demo/');
  await page.locator('#candidate-input').setInputFiles({ name: 'detour.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(makeGpx('Detour', returned)) });
  await expect(page.getByRole('heading', { name: '△ Some intent was lost' })).toBeVisible();
  await expect(page.getByText(/two-way line check/)).toBeVisible();
});

test('@claim:standard-gpx-export produces valid GPX 1.1 track geometry', async ({ page }) => {
  await page.goto('/demo/');
  const summary = await exportedSummary(page, await exportedText(page));
  expect(summary).toMatchObject({ root: 'gpx', namespace: 'http://www.topografix.com/GPX/1/1', version: '1.1', parserErrors: 0 });
  expect(summary.points).toHaveLength(9);
});

test('@claim:corridor-validation changing the corridor changes a near-route result', async ({ page }) => {
  const shifted = sampleTrack.map(([lat, lon]) => [lat, lon + 0.0005] as const);
  const file = { name: 'nearby.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(makeGpx('Nearby', shifted)) };
  await page.goto('/demo/');
  await page.getByLabel('Validation corridor').fill('20');
  await page.getByLabel('Validation corridor').press('ArrowLeft');
  await page.locator('#candidate-input').setInputFiles(file);
  await expect(page.getByRole('heading', { name: '△ Some intent was lost' })).toBeVisible();
  await page.getByLabel('Validation corridor').fill('250');
  await page.getByLabel('Validation corridor').press('ArrowRight');
  await page.locator('#candidate-input').setInputFiles(file);
  await expect(page.getByRole('heading', { name: '✓ Route intent retained' })).toBeVisible();
});

test('@claim:local-autosave restores a changed real route after reload', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.locator('#route-input').setInputFiles({ name: 'real.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(makeGpx('Real tour', [[51, -1], [51.1, -1.1]])) });
  await page.getByLabel('Route name').fill('Rain-day alternative');
  await page.getByLabel('Route name').press('Tab');
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await page.reload();
  await expect(page.getByLabel('Route name')).toHaveValue('Rain-day alternative');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => Object.keys(localStorage))).toContain('tour-route-intent:draft');
});

test('@claim:offline-reload reloads the sample after the first visit without a network', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/demo/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });
  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Route name')).toHaveValue('Harbour to high pass');
  await expect(page.getByText('Offline.')).toBeVisible();
  await context.close();
});

test('@claim:free-core exports and checks a route without a license or account', async ({ page }) => {
  await page.goto('/demo/');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('sb_license:')))).toEqual([]);
  const xml = await exportedText(page);
  await page.locator('#candidate-input').setInputFiles({ name: 'returned.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(xml) });
  await expect(page.getByRole('heading', { name: '✓ Route intent retained' })).toBeVisible();
});

test('@claim:no-analytics sends no analytics or advertising requests during the demo', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'sendBeacon', { value: () => { throw new Error('Unexpected beacon'); } }));
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo/');
  await page.getByRole('button', { name: /^2 Reliable tap/ }).click();
  await page.getByLabel('Short note').fill('Tap confirmed in May');
  await page.getByLabel('Short note').press('Tab');
  expect(requests.filter((url) => /analytics|doubleclick|googletag|segment\.com|plausible|matomo/i.test(url))).toEqual([]);
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
});

test('@claim:no-map-tiles makes no map-tile request while selecting and checking a route', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo/');
  await page.getByRole('application', { name: /Route line/ }).click({ position: { x: 300, y: 140 } });
  const xml = await exportedText(page);
  await page.locator('#candidate-input').setInputFiles({ name: 'returned.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(xml) });
  expect(requests.filter((url) => /tile|mapbox|openstreetmap|maptiler/i.test(url))).toEqual([]);
});

test('@claim:self-hosted-assets loads scripts, styles, images, and fonts only from this product', async ({ page }) => {
  const assets: Array<{ type: string; url: string }> = [];
  page.on('request', (request) => {
    if (['script', 'stylesheet', 'image', 'font'].includes(request.resourceType())) assets.push({ type: request.resourceType(), url: request.url() });
  });
  await page.goto('/');
  expect(assets.length).toBeGreaterThan(1);
  expect(assets.every(({ url }) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
  expect(assets.filter(({ type }) => type === 'font')).toEqual([]);
});

test('@claim:license-on-action contacts license verification only after a license is submitted', async ({ page }) => {
  let checks = 0;
  await page.route('https://api.sociobot.in/**', async (route) => {
    checks += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ valid: true }) });
  });
  await page.goto('/demo/');
  await page.getByRole('button', { name: /^1 Stay on the signed gravel/ }).click();
  expect(checks).toBe(0);
  await page.getByRole('link', { name: 'Start for real' }).click();
  expect(checks).toBe(0);
  await page.getByLabel('Have a license? Paste it here').fill('existing-license-token');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByRole('heading', { name: 'Reusable planning, still local' })).toBeVisible();
  expect(checks).toBe(1);
});

test('@claim:existing-license-tools saves a named workspace and applies a note template locally', async ({ page }) => {
  await page.route('https://api.sociobot.in/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ valid: true }) }));
  await page.goto('/demo/');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.getByLabel('Have a license? Paste it here').fill('existing-license-token');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await page.locator('#route-input').setInputFiles({ name: 'short.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(makeGpx('Short tour', [[51, -1], [51.1, -1.1]])) });
  const canvas = page.getByRole('application', { name: /Route line/ });
  await canvas.focus();
  await canvas.press('Enter');
  await page.getByRole('button', { name: 'Water', exact: true }).click();
  await expect(page.getByLabel('Short note')).toHaveValue('Water: confirm seasonal availability');
  await page.getByLabel('Workspace name').fill('Weekend ferry route');
  await page.getByRole('button', { name: 'Save locally' }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tour-route-intent:workspaces') || '[]'));
  expect(saved).toHaveLength(1);
  expect(saved[0].name).toBe('Weekend ferry route');
});
