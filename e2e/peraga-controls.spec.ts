import { expect, test } from '@playwright/test';
import { openNumbers } from './helpers';

test('numbers are folded away on phones and always visible on wider screens', async ({ page }) => {
  await page.goto('./#/membandingkan/peraga?a=2/5&b=3/7');
  const wide = (page.viewportSize()?.width ?? 0) >= 600;
  const input = page.getByLabel('Pembilang Pecahan A', { exact: true });
  const summary = page.getByText('Ubah angka', { exact: true });
  await expect(page.getByRole('button', { name: 'Lanjut →' })).toBeVisible();
  if (wide) {
    await expect(summary).toBeHidden();
    await expect(input).toBeVisible();
    return;
  }
  await expect(summary).toBeVisible();
  await expect(input).toBeHidden();
  await openNumbers(page);
  await expect(input).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('jumlah-penyebut-beda: steps that would pass 24 parts are disabled', async ({ page }) => {
  await page.goto('./#/jumlah-penyebut-beda/peraga?a=1/5&b=1/5');
  await openNumbers(page);
  await expect(page.getByRole('button', { name: 'Tambah penyebut Pecahan kedua' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Kurangi penyebut Pecahan kedua' })).toBeEnabled();
  await page.getByLabel('Penyebut Pecahan kedua', { exact: true }).fill('6');
  await page.getByLabel('Penyebut Pecahan kedua', { exact: true }).blur();
  await expect(page.getByText('Potongannya terlalu banyak. Pilih pecahan lain.')).toBeVisible();
  await expect(page.getByLabel('Penyebut Pecahan kedua', { exact: true })).toHaveValue('5');
});

test('membandingkan: the pieces are locked once the caption states the result', async ({ page }) => {
  await page.goto('./#/membandingkan/peraga');
  const pieces = page.locator('[data-piece]');
  for (let step = 0; step < 4; step++) {
    const expected = step === 1 || step === 2 ? 'false' : 'true';
    for (const piece of await pieces.all()) await expect(piece).toHaveAttribute('aria-disabled', expected);
    if (step < 3) await page.getByRole('button', { name: 'Lanjut →' }).click();
  }
});
