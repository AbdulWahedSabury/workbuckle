// Positions in the browser: the catalog page, the job form, the talent pool
// filter and the profile editor. Runs after hiring.spec.ts (files run in name
// order), so the pool holds Ben (rejected for the chef job) and Hal (rejected
// for the waiter job); both got their job's position from the seed.
import { expect, test, type Page } from '@playwright/test';
import { E2E } from './constants';

const toast = (page: Page, text: string) => page.locator('[data-sonner-toast]').filter({ hasText: text });

test.describe.configure({ mode: 'serial' });

test.describe('positions', () => {
  let page: Page;
  test.beforeAll(async ({ browser }, info) => {
    test.skip(info.project.name !== 'desktop', 'Changes data; runs once, on desktop.');
    page = await browser.newPage();
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(E2E.admin.email);
    await page.getByLabel('Password').fill(E2E.admin.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/admin(\?|$)/);
  });
  test.afterAll(async () => {
    await page?.close();
  });

  test('admin adds a position from the Positions page', async () => {
    await page.goto('/admin/positions');
    await page.getByRole('link', { name: 'New position' }).click();
    await page.getByLabel('Name').fill('E2E Bartender');
    await page.getByRole('button', { name: 'Create position' }).click();
    await expect(page).toHaveURL(/\/admin\/positions$/);
    await expect(page.getByRole('cell', { name: 'E2E Bartender', exact: true })).toBeVisible();
  });

  test('the job form shows the job’s position', async () => {
    await page.goto('/admin/jobs');
    await page.getByRole('link', { name: `Edit ${E2E.chef}` }).click();
    await expect(page.getByLabel('Position').locator('option:checked')).toHaveText(E2E.chefPosition);
  });

  test('talent pool filters by position, keeping the tab', async () => {
    await page.goto('/admin/people');
    const ben = page.getByRole('link', { name: 'Ben E2E', exact: true });
    const hal = page.getByRole('link', { name: 'Hal E2E', exact: true });
    await expect(ben).toBeVisible();
    await expect(hal).toBeVisible();

    await page.getByLabel('Filter by position').selectOption({ label: E2E.chefPosition });
    await expect(page).toHaveURL(/position=/);
    await expect(ben).toBeVisible();
    await expect(hal).toHaveCount(0);

    await page.getByLabel('Filter by position').selectOption({ label: E2E.waiterPosition });
    await expect(hal).toBeVisible();
    await expect(ben).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^Inactive/ })).toHaveAttribute('href', /position=/);
  });

  test('admin sets positions on a profile; the pool filter picks it up', async () => {
    await page.goto('/admin/people');
    await page.getByRole('link', { name: 'Hal E2E', exact: true }).click();
    await page.getByLabel('E2E Bartender').check();
    await page.getByRole('button', { name: 'Save positions' }).click();
    await expect(toast(page, 'Positions saved.')).toBeVisible();

    await page.goto('/admin/people');
    await page.getByLabel('Filter by position').selectOption({ label: 'E2E Bartender' });
    await expect(page.getByRole('link', { name: 'Hal E2E', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ben E2E', exact: true })).toHaveCount(0);
  });
});
