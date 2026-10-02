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

test('an unknown module link does not trap the Back button', async ({ page }) => {
  await page.goto('./');
  const before = await page.evaluate(() => history.length);
  await page.evaluate(() => {
    location.hash = '#/tidak-ada/peraga';
  });
  await expect(page).toHaveURL(/#\/$/);
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
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

test('re-checking the same wrong answer does not count as another mistake', async ({ page }) => {
  await page.goto('./#/membandingkan/latihan');
  const cards = await readCards(page);
  const smaller = [...cards].sort((x, y) => valueOf(x.value) - valueOf(y.value))[0];
  const card = page.locator(`[data-card="${smaller.id}"]`);
  const check = page.getByRole('button', { name: 'Cek jawaban' });
  await dragTo(page, card, page.getByTestId('slot-besar'));
  await check.click();
  await expect(page.getByText('Lihat pitanya. Mana yang lebih panjang?')).toBeVisible();
  await expect(check).toBeDisabled();
  await dragTo(page, card, page.getByTestId('pile'));
  await expect(check).toBeDisabled();
  await dragTo(page, card, page.getByTestId('slot-besar'));
  await expect(check).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Tunjukkan caranya' })).toHaveCount(0);
});

test('two different wrong answers unlock Tunjukkan caranya and keep the pita open', async ({ page }) => {
  await page.goto('./#/membandingkan/latihan');
  await solveCurrentTask(page);
  await page.getByRole('button', { name: 'Cek jawaban' }).click();
  await page.getByRole('button', { name: 'Soal berikutnya →' }).click();
  await expect(page.getByText('Soal 2 dari 5')).toBeVisible();
  const sorted = [...(await readCards(page))].sort((x, y) => valueOf(x.value) - valueOf(y.value));
  const [small, middle, large] = sorted.map((c) => page.locator(`[data-card="${c.id}"]`));
  await dragTo(page, large, page.getByTestId('slot-s1'));
  await dragTo(page, middle, page.getByTestId('slot-s2'));
  await dragTo(page, small, page.getByTestId('slot-s3'));
  await page.getByRole('button', { name: 'Cek jawaban' }).click();
  await expect(page.getByRole('button', { name: 'Tunjukkan caranya' })).toHaveCount(0);
  await dragTo(page, large, page.getByTestId('slot-s2'));
  await page.getByRole('button', { name: 'Cek jawaban' }).click();
  await page.getByRole('button', { name: 'Tunjukkan caranya' }).click();
  await expect(page.getByRole('group', { name: 'Pita pecahan' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Soal berikutnya →' })).toBeFocused();
  await expect(page.getByLabel('Soal 2: dibantu')).toBeVisible();
});

test('Peraga numbers survive a trip to Latihan', async ({ page }) => {
  await page.goto('./#/membandingkan/peraga?a=2/5&b=3/7');
  await page.getByRole('link', { name: 'Latihan', exact: true }).click();
  await expect(page.getByText('Soal 1 dari 5')).toBeVisible();
  await page.getByRole('link', { name: 'Peraga', exact: true }).click();
  await expect(page.getByLabel('Pembilang Pecahan A', { exact: true })).toHaveValue('2');
  await expect(page.getByLabel('Penyebut Pecahan B', { exact: true })).toHaveValue('7');
});

test('no horizontal scroll on the module page', async ({ page }) => {
  for (const tab of ['peraga', 'latihan']) {
    await page.goto(`./#/membandingkan/${tab}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  }
});

test('slot labels stay clear of the cards placed in them', async ({ page }) => {
  await page.goto('./#/membandingkan/latihan');
  for (let i = 0; i < 4; i++) {
    await expect(page.getByText(`Soal ${i + 1} dari 5`)).toBeVisible();
    await solveCurrentTask(page);
    const overlaps = await page.evaluate(() => {
      const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      return [...document.querySelectorAll('[data-testid^="slot-"]')].filter((slot) => {
        const label = slot.querySelector('.slot-label')!.getBoundingClientRect();
        return [...slot.querySelectorAll('[data-card]')].some((card) => hit(label, card.getBoundingClientRect()));
      }).length;
    });
    expect(overlaps).toBe(0);
    await page.getByRole('button', { name: 'Cek jawaban' }).click();
    await page.getByRole('button', { name: 'Soal berikutnya →' }).click();
  }
});
