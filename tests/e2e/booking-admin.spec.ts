import { test, expect } from '@playwright/test';

/**
 * Booking Admin Plugin — E2E Tests
 *
 * Verifies the booking plugin is installed, nav section visible,
 * and booking admin pages load correctly.
 *
 * Run against platform:
 *   cd vbwd-fe-admin
 *   npx playwright test plugins/booking/tests/e2e/ --config=playwright.platform.config.ts
 */

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'AdminPass123@';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');

  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');
  const submitButton = page.locator('button[type="submit"]');

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(ADMIN_EMAIL);
  await passwordInput.fill(ADMIN_PASSWORD);
  await submitButton.click();

  // Wait for SPA client-side redirect to /admin/dashboard rather than
  // relying on networkidle, which completes before router.push finishes.
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
}

test.describe('Booking Admin Plugin — Installation & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('admin dashboard loads after login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    await expect(page).toHaveURL(/admin/);
  });

  test('sidebar contains Bookings nav section', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for the Bookings section in the sidebar
    const sidebar = page.locator('nav, .sidebar, [data-testid="sidebar-nav"]').first();
    const bookingsSection = sidebar.getByRole('link', { name: 'Bookings', exact: true });

    await expect(bookingsSection).toBeVisible({
      timeout: 10000,
    });
  });

  async function expandBookingsSection(page: import('@playwright/test').Page) {
    // The Bookings submenu is collapsed by default — its toggle button is
    // the "▸" sibling of the Bookings link. Clicking it expands the submenu
    // so the child links (Dashboard / All Bookings / Resources) render.
    const bookingsLink = page
      .locator('nav')
      .first()
      .getByRole('link', { name: 'Bookings', exact: true });
    const toggle = bookingsLink.locator('xpath=following-sibling::button[1]');
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click();
    }
  }

  test('Bookings section has Dashboard nav item', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    await expandBookingsSection(page);
    const dashboardLink = page.locator('a[href="/admin/booking"]').first();
    await expect(dashboardLink).toBeVisible({ timeout: 5000 });
  });

  test('Bookings section has All Bookings nav item', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    await expandBookingsSection(page);
    const listLink = page.locator('a[href="/admin/booking/list"]');
    await expect(listLink).toBeVisible({ timeout: 5000 });
  });

  test('Bookings section has Resources nav item', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    await expandBookingsSection(page);
    const resourcesLink = page.locator('a[href="/admin/booking/resources"]');
    await expect(resourcesLink).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Booking Admin Plugin — Pages Load', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('booking dashboard page loads', async ({ page }) => {
    await page.goto('/admin/booking');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1:has-text("Booking Dashboard")');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('booking dashboard shows stats cards', async ({ page }) => {
    await page.goto('/admin/booking');
    await page.waitForLoadState('networkidle');

    // Should have stat cards (Today's Bookings, Upcoming, Resources, Categories)
    const statsArea = page.locator('.booking-dashboard__stats').first();
    await expect(statsArea).toBeVisible({ timeout: 10000 });

    const body = await page.textContent('body');
    expect(body).toContain("Today's Bookings");
    expect(body).toContain('Upcoming');
    expect(body).toContain('Resources');
    expect(body).toContain('Categories');
  });

  test('booking list page loads', async ({ page }) => {
    await page.goto('/admin/booking/list');
    await page.waitForLoadState('networkidle');

    const heading = page.locator(':is(h1,h2,h3):has-text("All Bookings")');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('booking list has status filter', async ({ page }) => {
    await page.goto('/admin/booking/list');
    await page.waitForLoadState('networkidle');

    const filter = page.locator('select, .booking-list__filter');
    await expect(filter).toBeVisible({ timeout: 10000 });
  });

  test('resources page loads', async ({ page }) => {
    await page.goto('/admin/booking/resources');
    await page.waitForLoadState('networkidle');

    const heading = page.locator(':is(h1,h2,h3):has-text("Resources")').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('resources page has New Resource button', async ({ page }) => {
    await page.goto('/admin/booking/resources');
    await page.waitForLoadState('networkidle');

    const newButton = page.getByRole('button', { name: /new resource/i }).or(
      page.getByRole('link', { name: /new resource/i }),
    );
    await expect(newButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('new resource form loads', async ({ page }) => {
    await page.goto('/admin/booking/resources/new');
    await page.waitForLoadState('networkidle');

    const heading = page.locator(':is(h1,h2,h3):has-text("New Resource")');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('new resource form has required fields', async ({ page }) => {
    await page.goto('/admin/booking/resources/new');
    await page.waitForLoadState('networkidle');

    // Check key form fields exist
    const nameInput = page.locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });

    const body = await page.textContent('body');
    expect(body).toContain('Name');
    expect(body).toContain('Slug');
    expect(body).toContain('Schema');
    expect(body).toContain('Capacity');
    expect(body).toContain('Price');
    expect(body).toContain('Currency');
  });
});

test.describe('Booking Admin Plugin — Backend API Integration', () => {
  test('backend booking API is reachable', async ({ request }) => {
    // Login to get admin token
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(loginResponse.ok()).toBeTruthy();

    const loginData = await loginResponse.json();
    const token = loginData.token || loginData.access_token;
    expect(token).toBeTruthy();

    // Check booking categories endpoint
    const categoriesResponse = await request.get('/api/v1/admin/booking/categories', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(categoriesResponse.ok()).toBeTruthy();

    const categoriesData = await categoriesResponse.json();
    expect(categoriesData).toHaveProperty('categories');
  });

  test('backend booking resources endpoint works', async ({ request }) => {
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const loginData = await loginResponse.json();
    const token = loginData.token || loginData.access_token;

    const resourcesResponse = await request.get('/api/v1/admin/booking/resources', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resourcesResponse.ok()).toBeTruthy();

    const resourcesData = await resourcesResponse.json();
    expect(resourcesData).toHaveProperty('resources');
  });

  test('backend booking dashboard endpoint works', async ({ request }) => {
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const loginData = await loginResponse.json();
    const token = loginData.token || loginData.access_token;

    const dashboardResponse = await request.get('/api/v1/admin/booking/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(dashboardResponse.ok()).toBeTruthy();

    const dashboardData = await dashboardResponse.json();
    expect(dashboardData).toHaveProperty('today');
    expect(dashboardData).toHaveProperty('upcoming');
  });

  test('backend booking export-rules endpoint works', async ({ request }) => {
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const loginData = await loginResponse.json();
    const token = loginData.token || loginData.access_token;

    const rulesResponse = await request.get('/api/v1/admin/booking/export-rules', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(rulesResponse.ok()).toBeTruthy();

    const rulesData = await rulesResponse.json();
    expect(rulesData).toHaveProperty('rules');
  });
});
