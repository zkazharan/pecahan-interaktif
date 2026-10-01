import type { Locator, Page } from '@playwright/test';

export async function dragTo(page: Page, source: Locator, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  await source.scrollIntoViewIfNeeded();
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

export async function solveCurrentTask(page: Page): Promise<void> {
  const cards = [...(await readCards(page))].sort((x, y) => valueOf(x.value) - valueOf(y.value));
  if (cards.length === 2) {
    await dragTo(page, page.locator(`[data-card="${cards[1].id}"]`), page.getByTestId('slot-besar'));
    return;
  }
  for (const [i, card] of cards.entries()) {
    await dragTo(page, page.locator(`[data-card="${card.id}"]`), page.getByTestId(`slot-s${i + 1}`));
  }
}
