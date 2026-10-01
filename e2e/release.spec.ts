import { expect, test } from '@playwright/test';

test('makes no third-party requests', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const outside: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    if (new URL(url).origin !== origin) outside.push(url);
  });
  await page.goto('./');
  await page.goto('./#/pecahan-dari-jumlah/peraga');
  await page.goto('./#/membandingkan/latihan');
  await page.waitForLoadState('networkidle');
  expect(outside).toEqual([]);
});
