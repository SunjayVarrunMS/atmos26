import { test, expect } from './fixtures.ts';

test('Sound toggles off, on, then off', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-hero-stage]')).toBeVisible();
  await expect(page.locator('[data-preloader]')).toHaveCount(0, { timeout: 20_000 });
  const toggle = page.getByRole('button', { name: 'Sound', exact: true });
  if (!await toggle.isVisible()) {
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  }
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.waitForLoadState('networkidle');
});
