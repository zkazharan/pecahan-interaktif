import type { Locator, Page } from '@playwright/test';

async function isCovered(source: Locator): Promise<boolean> {
  return source.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return !hit || !(el === hit || el.contains(hit));
  });
}

export async function dragTo(page: Page, source: Locator, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  await source.scrollIntoViewIfNeeded();
  for (let attempt = 0; attempt < 8 && (await isCovered(source)); attempt++) {
    await page.evaluate(() => window.scrollBy(0, 40));
  }
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('element not visible for drag');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 });
  await page.mouse.up();
}

export function valueOf(text: string): number {
  const [n, d] = text.split('/').map(Number);
  return n / d;
}

export async function readCards(page: Page): Promise<{ id: string; value: string }[]> {
  return page
    .locator('[data-card]')
    .evaluateAll((els) => els.map((el) => ({ id: el.getAttribute('data-card')!, value: el.getAttribute('data-value')! })));
}

async function solveLine(page: Page, perUnit: number): Promise<void> {
  for (const card of await readCards(page)) {
    const [n, d] = card.value.split('/').map(Number);
    await dragTo(page, page.locator(`[data-card="${card.id}"]`), page.locator(`[data-tick="t${(n * perUnit) / d}"]`));
  }
}

export async function solveCurrentTask(page: Page): Promise<void> {
  const root = page.locator('[data-task-kind]').first();
  const kind = await root.getAttribute('data-task-kind');
  const attr = async (name: string) => (await root.getAttribute(name)) ?? '';

  if (kind === 'compare' || kind === 'order') {
    const cards = [...(await readCards(page))].sort((x, y) => valueOf(x.value) - valueOf(y.value));
    if (kind === 'compare') {
      await dragTo(page, page.locator(`[data-card="${cards[1].id}"]`), page.getByTestId('slot-besar'));
      return;
    }
    for (const [i, card] of cards.entries()) {
      await dragTo(page, page.locator(`[data-card="${card.id}"]`), page.getByTestId(`slot-s${i + 1}`));
    }
    return;
  }
  if (kind === 'line') {
    await solveLine(page, Number(await attr('data-per-unit')));
    return;
  }
  if (kind === 'sort') {
    const slot = (await attr('data-fair')) === 'true' ? 'slot-adil' : 'slot-tidak';
    await dragTo(page, page.locator('[data-card]').first(), page.getByTestId(slot));
    return;
  }
  if (kind === 'cut') {
    const target = Number(await attr('data-target'));
    for (let i = 1; i < target; i++) await page.getByRole('button', { name: 'Tambah jumlah potong' }).click();
    return;
  }
  if (kind === 'pick' || kind === 'read' || kind === 'mixed') {
    await dragTo(page, page.locator(`[data-card="${await attr('data-correct')}"]`), page.getByTestId('slot-pilihan'));
    return;
  }
  if (kind === 'shade') {
    const [n] = (await attr('data-target')).split('/').map(Number);
    for (let i = 0; i < n; i++) await page.locator('[data-slice]').nth(i).dispatchEvent('click');
    return;
  }
  if (kind === 'group') {
    const n = Number(await attr('data-n'));
    const d = Number(await attr('data-d'));
    for (let i = 0; i < n; i++) {
      await dragTo(page, page.locator('[data-tray-piece]').first(), page.getByTestId(`plate-${Math.floor(i / d)}`));
    }
    return;
  }
  if (kind === 'recut') {
    const k = Number(await attr('data-k'));
    for (let i = 1; i < k; i++) await page.getByRole('button', { name: 'Tambah potong ulang', exact: true }).click();
    return;
  }
  if (kind === 'pair') {
    const solution = JSON.parse(await attr('data-solution')) as Record<string, string>;
    for (const [slot, card] of Object.entries(solution)) {
      await dragTo(page, page.locator(`[data-card="${card}"]`), page.getByTestId(`slot-${slot}`));
    }
    return;
  }
  if (kind === 'simplify' || kind === 'add' || kind === 'sub') {
    await dragTo(page, page.locator(`[data-card="${await attr('data-correct')}"]`), page.getByTestId('slot-pilihan'));
    return;
  }
  if (kind === 'add-recut' || kind === 'sub-recut') {
    const [ka, kb] = (await attr('data-cuts')).split(',').map(Number);
    for (let i = 1; i < ka; i++) await page.getByRole('button', { name: 'Tambah potong ulang pita pertama' }).click();
    for (let i = 1; i < kb; i++) await page.getByRole('button', { name: 'Tambah potong ulang pita kedua' }).click();
    await dragTo(page, page.locator(`[data-card="${await attr('data-correct')}"]`), page.getByTestId('slot-pilihan'));
    return;
  }
  throw new Error(`unknown task kind: ${kind}`);
}
