import { test, expect } from '@playwright/test';

/**
 * Booking Resources & Categories — E2E CRUD Test
 *
 * Single session: login → navigate to booking resources → create 2 categories → create 3 resources.
 * All navigation via clicks (SPA), no page.goto() after login.
 */

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'AdminPass123@';
const RUN_ID = Date.now().toString(36);

test('booking: login → create categories → create resources', async ({ page }) => {
  test.setTimeout(120_000);

  /* ── Login ─────────────────────────────────────────────────────────── */
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForLoadState('networkidle');

  /* ── Navigate to Booking → Resources ───────────────────────────────── */
  await page.locator('#nav-item-admin-booking-resources').click();
  await page.waitForLoadState('networkidle');

  /* ── Switch to Categories tab ──────────────────────────────────────── */
  await page.locator('button.tab-btn:has-text("Categories")').click();

  /* ── Create category 1: Wellness ───────────────────────────────────── */
  await page.locator('.add-form-row input[placeholder="Category name"]').fill(`Wellness ${RUN_ID}`);
  await page.locator('.add-form-row input[placeholder="Category name"]').blur();
  await page.locator('.add-form-row input[placeholder="slug"]').fill(`wellness-${RUN_ID}`);
  await page.locator('.add-form-row button:has-text("Add")').click();
  await expect(page.locator(`text=Wellness ${RUN_ID}`)).toBeVisible();

  /* ── Create category 2: Business ───────────────────────────────────── */
  // Re-locate elements after DOM re-render
  await page.locator('.add-form-row input[placeholder="Category name"]').fill(`Business ${RUN_ID}`);
  await page.locator('.add-form-row input[placeholder="Category name"]').blur();
  await page.locator('.add-form-row input[placeholder="slug"]').fill(`business-${RUN_ID}`);
  await page.locator('.add-form-row button:has-text("Add")').click();
  await expect(page.locator(`text=Business ${RUN_ID}`)).toBeVisible({ timeout: 15000 });

  /* ── Verify both categories in table ───────────────────────────────── */
  await expect(page.locator(`.plans-table >> text=wellness-${RUN_ID}`)).toBeVisible();
  await expect(page.locator(`.plans-table >> text=business-${RUN_ID}`)).toBeVisible();

  /* ── Click "+ New Resource" ─────────────────────────────────────────── */
  await page.locator('button.tab-btn:has-text("Resources")').click();
  await page.locator('button:has-text("New Resource")').click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1:has-text("New Resource")')).toBeVisible({ timeout: 15000 });

  /* ── Create resource 1: Massage Therapist (specialist) ─────────────── */
  await page.locator('.resource-form__field').filter({ hasText: 'Name' }).locator('input').fill(`Massage Therapist ${RUN_ID}`);
  await page.locator('.resource-form__field').filter({ hasText: 'Name' }).locator('input').blur();
  await page.locator('.resource-form__field').filter({ hasText: 'Type' }).locator('select').selectOption('specialist');
  await page.locator('.resource-form__field').filter({ hasText: 'Capacity' }).locator('input').fill('1');
  await page.locator('.resource-form__field').filter({ hasText: 'Slot Duration' }).locator('input').fill('60');
  await page.locator('.resource-form__field').filter({ hasText: /^Price$/ }).locator('input').fill('85.00');
  await page.locator('.resource-form__field').filter({ hasText: 'Currency' }).locator('input').clear();
  await page.locator('.resource-form__field').filter({ hasText: 'Currency' }).locator('input').fill('EUR');
  await page.locator('.resource-form__field').filter({ hasText: 'Price Unit' }).locator('select').selectOption('per_slot');

  // Assign Wellness category via two-sided selector
  const wellnessItem = page.locator('.category-item').filter({ hasText: `Wellness ${RUN_ID}` });
  if (await wellnessItem.isVisible({ timeout: 3000 }).catch(() => false)) {
    await wellnessItem.locator('.assign-btn').click();
  }

  await page.locator('button[type="submit"]').click();
  await expect(page.locator('h2:has-text("Resources & Categories")')).toBeVisible({ timeout: 15000 });
  await expect(page.locator(`text=Massage Therapist ${RUN_ID}`)).toBeVisible({ timeout: 15000 });

  /* ── Create resource 2: Conference Room (room) ─────────────────────── */
  await page.locator('button:has-text("New Resource")').click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1:has-text("New Resource")')).toBeVisible({ timeout: 15000 });

  await page.locator('.resource-form__field').filter({ hasText: 'Name' }).locator('input').fill(`Conference Room ${RUN_ID}`);
  await page.locator('.resource-form__field').filter({ hasText: 'Name' }).locator('input').blur();
  await page.locator('.resource-form__field').filter({ hasText: 'Type' }).locator('select').selectOption('room');
  await page.locator('.resource-form__field').filter({ hasText: 'Capacity' }).locator('input').fill('20');
  await page.locator('.resource-form__field').filter({ hasText: 'Slot Duration' }).locator('input').fill('30');
  await page.locator('.resource-form__field').filter({ hasText: /^Price$/ }).locator('input').fill('120.00');
  await page.locator('.resource-form__field').filter({ hasText: 'Currency' }).locator('input').clear();
  await page.locator('.resource-form__field').filter({ hasText: 'Currency' }).locator('input').fill('EUR');
  await page.locator('.resource-form__field').filter({ hasText: 'Price Unit' }).locator('select').selectOption('per_hour');

  // Assign Business category via two-sided selector
  const businessItem = page.locator('.category-item').filter({ hasText: `Business ${RUN_ID}` });
  if (await businessItem.isVisible({ timeout: 3000 }).catch(() => false)) {
    await businessItem.locator('.assign-btn').click();
  }

  await page.locator('button[type="submit"]').click();
  await expect(page.locator('h2:has-text("Resources & Categories")')).toBeVisible({ timeout: 15000 });
  await expect(page.locator(`text=Conference Room ${RUN_ID}`)).toBeVisible({ timeout: 15000 });

  /* ── Create resource 3: Yoga Studio (space, flexible duration) ─────── */
  await page.locator('button:has-text("New Resource")').click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1:has-text("New Resource")')).toBeVisible({ timeout: 15000 });

  await page.locator('.resource-form__field').filter({ hasText: 'Name' }).locator('input').fill(`Yoga Studio ${RUN_ID}`);
  await page.locator('.resource-form__field').filter({ hasText: 'Name' }).locator('input').blur();
  await page.locator('.resource-form__field').filter({ hasText: 'Type' }).locator('select').selectOption('space');
  await page.locator('.resource-form__field').filter({ hasText: 'Capacity' }).locator('input').fill('15');
  // Leave slot_duration_minutes at default (flexible duration = no value)
  await page.locator('.resource-form__field').filter({ hasText: /^Price$/ }).locator('input').fill('45.00');
  await page.locator('.resource-form__field').filter({ hasText: 'Currency' }).locator('input').clear();
  await page.locator('.resource-form__field').filter({ hasText: 'Currency' }).locator('input').fill('EUR');
  await page.locator('.resource-form__field').filter({ hasText: 'Price Unit' }).locator('select').selectOption('per_hour');

  // Assign both categories via two-sided selector
  const wellnessItem2 = page.locator('.category-item').filter({ hasText: `Wellness ${RUN_ID}` });
  if (await wellnessItem2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await wellnessItem2.locator('.assign-btn').click();
  }
  const businessItem2 = page.locator('.category-item').filter({ hasText: `Business ${RUN_ID}` });
  if (await businessItem2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await businessItem2.locator('.assign-btn').click();
  }

  await page.locator('button[type="submit"]').click();
  await expect(page.locator('h2:has-text("Resources & Categories")')).toBeVisible({ timeout: 15000 });
  await expect(page.locator(`text=Yoga Studio ${RUN_ID}`)).toBeVisible({ timeout: 15000 });

  /* ── Verify all 3 resources in table ───────────────────────────────── */
  await expect(page.locator(`text=Massage Therapist ${RUN_ID}`)).toBeVisible();
  await expect(page.locator(`text=Conference Room ${RUN_ID}`)).toBeVisible();
  await expect(page.locator(`text=Yoga Studio ${RUN_ID}`)).toBeVisible();

  /* ── Verify search filter ──────────────────────────────────────────── */
  const searchInput = page.locator('input.search-input[placeholder="Search resources..."]');
  await searchInput.fill('Massage');
  await expect(page.locator(`text=Massage Therapist ${RUN_ID}`)).toBeVisible();
  await expect(page.locator(`text=Conference Room ${RUN_ID}`)).not.toBeVisible();
  await searchInput.clear();

  /* ── Verify categories tab shows both categories ───────────────────── */
  await page.locator('button.tab-btn:has-text("Categories")').click();
  await expect(page.locator('tr.plan-row').filter({ hasText: `Wellness ${RUN_ID}` })).toBeVisible({ timeout: 15000 });
  await expect(page.locator('tr.plan-row').filter({ hasText: `Business ${RUN_ID}` })).toBeVisible();

  /* ── Cleanup via API ───────────────────────────────────────────────── */
  const loginResponse = await page.request.post('/api/v1/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const loginData = await loginResponse.json();
  const token = loginData.token || loginData.access_token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const resourcesResponse = await page.request.get('/api/v1/admin/booking/resources', { headers: authHeaders });
  const resourcesData = await resourcesResponse.json();
  for (const resource of resourcesData.resources) {
    if (resource.name.endsWith(RUN_ID)) {
      await page.request.delete(`/api/v1/admin/booking/resources/${resource.id}`, { headers: authHeaders });
    }
  }

  const categoriesResponse = await page.request.get('/api/v1/admin/booking/categories', { headers: authHeaders });
  const categoriesData = await categoriesResponse.json();
  for (const category of categoriesData.categories) {
    if (category.slug.endsWith(RUN_ID)) {
      await page.request.delete(`/api/v1/admin/booking/categories/${category.id}`, { headers: authHeaders });
    }
  }
});
