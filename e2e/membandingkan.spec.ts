import { expect, test } from '@playwright/test';
import { dragTo, readCards, solveCurrentTask, valueOf } from './helpers';

test('teacher stacks 1/3 on 1/4 in Peraga', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: /Membandingkan pecahan/ }).click();
  await expect(page.getByRole('heading', { name: '3 · Membandingkan pecahan' })).toBeVisible();
  await page.getByRole('button', { name: 'Lanjut →' }).click();
  await dragTo(page, page.getByRole('button', { name: 'Potongan sepertiga' }), page.getByTestId('bar-target-b'));
  await expect(page.getByText('lebih panjang!')).toBeVisible();
});

test('Peraga reads numbers from the link and writes changes back', async ({ page }) => {
  await page.goto('./#/membandingkan/peraga?a=2/5&b=3/7');
  await expect(page.getByLabel('Pembilang Pecahan A', { exact: true })).toHaveValue('2');
  await expect(page.getByLabel('Penyebut Pecahan B', { exact: true })).toHaveValue('7');
  await page.getByRole('button', { name: 'Tambah penyebut Pecahan A' }).click();
  await expect(page).toHaveURL(/a=2\/6/);
});

test('broken link numbers fall back to 1/3 and 1/4', async ({ page }) => {
  await page.goto('./#/membandingkan/peraga?a=abc&b=9/0');
  await expect(page.getByLabel('Penyebut Pecahan A', { exact: true })).toHaveValue('3');
  await expect(page.getByLabel('Penyebut Pecahan B', { exact: true })).toHaveValue('4');
});

test('unknown module goes back to the module list', async ({ page }) => {
  await page.goto('./#/tidak-ada/peraga');
  await expect(page.getByRole('heading', { level: 1, name: 'Pecahan' })).toBeVisible();
  await expect(page).toHaveURL(/#\/$/);
});

test('student finishes Latihan and gets the stamp', async ({ page }) => {
  await page.goto('./#/membandingkan/latihan');
  for (let i = 0; i < 5; i++) {
    await expect(page.getByText(`Soal ${i + 1} dari 5`)).toBeVisible();
    await solveCurrentTask(page);
    await page.getByRole('button', { name: 'Cek jawaban' }).click();
    await page.getByRole('button', { name: i === 4 ? 'Lihat hasil' : 'Soal berikutnya →' }).click();
  }
  await expect(page.getByRole('img', { name: 'Stempel Hebat! Nilai 100' })).toBeVisible();
  await page.getByRole('link', { name: '← Daftar modul' }).click();
  await expect(page.getByRole('img', { name: 'Stempel: Hebat!' })).toBeVisible();
});

test('two wrong answers unlock Tunjukkan caranya', async ({ page }) => {
  await page.goto('./#/membandingkan/latihan');
  const cards = await readCards(page);
  const smaller = [...cards].sort((x, y) => valueOf(x.value) - valueOf(y.value))[0];
  await dragTo(page, page.locator(`[data-card="${smaller.id}"]`), page.getByTestId('slot-besar'));
  await page.getByRole('button', { name: 'Cek jawaban' }).click();
  await expect(page.getByText('Coba tumpuk pitanya. Mana yang lebih panjang?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tunjukkan caranya' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cek jawaban' }).click();
  await page.getByRole('button', { name: 'Tunjukkan caranya' }).click();
  await expect(page.getByRole('button', { name: 'Soal berikutnya →' })).toBeVisible();
  await expect(page.getByLabel('Soal 1: dibantu')).toBeVisible();
});

test('no horizontal scroll on the module page', async ({ page }) => {
  for (const tab of ['peraga', 'latihan']) {
    await page.goto(`./#/membandingkan/${tab}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  }
});
