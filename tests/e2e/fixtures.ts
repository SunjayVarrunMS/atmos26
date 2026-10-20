import { test as base, expect } from '@playwright/test';
import type { ConsoleMessage, Page, Request, Response } from '@playwright/test';

// No global exemptions: in particular, missing first-party assets must fail.
const ALLOWED: readonly { url: RegExp; message: RegExp }[] = [];

interface ExpectedNetworkFailure {
  url: RegExp;
  status?: number;
  errorText?: string;
  mainDocumentOnly?: boolean;
}

interface Failure {
  kind: 'console' | 'pageerror' | 'response' | 'requestfailed';
  url: string;
  message: string;
  status?: number;
  mainDocument?: boolean;
}

interface Options {
  // An object avoids Playwright interpreting two rules as a fixture tuple.
  expectedNetworkFailures: { rules: readonly ExpectedNetworkFailure[] };
}

export const test = base.extend<Options>({
  expectedNetworkFailures: [{ rules: [] }, { option: true }],
  // Playwright's inherited reducedMotion option stays at its default unless test.use asks for reduce.
  page: async ({ page, expectedNetworkFailures }, runTest) => {
    const failures: Failure[] = [];
    const isMainDocument = (request: Request) =>
      request.isNavigationRequest() && request.frame() === page.mainFrame();
    const onConsole = (message: ConsoleMessage) => {
      if (message.type() === 'error') {
        failures.push({ kind: 'console', url: message.location().url, message: message.text() });
      }
    };
    const onPageError = (error: Error) => {
      failures.push({ kind: 'pageerror', url: page.url(), message: error.stack ?? error.message });
    };
    const onResponse = (response: Response) => {
      if (response.status() >= 400) {
        failures.push({
          kind: 'response', url: response.url(), status: response.status(),
          message: `HTTP ${response.status()} ${response.statusText()}`,
          mainDocument: isMainDocument(response.request()),
        });
      }
    };
    const onRequestFailed = (request: Request) => {
      const message = request.failure()?.errorText ?? 'Unknown request failure';
      if (message === 'net::ERR_ABORTED') return;
      failures.push({
        kind: 'requestfailed', url: request.url(), message,
        mainDocument: isMainDocument(request),
      });
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    page.on('response', onResponse);
    page.on('requestfailed', onRequestFailed);

    const expectedNetworkFailure = (failure: Failure) => expectedNetworkFailures.rules.some((entry) => {
      if (!entry.url.test(failure.url)) return false;
      if (entry.mainDocumentOnly && !failure.mainDocument) return false;
      return (failure.kind === 'response' && entry.status === failure.status)
        || (failure.kind === 'requestfailed' && entry.errorText === failure.message);
    });

    try {
      await runTest(page);
    } finally {
      page.off('console', onConsole);
      page.off('pageerror', onPageError);
      page.off('response', onResponse);
      page.off('requestfailed', onRequestFailed);
      const unexpected = failures.filter((failure) => {
        if (ALLOWED.some((entry) => entry.url.test(failure.url) && entry.message.test(failure.message))) return false;
        if (expectedNetworkFailure(failure)) return false;
        // Chromium also logs resource errors for deliberately failed requests. Only pair an
        // exact resource URL and browser-generated message with an exempted network failure.
        if (failure.kind === 'console') {
          return !failures.some((network) => network.url === failure.url && expectedNetworkFailure(network) && (
            (network.kind === 'response' && failure.message.startsWith(
              `Failed to load resource: the server responded with a status of ${network.status} `,
            ))
            || (network.kind === 'requestfailed' && failure.message === `Failed to load resource: ${network.message}`)
          ));
        }
        return true;
      });
      expect(unexpected, `Unexpected browser/network failures:\n${unexpected.map((failure) =>
        `[${failure.kind}] ${failure.url} ${failure.message}`).join('\n')}`).toEqual([]);
    }
  },
});

export { expect };

export async function scrollToBottom(page: Page) {
  await expect(page.locator('[data-preloader]')).toHaveCount(0, { timeout: 20_000 });
  let top = 0;
  for (;;) {
    const { height, viewport } = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      viewport: window.innerHeight,
    }));
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);
    // Give intersection observers and native lazy loading a turn at each viewport.
    await page.waitForTimeout(100);
    if (top >= height - viewport) break;
    top = Math.min(top + Math.floor(viewport * 0.75), height - viewport);
  }
  await page.waitForLoadState('networkidle');
}
