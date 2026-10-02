import { expect, test } from '@playwright/test';
import { dragTo } from './helpers';

test('module 1: a wrong sort shows the equal-cut guides until the answer changes', async ({ page }) => {
  await page.goto('./#/membagi-adil/latihan');
  const task = page.locator('[data-task-kind="sort"]');
  const fair = (await task.getAttribute('data-fair')) === 'true';
  await dragTo(page, page.locator('[data-card]').first(), page.getByTestId(fair ? 'slot-tidak' : 'slot-adil'));
  await page.getByRole('button', { name: 'Cek jawaban' }).click();
  await expect(task).toHaveAttribute('data-diff', 'true');
  await expect(page.getByTestId('diff')).toBeVisible();
  await expect(page.getByTestId('diff').locator('[data-guide]').first()).toBeAttached();
  await dragTo(page, page.locator('[data-card]').first(), page.getByTestId(fair ? 'slot-adil' : 'slot-tidak'));
  await expect(task).not.toHaveAttribute('data-diff', 'true');
});

test('module 6: a wrong sum shows comparison bars without the answer label', async ({ page }) => {
  await page.goto('./#/jumlah-penyebut-sama/latihan');
  const task = page.locator('[data-task-kind="add"]');
  const correct = await task.getAttribute('data-correct');
  const wrong = page.locator(`[data-card]:not([data-card="${correct}"])`).first();
  await dragTo(page, wrong, page.getByTestId('slot-pilihan'));
  await page.getByRole('button', { name: 'Cek jawaban' }).click();
  const bars = page.getByTestId('diff-bars');
  await expect(bars).toBeVisible();
  await expect(bars.locator('[data-row="goal"] .label')).toHaveCount(0);
});

test('module 6: the comparison bars are not hidden behind the action bar after a wrong check', async ({ page }) => {
  await page.goto('./#/jumlah-penyebut-sama/latihan');
  const task = page.locator('[data-task-kind="add"]');
  const correct = await task.getAttribute('data-correct');
  const wrong = page.locator(`[data-card]:not([data-card="${correct}"])`).first();
  await dragTo(page, wrong, page.getByTestId('slot-pilihan'));
  await page.getByRole('button', { name: 'Cek jawaban' }).click();
  const bars = page.getByTestId('diff-bars');
  await expect(bars).toBeVisible();
  await expect
    .poll(() =>
      bars.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const bar = document.querySelector('.actions')!.getBoundingClientRect();
        const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return box.bottom <= bar.top && box.top >= 0 && !!hit && el.contains(hit);
      }),
    )
    .toBe(true);
});

test('module 8: an uneven split shows the count in each bag', async ({ page }) => {
  await page.goto('./#/pecahan-dari-jumlah/latihan');
  const task = page.locator('[data-task-kind="split"]');
  const total = Number(await task.getAttribute('data-total'));
  for (let i = 0; i < total; i++) await dragTo(page, page.locator('[data-tray-marble]').first(), page.getByTestId('bag-0'));
  await page.getByRole('button', { name: 'Cek jawaban' }).click();
  await expect(page.locator('[data-bag-count]').first()).toHaveText(String(total));
});
