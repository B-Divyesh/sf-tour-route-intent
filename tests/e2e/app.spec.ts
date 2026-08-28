import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('loads the planner, edits intent, exports and has no serious accessibility issues', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Tour Route Intent/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByLabel('Route name')).toHaveValue('Harbour to high pass');
  await page.getByRole('button', { name: /^1 Stay on the signed gravel/ }).click();
  await expect(page.getByLabel('Short note')).toHaveValue('Stay on the signed gravel towpath');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export intent GPX' }).click();
  const exported = await download;
  expect(exported.suggestedFilename()).toContain('harbour-to-high-pass');
  const exportPath = await exported.path();
  expect(exportPath).not.toBeNull();
  await page.locator('#candidate-input').setInputFiles(exportPath!);
  await expect(page.getByRole('heading', { name: '✓ Route intent retained' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('keyboard can select the route and add an intent', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  const canvas = page.getByRole('application', { name: /Route line/ });
  await canvas.focus();
  await canvas.press('ArrowRight');
  await canvas.press('Enter');
  await expect(page.getByLabel('Short note')).toBeFocused();
});

test('privacy and terms pages are reachable', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy');
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms');
});

test('fits a 390px phone without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(widths.content).toBe(widths.viewport);
  await page.getByRole('button', { name: 'Try an example' }).click();
  const routeWidths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(routeWidths.content).toBe(routeWidths.viewport);
});

test('system dark mode has accessible primary actions in empty and loaded mobile states', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/');
  const emptyResults = await new AxeBuilder({ page }).analyze();
  expect(emptyResults.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  await page.getByRole('button', { name: 'Try an example' }).click();
  const loadedResults = await new AxeBuilder({ page }).analyze();
  expect(loadedResults.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
});

test('does not advertise an unavailable checkout', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Reusable planning, coming later' })).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
  await expect(page.getByText('New purchases are not available yet.')).toBeVisible();
});

test('first load is private by default', async ({ page }) => {
  const thirdPartyRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') thirdPartyRequests.push(request.url());
  });
  await page.goto('/');
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(thirdPartyRequests).toEqual([]);
});

test('production service worker updates and restores the app offline', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });
  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  expect(await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update();
    return { active: registration?.active?.state, waiting: Boolean(registration?.waiting) };
  })).toEqual({ active: 'activated', waiting: false });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByText('Offline.')).toBeVisible();
  expect(errors).toEqual([]);
});
