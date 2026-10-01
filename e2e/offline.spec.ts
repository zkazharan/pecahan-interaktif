import { expect, test } from '@playwright/test';

test('works offline after the first visit', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'laptop', 'offline check runs once');
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.goto('./#/membandingkan/peraga');
  await expect(page.getByRole('heading', { name: '3 · Membandingkan pecahan' })).toBeVisible();
  await page.goto('./#/membandingkan/latihan');
  await expect(page.getByText('Soal 1 dari 5')).toBeVisible();
});
