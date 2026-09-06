/* global console, process, document */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const url = process.argv[2] || 'http://127.0.0.1:4173/';
const evidence = process.argv[3] || '.factory/url-verification';
await mkdir(evidence, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
const response = await page.goto(url, { waitUntil: 'networkidle' });
await page.screenshot({ path: `${evidence}/desktop.png`, fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: `${evidence}/phone.png`, fullPage: true });

const structure = await page.evaluate(() => ({
  title: document.title,
  lang: document.documentElement.lang,
  h1: document.querySelectorAll('h1').length,
  main: document.querySelectorAll('main').length,
  missingAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).length,
  unlabeledButtons: [...document.querySelectorAll('button')].filter((button) => !(button.textContent || '').trim() && !button.getAttribute('aria-label')).length,
}));
const result = { url, status: response?.status(), errors, structure };
await writeFile(`${evidence}/verify.json`, `${JSON.stringify(result, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify(result));

if (response?.status() !== 200 || errors.length || !structure.title || structure.lang !== 'en' || structure.h1 !== 1 || structure.main !== 1 || structure.missingAlt || structure.unlabeledButtons) process.exit(1);
