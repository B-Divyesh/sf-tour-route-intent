import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('loads the planner, edits intent, exports and has no serious accessibility issues', async ({ page }) => {
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
  expect((await download).suggestedFilename()).toContain('harbour-to-high-pass');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
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
