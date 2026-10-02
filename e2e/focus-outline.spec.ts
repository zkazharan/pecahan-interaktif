import { expect, test, type Page } from '@playwright/test';

async function activeOutline(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement;
    return el && el !== document.body ? getComputedStyle(el).outlineStyle : 'no-focus';
  });
}

test('tapping a martabak slice shows no browser focus box', async ({ page }) => {
  await page.goto('./#/membaca-pecahan/latihan');
  await page.locator('[data-slice]').first().click();
  expect(await activeOutline(page)).toBe('none');
});

test('grabbing a bar piece shows no browser focus box', async ({ page }) => {
  await page.goto('./#/membandingkan/peraga');
  await page.getByRole('button', { name: 'Lanjut →' }).click();
  await page.locator('[data-piece]').first().click();
  expect(await activeOutline(page)).toBe('none');
});

test('grabbing a tray piece shows no browser focus box', async ({ page }) => {
  await page.goto('./#/pecahan-campuran/latihan');
  await page.locator('[data-tray-piece]').first().click();
  expect(await activeOutline(page)).toBe('none');
});

test('keyboard focus on a slice still shows the focus ring', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'laptop', 'keyboard check runs once');
  await page.goto('./#/membaca-pecahan/latihan');
  const slice = page.locator('[data-slice]').first();
  for (let i = 0; i < 40 && !(await slice.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(page.locator('[data-focus-ring]')).toBeVisible();
});
