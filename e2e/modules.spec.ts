import { expect, test } from '@playwright/test';
import { dragTo, solveCurrentTask } from './helpers';

const MODULES = [
  { slug: 'membagi-adil', heading: '1 · Membagi adil' },
  { slug: 'membaca-pecahan', heading: '2 · Pembilang, penyebut, garis bilangan' },
  { slug: 'senilai', heading: '4 · Pecahan senilai' },
  { slug: 'pecahan-campuran', heading: '5 · Pecahan campuran' },
  { slug: 'jumlah-penyebut-sama', heading: '6 · Jumlah & kurang, penyebut sama' },
  { slug: 'jumlah-penyebut-beda', heading: '7 · Jumlah & kurang, penyebut beda' },
  { slug: 'pecahan-dari-jumlah', heading: '8 · Pecahan dari suatu jumlah' },
];

for (const mod of MODULES) {
  test(`${mod.slug}: student finishes Latihan and gets the stamp`, async ({ page }) => {
    await page.goto(`./#/${mod.slug}/latihan`);
    await expect(page.getByRole('heading', { name: mod.heading })).toBeVisible();
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(`Soal ${i + 1} dari 5`)).toBeVisible();
      await solveCurrentTask(page);
      await page.getByRole('button', { name: 'Cek jawaban' }).click();
      await page.getByRole('button', { name: i === 4 ? 'Lihat hasil' : 'Soal berikutnya →' }).click();
    }
    await expect(page.getByRole('img', { name: 'Stempel Hebat! Nilai 100' })).toBeVisible();
  });

  test(`${mod.slug}: Peraga steps through without horizontal scroll`, async ({ page }) => {
    await page.goto(`./#/${mod.slug}/peraga`);
    await expect(page.getByRole('heading', { name: mod.heading })).toBeVisible();
    for (let step = 0; step < 4; step++) {
      const show = page.getByRole('button', { name: 'Tunjukkan' });
      if (await show.count()) await show.click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      if (step < 3) await page.getByRole('button', { name: 'Lanjut →' }).click();
    }
  });
}

test('membaca-pecahan: teacher drags the card onto the line in Peraga', async ({ page }) => {
  await page.goto('./#/membaca-pecahan/peraga?f=3/4');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Lanjut →' }).click();
  await dragTo(page, page.locator('[data-card="f"]'), page.locator('[data-tick="t3"]'));
  await expect(page.locator('.pin [data-card="f"]')).toBeVisible();
});

test('pecahan-campuran: teacher drags a piece onto a plate', async ({ page }) => {
  await page.goto('./#/pecahan-campuran/peraga');
  await page.getByRole('button', { name: 'Lanjut →' }).click();
  await dragTo(page, page.locator('[data-tray-piece]').first(), page.getByTestId('plate-0'));
  await expect(page.getByTestId('plate-0').locator('[data-plate-piece]')).toHaveCount(1);
});

test('senilai: Tunjukkan re-cuts the lower bar', async ({ page }) => {
  await page.goto('./#/senilai/peraga?f=1/2');
  await page.getByRole('button', { name: 'Lanjut →' }).click();
  await page.getByRole('button', { name: 'Tunjukkan' }).click();
  await expect(page.locator('[data-row="ulang"] .divider')).toHaveCount(3);
});

test('jumlah-penyebut-beda: the sum row spans two wholes', async ({ page }) => {
  await page.goto('./#/jumlah-penyebut-beda/peraga?a=3/4&b=2/3');
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Lanjut →' }).click();
  await expect(page.locator('[data-row="hasil"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Lanjut →' }).click();
  await expect(page.locator('[data-row="hasil"]')).toHaveCount(1);
  await expect(page.locator('[data-row-lines="hasil"] .whole-line')).toHaveCount(1);
});

test('pecahan-dari-jumlah: Tunjukkan deals the marbles evenly', async ({ page }) => {
  await page.goto('./#/pecahan-dari-jumlah/peraga?n=12&k=3&take=2');
  await page.getByRole('button', { name: 'Lanjut →' }).click();
  await page.getByRole('button', { name: 'Tunjukkan' }).click();
  for (let i = 0; i < 3; i++) await expect(page.getByTestId(`bag-${i}`).locator('[data-marble]')).toHaveCount(4);
  await expect(page.locator('[data-tray-marble]')).toHaveCount(0);
});

test('jumlah-penyebut-beda: the stamp screen links on to module 8', async ({ page }) => {
  await page.goto('./#/jumlah-penyebut-beda/latihan');
  for (let i = 0; i < 5; i++) {
    await solveCurrentTask(page);
    await page.getByRole('button', { name: 'Cek jawaban' }).click();
    await page.getByRole('button', { name: i === 4 ? 'Lihat hasil' : 'Soal berikutnya →' }).click();
  }
  await expect(page.getByRole('link', { name: 'Lanjut ke Modul 8 →' })).toBeVisible();
});

test('home lists all eight modules as ready', async ({ page }) => {
  await page.goto('./');
  for (const name of [
    /Membagi adil/,
    /Pembilang, penyebut/,
    /Membandingkan pecahan/,
    /Pecahan senilai/,
    /Pecahan campuran/,
    /penyebut sama/,
    /penyebut beda/,
    /Pecahan dari suatu jumlah/,
  ]) {
    await expect(page.getByRole('link', { name })).toBeVisible();
  }
  await expect(page.getByText('sedang disiapkan')).toHaveCount(0);
});

test('senilai: bar fraction labels are at least 18 px on screen', async ({ page }) => {
  await page.goto('./#/senilai/peraga?f=1/2');
  await expect(page.locator('.bar .label text').first()).toBeVisible();
  const sizes = await page
    .locator('.bar .label text')
    .evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).fontSize) * (el as SVGGraphicsElement).getScreenCTM()!.a));
  expect(sizes.length).toBeGreaterThan(0);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(17.9);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('jumlah-penyebut-beda: labels of the two-whole row stay readable and apart', async ({ page }) => {
  await page.goto('./#/jumlah-penyebut-beda/peraga?a=3/4&b=2/3');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Lanjut →' }).click();
  await expect(page.locator('[data-row="hasil"]')).toHaveCount(1);
  const result = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.bar [data-row]')].map((row) => {
      const [n, d] = [...row.querySelectorAll('.label text')].map((t) => t.getBoundingClientRect());
      const line = row.querySelector('.label line')!.getBoundingClientRect();
      return { n, d, line };
    });
    const texts = [...document.querySelectorAll('.bar .label text')];
    const sizes = texts.map((t) => parseFloat(getComputedStyle(t).fontSize) * (t as SVGGraphicsElement).getScreenCTM()!.a);
    const touching = rows.some((r) => r.n.bottom > r.line.top + 4 || r.d.top < r.line.bottom - 4);
    const stacked = rows.slice(1).some((r, i) => r.n.top < rows[i].d.bottom);
    return { min: Math.min(...sizes), touching, stacked };
  });
  expect(result.min).toBeGreaterThanOrEqual(17.9);
  expect(result.stacked).toBe(false);
});

test('membaca-pecahan: whole-number labels on the line are at least 18 px', async ({ page }) => {
  await page.goto('./#/membaca-pecahan/peraga?f=3/4');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Lanjut →' }).click();
  const units = page.locator('.unit');
  await expect(units.first()).toBeVisible();
  const sizes = await units.evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).fontSize)));
  expect(sizes.length).toBeGreaterThan(1);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(18);
  const boxes = await units.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => [r.left, r.right]));
  for (let i = 1; i < boxes.length; i++) expect(boxes[i][0]).toBeGreaterThanOrEqual(boxes[i - 1][1]);
});

test('pecahan-campuran: the three whole-number labels do not collide', async ({ page }) => {
  await page.goto('./#/pecahan-campuran/peraga');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Lanjut →' }).click();
  const units = page.locator('.unit');
  await expect(units).toHaveCount(3);
  const boxes = await units.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => [r.left, r.right]));
  for (let i = 1; i < boxes.length; i++) expect(boxes[i][0]).toBeGreaterThanOrEqual(boxes[i - 1][1]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('the last Peraga step links straight to Latihan', async ({ page }) => {
  await page.goto('./#/membandingkan/peraga');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Lanjut →' }).click();
  await expect(page.getByRole('button', { name: 'Lanjut →' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Latihan →' }).click();
  await expect(page).toHaveURL(/#\/membandingkan\/latihan$/);
  await expect(page.getByText('Soal 1 dari 5')).toBeVisible();
});
