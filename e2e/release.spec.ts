import { expect, test } from '@playwright/test';

const MODULES = [
  { slug: 'membagi-adil', heading: '1 · Membagi adil' },
  { slug: 'membaca-pecahan', heading: '2 · Pembilang, penyebut, garis bilangan' },
  { slug: 'membandingkan', heading: '3 · Membandingkan pecahan' },
  { slug: 'senilai', heading: '4 · Pecahan senilai' },
  { slug: 'pecahan-campuran', heading: '5 · Pecahan campuran' },
  { slug: 'jumlah-penyebut-sama', heading: '6 · Jumlah & kurang, penyebut sama' },
  { slug: 'jumlah-penyebut-beda', heading: '7 · Jumlah & kurang, penyebut beda' },
  { slug: 'pecahan-dari-jumlah', heading: '8 · Pecahan dari suatu jumlah' },
];

test('makes no third-party requests', async ({ page, context, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'laptop', 'release check runs once');
  test.setTimeout(120_000);
  const origin = new URL(baseURL!).origin;
  const outside: string[] = [];
  context.on('request', (request) => {
    const url = request.url();
    if (url === 'about:blank' || url.startsWith('data:') || url.startsWith('blob:')) return;
    try {
      if (new URL(url).origin !== origin) outside.push(url);
    } catch {
      outside.push(url);
    }
  });

  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await page.waitForLoadState('networkidle');

  for (const mod of MODULES) {
    for (const view of ['peraga', 'latihan']) {
      await page.goto('about:blank');
      await page.goto(`./#/${mod.slug}/${view}`);
      await expect(page.getByRole('heading', { name: mod.heading })).toBeVisible();
      await page.waitForLoadState('networkidle');
    }
  }

  expect(outside).toEqual([]);
});
