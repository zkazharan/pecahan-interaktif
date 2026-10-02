import { expect, test } from '@playwright/test';

test('bar dividers do not fade in on the first mount', async ({ page }) => {
  await page.goto('./#/membandingkan/peraga?a=2/5&b=3/7');
  const dividers = page.locator('.bar .divider');
  await expect(dividers.first()).toBeAttached();
  const state = await dividers.evaluateAll((els) =>
    els.map((el) => ({ faded: el.classList.contains('fade'), animation: getComputedStyle(el).animationName })),
  );
  expect(state.length).toBeGreaterThan(0);
  expect(state.every((divider) => !divider.faded && divider.animation === 'none')).toBe(true);
});

test('bar dims the dividers of pieces that are not being dragged', async ({ page }) => {
  await page.goto('./#/membandingkan/peraga?a=2/5&b=3/7');
  await page.getByRole('button', { name: 'Lanjut →' }).click();
  const grabbed = page.locator('[data-piece="a"]');
  const other = page.locator('[data-piece="b"]');
  const box = await grabbed.boundingBox();
  if (!box) throw new Error('piece not visible');
  const opacityOf = (piece: typeof grabbed) => piece.locator('.divider').first().evaluate((el) => getComputedStyle(el).opacity);
  expect(await opacityOf(other)).toBe('1');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 40, { steps: 5 });
  await expect(grabbed).toHaveAttribute('data-dragging', '');
  expect(await opacityOf(other)).toBe('0.5');
  expect(await opacityOf(grabbed)).toBe('1');
  await page.mouse.up();
});
