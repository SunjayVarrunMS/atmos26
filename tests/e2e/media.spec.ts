import { test, expect, scrollToBottom } from './fixtures.ts';

for (const path of ['/', '/events', '/gallery', '/sponsors', '/proshows']) {
  test(`${path} loads all visible images after scrolling`, async ({ page }) => {
    await page.goto(path);
    if (path === '/') await expect(page.locator('[data-hero-stage]')).toBeVisible();
    else await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await scrollToBottom(page);
    await expect.poll(() => page.locator('img:visible').evaluateAll((images) => images
      .filter((image): image is HTMLImageElement => image instanceof HTMLImageElement)
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src)), {
      message: `Broken or incomplete image srcs on ${path}`,
    }).toEqual([]);
  });
}

test.describe('Instagram unavailable', () => {
  test.use({ expectedNetworkFailures: { rules: [
    // These two third-party hosts are deliberately aborted in this test only.
    { url: /^https?:\/\/([^/]+\.)?(instagram|cdninstagram)\.com\//, errorText: 'net::ERR_FAILED' },
  ] } });

  test('contact and home footer keep usable external Instagram links', async ({ page }) => {
    for (const path of ['/contact', '/']) {
      await page.goto(path);
      const section = path === '/' ? page.getByRole('contentinfo') : page.getByRole('region', { name: 'Ways to reach us' });
      const link = section.getByRole('link', { name: /Instagram|@atmos_bitshyd/ });
      await expect(link).toHaveAttribute('href', /^https:\/\/(www\.)?instagram\.com\//);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /\bnoreferrer\b/);
      await page.waitForLoadState('networkidle');
    }
    await page.route('**/*instagram.com/**', (route) => route.abort());
    await page.route('**/*cdninstagram.com/**', (route) => route.abort());
    await page.goto('/contact');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Contact' })).toBeVisible();
    await page.waitForLoadState('networkidle');
  });
});

test.describe('map unavailable', () => {
  test.use({ expectedNetworkFailures: { rules: [
    // The Maps document is deliberately aborted to exercise the iframe fallback.
    { url: /^https?:\/\/([^/]+\.)?google\.com\//, errorText: 'net::ERR_FAILED' },
    // Maps can request resources on other hosts under /maps/; those are blocked too.
    { url: /\/maps\//, errorText: 'net::ERR_FAILED' },
  ] } });

  test('contact labels its iframe and renders when Maps is blocked', async ({ page }) => {
    await page.goto('/contact');
    const map = page.getByRole('region', { name: 'Map', exact: true }).locator('iframe');
    await expect(map).toHaveAttribute('title', /\S/);
    await page.route('**/maps/**', (route) => route.abort());
    await page.route(/^https?:\/\/([^/]+\.)?google\.com\//, (route) => route.abort());
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Contact' })).toBeVisible();
    await expect(map).toHaveAttribute('title', /\S/);
    await map.scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');
  });
});

test.describe('event edits unavailable', () => {
  test.use({ expectedNetworkFailures: { rules: [
    // This test deliberately serves REST reads with 503 to check the static fallback.
    { url: /\/rest\/v1\//, status: 503 },
  ] } });

  test('events retain the static card grid when Supabase returns 503', async ({ page }) => {
    await page.route('**/rest/v1/**', (route) => route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"message":"Deliberate e2e service outage"}',
    }));
    await page.goto('/events');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect.poll(() => page.locator('a[href^="/events/"]').count()).toBeGreaterThanOrEqual(20);
  });
});
