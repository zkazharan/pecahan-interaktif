import { expect, test } from '@playwright/test';
import { dragTo, solveCurrentTask } from './helpers';

const MODULES = [
  { slug: 'membagi-adil', heading: '1 · Membagi adil' },
  { slug: 'membaca-pecahan', heading: '2 · Pembilang, penyebut, garis bilangan' },
  { slug: 'pecahan-campuran', heading: '5 · Pecahan campuran' },
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

test('home lists modules 1, 2, 3 and 5 as ready', async ({ page }) => {
  await page.goto('./');
  for (const name of [/Membagi adil/, /Pembilang, penyebut/, /Membandingkan pecahan/, /Pecahan campuran/]) {
    await expect(page.getByRole('link', { name })).toBeVisible();
  }
  await expect(page.getByText('sedang disiapkan')).toHaveCount(4);
});
