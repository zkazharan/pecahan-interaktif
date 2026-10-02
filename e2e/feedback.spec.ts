import { expect, test } from '@playwright/test';
import { dragTo, solveCurrentTask } from './helpers';

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

test('module 4: a wrong pair keeps the diff top on screen and clear of the action bar', async ({ page }) => {
  await page.goto('./#/senilai/latihan');
  await solveCurrentTask(page);
  await page.getByRole('button', { name: 'Cek jawaban' }).click();
  await page.getByRole('button', { name: 'Soal berikutnya →' }).click();
  const task = page.locator('[data-task-kind="pair"]');
  await expect(task).toBeVisible();
  const solution = JSON.parse((await task.getAttribute('data-solution')) ?? '{}') as Record<string, string>;
  const slots = Object.keys(solution);
  for (const [i, slot] of slots.entries()) {
    await dragTo(page, page.locator(`[data-card="${solution[slots[(i + 1) % slots.length]]}"]`), page.getByTestId(`slot-${slot}`));
  }
  await page.getByRole('button', { name: 'Cek jawaban' }).click();
  const diff = page.getByTestId('diff').first();
  await expect(diff).toBeVisible();
  await expect(page.getByTestId('diff-bars')).toHaveCount(3);
  await page.waitForTimeout(600);
  const state = await page.evaluate(() => {
    const first = document.querySelector('[data-testid="diff"]')!.getBoundingClientRect();
    const firstBars = document.querySelector('[data-testid="diff-bars"]') as HTMLElement;
    const box = firstBars.getBoundingClientRect();
    const bar = document.querySelector('.actions')!.getBoundingClientRect();
    const y = Math.min(Math.max(box.top, 0) + 12, bar.top - 4);
    const hit = document.elementFromPoint(box.x + box.width / 2, y);
    const slotsBottom = document.querySelector('[data-testid^="slot-"]')!.getBoundingClientRect().bottom;
    return {
      diffTop: first.top,
      slotsBottom,
      barTop: bar.top,
      covered: !hit || !firstBars.contains(hit),
    };
  });
  expect(state.diffTop).toBeGreaterThanOrEqual(0);
  expect(state.diffTop < state.barTop || state.slotsBottom > 0).toBe(true);
  expect(state.covered).toBe(false);
});
