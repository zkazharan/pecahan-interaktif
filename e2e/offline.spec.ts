import { expect, test } from '@playwright/test';

test('works offline after the first visit', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'laptop', 'offline check runs once');
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Pecahan' })).toBeVisible();
  const fresh = await context.newPage();
  await fresh.goto('./#/membandingkan/latihan');
  await expect(fresh.getByText('Soal 1 dari 5')).toBeVisible();
  await fresh.goto('./#/membandingkan/peraga');
  await expect(fresh.getByRole('heading', { name: '3 · Membandingkan pecahan' })).toBeVisible();
});
