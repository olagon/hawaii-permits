// Generates README screenshots into docs/screenshots. Run with: npm run screenshots
import { test } from '@playwright/test';

test('screenshots', async ({ page }) => {
  const shot = (name) => page.screenshot({ path: `docs/screenshots/${name}.png` });
  await page.goto('./');
  await page.waitForSelector('#places .place-row');
  await shot('home');
  const p = await page.evaluate(async () => (await (await fetch('data/places.json')).json()).find((x) => x.permits_required.length > 1 && x.status === 'open'));
  await page.goto(`./#/place/${p.id}`);
  await page.waitForSelector('h2');
  await shot('place');
  await page.goto('./#/map');
  await page.waitForSelector('.marker', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await shot('map');
  await page.goto(`./#/place/${p.id}`);
  await page.getByRole('button', { name: 'Add to trip' }).click();
  await page.locator('[data-start]').first().fill('2099-06-10');
  await page.locator('[data-end]').first().fill('2099-06-12');
  await page.waitForSelector('.checklist li');
  await shot('planner');
});
