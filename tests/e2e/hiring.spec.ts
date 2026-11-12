// Admin panel, end to end: a real production build, a real browser, the E2E database.
import { expect, test, type Page } from '@playwright/test';
import { E2E } from './constants';
import { application, closeDb, notificationCount } from './db';

async function signIn(page: Page, who: { email: string; password: string }) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(who.email);
  await page.getByLabel('Password').fill(who.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin(\?|$)/);
}

async function openApplication(page: Page, firstName: string, jobTitle: string) {
  const app = await application(firstName, jobTitle);
  await page.goto(`/admin/candidates/${app.id}`);
  await expect(page.getByRole('heading', { level: 1, name: `${firstName} E2E` })).toBeVisible();
  return app;
}

const toast = (page: Page, text: string | RegExp) => page.locator('[data-sonner-toast]').filter({ hasText: text });

test.describe.configure({ mode: 'serial' });
test.afterAll(closeDb);

test.describe('admin hiring workflow', () => {
  // One sign-in for the whole flow: the login form allows 5 attempts per email and IP
  // per window (brute-force protection), so signing in before every test trips it.
  let page: Page;
  test.beforeAll(async ({ browser }, info) => {
    test.skip(info.project.name !== 'desktop', 'Workflow changes data; it runs once, on desktop.');
    page = await browser.newPage();
    await signIn(page, E2E.admin);
  });
  test.afterAll(async () => {
    await page?.close();
  });

  test('jobs table shows capacity', async () => {
    await page.goto('/admin/jobs');
    const chefRow = page.getByRole('row').filter({ hasText: E2E.chef });
    await expect(chefRow).toContainText('0/2 filled');
    await expect(chefRow).toContainText('2 remaining');
    await expect(page.getByRole('row').filter({ hasText: E2E.waiter })).toContainText('0/1 filled');
  });

  test('admins cannot set Interview; they see employer feedback read-only, not the interview form', async () => {
    await openApplication(page, 'Anna', E2E.chef);
    // Only the employer moves an application to interview, by recording one.
    const statusMenu = page.getByLabel('Status for Anna E2E');
    await expect(statusMenu.locator('option', { hasText: /^Shortlisted$/ })).toHaveCount(1);
    await expect(statusMenu.locator('option', { hasText: /^Interview$/ })).toHaveCount(0);

    await expect(page.getByRole('heading', { name: 'Employer feedback' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Employer interview' })).toHaveCount(0);
    await expect(page.getByLabel('Interview status')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Save interview' })).toHaveCount(0);

    const app = await application('Anna', E2E.chef);
    expect([app.status, app.interview_status, app.candidate_status, app.filled_positions]).toEqual([
      'shortlisted', 'not_scheduled', 'open', 0,
    ]);
  });

  test('hire: confirmation dialog, capacity update, other application cancelled', async () => {
    await openApplication(page, 'Anna', E2E.chef);
    await page.getByRole('button', { name: 'Mark as hired' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Fills 1 of the 2 remaining positions');
    await expect(dialog).toContainText('Their 1 other active application is cancelled');
    await dialog.getByRole('button', { name: 'Confirm hire' }).click();

    await expect(toast(page, /Anna E2E hired for E2E Head Chef\. 1 position left\. 1 other application was cancelled\./)).toBeVisible();
    await expect(page.getByText(/^Hired on /)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark as hired' })).toHaveCount(0);
    await expect(page.getByText('1/2 filled, 1 remaining')).toBeVisible();

    const hired = await application('Anna', E2E.chef);
    const other = await application('Anna', E2E.waiter);
    expect([hired.status, hired.candidate_status, hired.filled_positions, hired.job_status]).toEqual([
      'hired', 'hired', 1, 'published',
    ]);
    expect(other.status).toBe('cancelled');

    await page.goto('/admin/jobs');
    await expect(page.getByRole('row').filter({ hasText: E2E.chef })).toContainText('1/2 filled');
  });

  test('reject after interview: capacity unchanged', async () => {
    await openApplication(page, 'Ben', E2E.chef);
    await page.getByLabel('Status for Ben E2E').selectOption('rejected');
    await expect(toast(page, 'Marked as rejected.')).toBeVisible();
    const app = await application('Ben', E2E.chef);
    expect([app.status, app.candidate_status, app.filled_positions]).toEqual(['rejected', 'open', 1]);
  });

  test('last position: job closes automatically and stops accepting hires', async () => {
    await openApplication(page, 'Cara', E2E.waiter);
    await page.getByRole('button', { name: 'Mark as hired' }).click();
    await expect(page.getByRole('dialog')).toContainText('the job then closes automatically');
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm hire' }).click();
    await expect(toast(page, 'All positions are filled; the job is now closed.')).toBeVisible();

    await page.goto('/admin/jobs');
    const waiterRow = page.getByRole('row').filter({ hasText: E2E.waiter });
    await expect(waiterRow).toContainText('Closed');
    await expect(waiterRow).toContainText('Full');

    await openApplication(page, 'Dan', E2E.waiter);
    await expect(page.getByRole('button', { name: 'Mark as hired' })).toBeDisabled();
    await expect(page.getByText('All positions are filled. Raise the number of openings on the job first.')).toBeVisible();
    expect((await application('Dan', E2E.waiter)).filled_positions).toBe(1);
  });

  test('a hired candidate cannot be submitted to another job', async () => {
    await openApplication(page, 'Anna', E2E.waiter);
    await expect(page.getByRole('button', { name: 'Mark as hired' })).toBeDisabled();
    await page.getByLabel('Status for Anna E2E').selectOption('submitted');
    await expect(toast(page, /already hired for another job/)).toBeVisible();
    expect((await application('Anna', E2E.waiter)).status).toBe('cancelled');
  });

  test('dashboard pipeline reflects the changes', async () => {
    await page.goto('/admin');
    const pipeline = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Candidate pipeline' }) });
    // Dan pending; Eve, Gus and Hal submitted; Anna and Cara hired. Ben (rejected) and
    // Anna's cancelled application are not in the pipeline.
    await expect(pipeline).toContainText(/6\s*applicants/);
    await expect(pipeline).toContainText(/Hired\s*33%\s*2/);
    await expect(pipeline).toContainText(/Pending review\s*17%\s*1/);
  });

  test('talent pool: open candidate without a job, assigned from their profile', async () => {
    await page.goto('/admin/people?status=open&nojob=1');
    await expect(page.getByRole('link', { name: 'Pia E2E', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dan E2E', exact: true })).toHaveCount(0); // has a job
    await page.getByRole('link', { name: 'Pia E2E', exact: true }).click();
    await expect(page.getByText('Not assigned to any job yet.')).toBeVisible();

    // Anna's hire left 1 of 2 chef positions open.
    await page.getByLabel('Job').selectOption({ label: `${E2E.chef} · E2E Hotel Group · 1 open` });
    await page.getByRole('button', { name: 'Assign to job' }).click();
    await expect(page).toHaveURL(/\/admin\/candidates\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Pia E2E' })).toBeVisible();
    const pia = await application('Pia', E2E.chef);
    expect([pia.status, pia.candidate_status]).toEqual(['pending', 'open']);

    await page.goto('/admin/people?status=hired');
    await expect(page.getByRole('link', { name: 'Anna E2E', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pia E2E', exact: true })).toHaveCount(0);
  });
});

test.describe('client login (E2E Hotel Group)', () => {
  let page: Page;
  test.beforeAll(async ({ browser }, info) => {
    test.skip(info.project.name !== 'desktop', 'Client checks run once.');
    page = await browser.newPage();
    await signIn(page, E2E.employer);
  });
  test.afterAll(async () => {
    await page?.close();
  });

  test('sees only its own jobs', async () => {
    await page.goto('/admin/jobs');
    await expect(page.getByRole('row').filter({ hasText: E2E.chef })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: E2E.waiter })).toBeVisible();
    await expect(page.getByText(E2E.otherClientJob)).toHaveCount(0);
  });

  test('sees only candidates submitted to it', async () => {
    await page.goto('/admin/candidates');
    for (const name of ['Anna E2E', 'Ben E2E', 'Cara E2E', 'Gus E2E', 'Hal E2E']) {
      await expect(page.getByRole('link', { name, exact: true }).first()).toBeVisible();
    }
    // Dan was never submitted; Eve applied to the other client; Pia has no job.
    for (const name of ['Dan E2E', 'Eve E2E', 'Pia E2E']) {
      await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0);
    }
  });

  test('cannot open other applications by URL, or the talent pool', async () => {
    for (const [firstName, job] of [['Dan', E2E.waiter], ['Eve', E2E.otherClientJob], ['Anna', E2E.waiter]] as const) {
      const app = await application(firstName, job);
      const response = await page.goto(`/admin/candidates/${app.id}`);
      expect(response?.status(), `${firstName} / ${job}`).toBe(404);
      const cv = await page.request.get(`/admin/candidates/${app.id}/cv`, { maxRedirects: 0 });
      expect(cv.status(), `CV of ${firstName}`).toBe(404);
    }
    await page.goto('/admin/people');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('link', { name: 'Talent pool' })).toHaveCount(0);
  });

  test('a submitted candidate: contacts and notes shown, nothing internal, no status menu', async () => {
    await openApplication(page, 'Anna', E2E.chef);
    await expect(page.getByText('anna@e2e.test')).toBeVisible();
    await expect(page.getByText('Phone screen done.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Other applications' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'History' })).toHaveCount(0);
    await expect(page.getByLabel('Status for Anna E2E')).toHaveCount(0);
    await expect(page.getByText(/^Hired on /)).toBeVisible(); // already decided
  });

  test('client records the interview and hires; the agency is alerted', async () => {
    await openApplication(page, 'Gus', E2E.chef);
    await page.getByLabel('Interview status').selectOption('passed');
    await page.getByLabel('Date and time (Cyprus)').fill('2026-11-25T11:00');
    await page.getByLabel('Employer feedback').fill('Great tasting, hire him.');
    await page.getByRole('button', { name: 'Save interview' }).click();
    await expect(toast(page, 'Interview details saved.')).toBeVisible();

    await page.getByRole('button', { name: 'Mark as hired' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm hire' }).click();
    await expect(toast(page, /Gus E2E hired for E2E Head Chef\. All positions are filled; the job is now closed\./)).toBeVisible();

    const gus = await application('Gus', E2E.chef);
    expect([gus.status, gus.interview_status, gus.candidate_status, gus.filled_positions, gus.job_status]).toEqual([
      'hired', 'passed', 'hired', 2, 'closed',
    ]);
    expect(await notificationCount('Client updated an interview')).toBe(1);
    expect(await notificationCount('Client hired a candidate')).toBe(1);
  });

  test('client rejects a candidate', async () => {
    await openApplication(page, 'Hal', E2E.waiter);
    await expect(page.getByRole('button', { name: 'Mark as hired' })).toBeDisabled(); // waiter is full
    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();
    await expect(toast(page, 'Hal E2E rejected.')).toBeVisible();
    expect((await application('Hal', E2E.waiter)).status).toBe('rejected');
    expect(await notificationCount('Client rejected a candidate')).toBe(1);
  });

  test('dashboard counts only its submitted candidates', async () => {
    await page.goto('/admin');
    const pipeline = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Candidate pipeline' }) });
    // Anna, Cara and Gus (hired by the client above) hired; Ben and Hal rejected; nothing pending.
    await expect(pipeline).toContainText(/3\s*applicants/);
    await expect(pipeline).toContainText(/Hired\s*100%\s*3/);
    await expect(pipeline).toContainText(/Pending review\s*0%\s*0/);
  });
});

test.describe('mobile layout', () => {
  test('profile, candidates and jobs pages fit the screen; hiring panel usable', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'Mobile only.');
    await signIn(page, E2E.admin);
    const noPageScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

    await openApplication(page, 'Dan', E2E.waiter);
    expect(await noPageScroll()).toBe(true);
    await expect(page.getByRole('button', { name: 'Mark as hired' })).toBeDisabled();
    await expect(page.getByRole('heading', { name: 'Employer feedback' })).toBeVisible();

    await page.goto('/admin/candidates');
    await expect(page.getByRole('link', { name: 'Dan E2E', exact: true }).first()).toBeVisible();
    expect(await noPageScroll()).toBe(true);

    await page.goto('/admin/jobs');
    await expect(page.getByText(E2E.chef).first()).toBeVisible();
    expect(await noPageScroll()).toBe(true);
  });
});
