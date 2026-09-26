import { test, expect } from '@playwright/test';

async function firstPlace(page) {
  return page.evaluate(async () => (await (await fetch('data/places.json')).json()).find((p) => p.permits_required.length && p.status === 'open'));
}

test('home loads with island picker and search', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Which permits');
  await expect(page.getByRole('group', { name: 'Island' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Map' }).first()).toBeVisible();
});

test('search finds a place with or without ʻokina', async ({ page }) => {
  await page.goto('./#/search');
  const p = await firstPlace(page);
  const plain = p.name.normalize('NFD').replace(/[̀-ͯʻ]/g, '').split(' ')[0];
  await page.getByRole('searchbox').fill(plain);
  await expect(page.locator('.results a').first()).toBeVisible();
  await page.getByRole('searchbox').fill(p.name.split(' ')[0]);
  await expect(page.locator('.results a').first()).toBeVisible();
});

test('place page shows permits and official link', async ({ page }) => {
  await page.goto('./');
  const p = await firstPlace(page);
  await page.goto(`./#/place/${p.id}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.name);
  await expect(page.getByRole('heading', { name: 'What you need' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Official page/ }).first()).toHaveAttribute('href', /^https?:\/\//);
  await expect(page.getByRole('link', { name: 'Suggest an edit' })).toHaveAttribute('href', /report-change\.yml.*place_id=/);
});

test('trip planner builds a checklist and shares a link', async ({ page }) => {
  await page.goto('./');
  const p = await firstPlace(page);
  await page.goto(`./#/place/${p.id}`);
  await page.getByRole('button', { name: 'Add to trip' }).click();
  await expect(page).toHaveURL(/#\/plan\//);
  await page.locator('[data-start]').first().fill('2099-06-10');
  await page.locator('[data-end]').first().fill('2099-06-12');
  await expect(page.locator('.checklist li').first()).toBeVisible();
  await expect(page.locator('.checklist')).toContainText(/Booking|Official page/);
  const trips = await page.evaluate(() => new Promise((r) => { const req = indexedDB.open('keyval-store'); req.onsuccess = () => { const tx = req.result.transaction('keyval'); tx.objectStore('keyval').get('trips').onsuccess = (e) => r(e.target.result); }; }));
  expect(trips.length).toBe(1);
});

test('permit wallet stores a file on the device', async ({ page }) => {
  await page.goto('./#/wallet');
  await page.setInputFiles('#file', { name: 'permit.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') });
  await page.fill('#name', 'Test permit');
  await page.getByRole('button', { name: 'Add to wallet' }).click();
  await expect(page.locator('.wallet-item img')).toBeVisible();
});

test('works offline after first load', async ({ page, context }) => {
  await page.goto('./');
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready);
  await page.waitForTimeout(1500);
  const p = await firstPlace(page);
  await context.setOffline(true);
  await page.goto(`./#/place/${p.id}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.name);
  await expect(page.locator('#banner')).toContainText('offline');
  await context.setOffline(false);
});

test('map loads tiles and draws markers', async ({ page }) => {
  const failed = [];
  page.on('response', (r) => { if (r.status() >= 400 && /assets\//.test(r.url())) failed.push(r.url()); });
  await page.goto('./#/map');
  await expect(page.locator('.marker').first()).toBeVisible({ timeout: 30000 });
  expect(await page.locator('.marker').count()).toBeGreaterThan(20);
  expect(failed).toEqual([]);
  await page.locator('.marker').first().click();
  await expect(page.locator('#sheet')).toBeVisible();
  await expect(page.locator('#sheet').getByRole('link', { name: 'Full details' })).toBeVisible();
});
