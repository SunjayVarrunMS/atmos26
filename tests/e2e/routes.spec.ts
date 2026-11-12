import { test, expect } from './fixtures.ts';

for (const path of ['/', '/events', '/proshows', '/gallery', '/sponsors', '/contact', '/manage']) {
  test(`${path} renders without horizontal overflow`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(/\S/);
    if (path === '/') {
      await expect(page.locator('[data-hero-stage]')).toBeVisible();
      await expect(page.locator('[data-preloader]')).toHaveCount(0, { timeout: 20_000 });
    } else {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
    if (path === '/manage') {
      await expect(page.getByRole('button', { name: 'Sign in with Google' }).or(
        page.getByText(/Editing isn.t switched on yet/),
      )).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toHaveCount(0);
    }
    await page.waitForLoadState('networkidle');
    await expect.poll(() => page.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth + 1,
    ), { message: `${path} must fit the viewport` }).toBe(true);
  });
}

test.describe('unknown route', () => {
  test.use({ expectedNetworkFailures: { rules: [
    // Vercel may serve the SPA's unknown-path document with HTTP 404.
    { url: /\/this-route-does-not-exist$/, status: 404, mainDocumentOnly: true },
  ] } });

  test('renders NotFound or returns a document 404', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist');
    expect(response).not.toBeNull();
    if (response?.status() !== 404) {
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: 'Signal lost' })).toBeVisible();
    }
    await page.waitForLoadState('networkidle');
  });
});

test('events list has at least 20 cards and loads every card image', async ({ page }) => {
  await page.goto('/events');
  const cards = page.locator('a[href^="/events/"]');
  await expect.poll(() => cards.count()).toBeGreaterThanOrEqual(20);
  for (const card of await cards.all()) {
    await card.scrollIntoViewIfNeeded();
    for (const image of await card.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => ({
        loaded: element.complete && element.naturalWidth > 0,
        src: element.currentSrc || element.src,
      })), { message: `Card image must load: ${await image.getAttribute('src')}` }).toMatchObject({ loaded: true });
    }
  }
  await page.waitForLoadState('networkidle');
});

test('clicking an event opens its named detail page', async ({ page }) => {
  await page.goto('/events');
  const card = page.locator('a[href^="/events/"]').first();
  const heading = card.getByRole('heading', { level: 2 });
  await expect(heading).toBeVisible();
  const name = (await heading.textContent())?.trim() ?? '';
  expect(name).not.toBe('');
  const href = await card.getAttribute('href');
  expect(href).toMatch(/^\/events\/[^/]+$/);
  await card.click();
  await expect(page).toHaveURL((url) => url.pathname === href);
  await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
  await page.waitForLoadState('networkidle');
});

test('the first five events support direct document loads', async ({ page }) => {
  await page.goto('/events');
  const cards = page.locator('a[href^="/events/"]');
  await expect.poll(() => cards.count()).toBeGreaterThanOrEqual(20);
  const events = await cards.evaluateAll((links) => links.slice(0, 5).map((link) => ({
    href: link.getAttribute('href') ?? '',
    name: link.querySelector('h2')?.textContent?.trim() ?? '',
  })));
  expect(events).toHaveLength(5);
  for (const event of events) {
    await test.step(`Direct load ${event.href}`, async () => {
      expect(event.href).toMatch(/^\/events\/[^/]+$/);
      expect(event.name).not.toBe('');
      const response = await page.goto(event.href);
      expect(response?.status(), `Main document for ${event.href}`).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: event.name, exact: true })).toBeVisible();
      await page.waitForLoadState('networkidle');
    });
  }
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('home shows the static hero with no covering preloader after three seconds', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('region', { name: /^ATMOS/ })).toBeVisible();
    await expect(page.locator('[data-hero-stage]')).toBeVisible();
    await page.waitForTimeout(3000);
    await expect(page.locator('[data-preloader]')).toHaveCount(0);
    await expect(page.locator('[data-hero-stage] img').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
  });
});
