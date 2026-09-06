import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('first screen states the job, audience, and sample action on phone and desktop', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page).toHaveTitle('Tour Route Intent — export and check GPX choices');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Preserve and check your GPX route');
    await expect(page.getByText(/For self-supported touring cyclists/)).toBeVisible();
    const sampleAction = page.getByRole('link', { name: 'Try it with sample data' }).first();
    await expect(sampleAction).toBeVisible();
    expect((await sampleAction.boundingBox())?.y).toBeLessThan(viewport.height);
  }
});

test('loads the demo, edits intent, exports, validates, and has no accessibility violations', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/demo/');
  await expect(page).toHaveTitle('Demo — Tour Route Intent');
  await expect(page.getByLabel('Route name')).toHaveValue('Harbour to high pass');
  await page.getByRole('button', { name: /^1 Stay on the signed gravel/ }).click();
  await expect(page.getByLabel('Short note')).toHaveValue('Stay on the signed gravel towpath');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export intent GPX' }).click();
  const exported = await download;
  const exportPath = await exported.path();
  expect(exported.suggestedFilename()).toBe('harbour-to-high-pass-intent.gpx');
  await page.locator('#candidate-input').setInputFiles(exportPath!);
  await expect(page.getByRole('heading', { name: '✓ Route intent retained' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  expect(errors).toEqual([]);
});

test('keyboard can select the route and add an intent', async ({ page }) => {
  await page.goto('/demo/');
  const canvas = page.getByRole('application', { name: /Route line/ });
  await canvas.focus();
  await canvas.press('ArrowRight');
  await canvas.press('Enter');
  await expect(page.getByLabel('Short note')).toBeFocused();
});

test('invalid input keeps the route usable and valid boundary input recovers', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByText('Add a coordinate manually').click();
  await page.getByLabel('Latitude').fill('91');
  await page.getByLabel('Longitude').fill('180');
  await page.getByRole('button', { name: 'Append point' }).click();
  await expect(page.getByText('Track points').locator('..').getByRole('definition')).toHaveText('9');
  await page.getByLabel('Latitude').fill('90');
  await page.getByRole('button', { name: 'Append point' }).click();
  await expect(page.getByText('Track points').locator('..').getByRole('definition')).toHaveText('10');

  await page.locator('#route-input').setInputFiles({
    name: 'broken.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from('<gpx><metadata/></gpx>'),
  });
  await expect(page.getByRole('alert')).toContainText('No usable route line');
  await page.locator('#route-input').setInputFiles({
    name: 'valid.gpx', mimeType: 'application/gpx+xml',
    buffer: Buffer.from('<gpx version="1.1"><trk><name>Self closing</name><trkseg><trkpt lat="51" lon="-1"/><trkpt lat="51.1" lon="-1.1"/></trkseg></trk></gpx>'),
  });
  await expect(page.getByLabel('Route name')).toHaveValue('Self closing');
});

test('legal pages and the designed 404 use complete route structure', async ({ page }) => {
  for (const route of ['/privacy/', '/terms/']) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('header nav')).toBeVisible();
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('footer')).toContainText('Built by Param Factory');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /tour-route-intent-social\.jpg/);
  }
  const response = await page.goto('/not-a-real-route');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found — Tour Route Intent');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page does not exist');
  await expect(page.getByRole('link', { name: 'Return to the route checker' })).toBeVisible();
});

test('fits a 390px phone at normal and 200 percent text size', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo/');
  for (const size of ['100%', '200%']) {
    await page.locator('html').evaluate((element, fontSize) => { element.style.fontSize = String(fontSize); }, size);
    const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(widths.content).toBe(widths.viewport);
  }
});

test('dark reduced-motion mode has no accessibility violations or motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/demo/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  const transition = await page.getByRole('button', { name: 'Export intent GPX' }).evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(transition).toBe('0s');
});

test('focus starts at the skip link with a designed visible ring', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to route planner' })).toBeFocused();
  const outline = await page.getByRole('link', { name: 'Skip to route planner' }).evaluate((element) => getComputedStyle(element).outline);
  expect(outline).toContain('3px');
});
