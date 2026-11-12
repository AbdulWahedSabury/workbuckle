// The Content-Security-Policy is enforced: any source the site needs but the
// policy doesn't list breaks that page for real visitors. This walks the public
// site (both languages) and the admin panel and fails on any violation.
import { expect, test, type Page } from '@playwright/test';
import { E2E } from './constants';

const PUBLIC_PAGES = ['/en', '/en/jobs', '/en/about', '/en/contact', '/en/privacy', '/en/terms', '/el', '/el/jobs'];

/** Records every CSP violation the page reports, from the browser event and the console. */
function watchViolations(page: Page): string[] {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  page.on('pageerror', (error) => {
    if (/Content Security Policy/i.test(error.message)) violations.push(error.message);
  });
  return violations;
}

test.describe('content security policy', () => {
  test.skip(({ isMobile }) => isMobile, 'Same headers on every device; checked once, on desktop.');

  test('is enforced, not report-only', async ({ request }) => {
    const response = await request.get('/en');
    expect(response.headers()['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers()['content-security-policy-report-only']).toBeUndefined();
  });

  test('public pages load without violations', async ({ page }) => {
    const violations = watchViolations(page);
    for (const path of PUBLIC_PAGES) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBeLessThan(400);
      await page.waitForLoadState('networkidle');
    }
    expect(violations).toEqual([]);
  });

  test('admin sign-in and panel load without violations', async ({ page }) => {
    const violations = watchViolations(page);
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(E2E.admin.email);
    await page.getByLabel('Password').fill(E2E.admin.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/admin(\?|$)/);
    for (const path of ['/admin', '/admin/candidates', '/admin/jobs', '/admin/people']) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
    }
    expect(violations).toEqual([]);
  });
});
