import { test, expect } from '@playwright/test';

/**
 * Booking Resource Types — E2E CRUD Test
 *
 * Single session: login → navigate to booking resources → Types tab →
 * create 2 types → verify they appear in Type dropdown on new resource form →
 * cleanup via API.
 */

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'AdminPass123@';
const RUN_ID = Date.now().toString(36);

test('booking: login → create resource types → verify in form', async ({ page }) => {
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

  /* ── Switch to Types tab ───────────────────────────────────────────── */
  await page.locator('button.tab-btn:has-text("Types")').click();

  /* ── Verify default types exist ────────────────────────────────────── */
  await expect(page.locator('.plans-table .category-slug:has-text("specialist")')).toBeVisible();
  await expect(page.locator('.plans-table .category-slug:has-text("room")')).toBeVisible();

  /* ── Create type 1: Vehicle ────────────────────────────────────────── */
  await page.locator('.add-form-row input[placeholder="Type name"]').fill(`Vehicle ${RUN_ID}`);
  await page.locator('.add-form-row input[placeholder="Type name"]').blur();
  await page.locator('.add-form-row input[placeholder="slug"]').fill(`vehicle-${RUN_ID}`);
  await page.locator('.add-form-row button:has-text("Add")').click();
  await expect(page.locator(`text=Vehicle ${RUN_ID}`)).toBeVisible();

  /* ── Create type 2: Equipment ──────────────────────────────────────── */
  await page.locator('.add-form-row input[placeholder="Type name"]').fill(`Equipment ${RUN_ID}`);
  await page.locator('.add-form-row input[placeholder="Type name"]').blur();
  await page.locator('.add-form-row input[placeholder="slug"]').fill(`equipment-${RUN_ID}`);
  await page.locator('.add-form-row button:has-text("Add")').click();
  await expect(page.locator(`text=Equipment ${RUN_ID}`)).toBeVisible();

  /* ── Verify both types in table ────────────────────────────────────── */
  await expect(page.locator(`.plans-table >> text=vehicle-${RUN_ID}`)).toBeVisible();
  await expect(page.locator(`.plans-table >> text=equipment-${RUN_ID}`)).toBeVisible();

  /* ── Go to New Resource form and verify types in dropdown ──────────── */
  await page.locator('button.tab-btn:has-text("Resources")').click();
  await page.locator('button:has-text("New Resource")').click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1:has-text("New Resource")')).toBeVisible({ timeout: 15000 });

  const typeSelect = page.locator('.resource-form__field').filter({ hasText: 'Type' }).locator('select');
  // New types should be available as options
  await expect(typeSelect.locator(`option[value="vehicle-${RUN_ID}"]`)).toBeAttached();
  await expect(typeSelect.locator(`option[value="equipment-${RUN_ID}"]`)).toBeAttached();

  // Select the new type and create a resource with it
  await typeSelect.selectOption(`vehicle-${RUN_ID}`);
  await page.locator('.resource-form__field').filter({ hasText: 'Name' }).locator('input').fill(`Test Vehicle ${RUN_ID}`);
  await page.locator('.resource-form__field').filter({ hasText: 'Name' }).locator('input').blur();
  await page.locator('.resource-form__field').filter({ hasText: 'Capacity' }).locator('input').fill('1');
  await page.locator('.resource-form__field').filter({ hasText: /^Price$/ }).locator('input').fill('50.00');
  await page.locator('.resource-form__field').filter({ hasText: 'Currency' }).locator('input').clear();
  await page.locator('.resource-form__field').filter({ hasText: 'Currency' }).locator('input').fill('EUR');

  await page.locator('button[type="submit"]').click();
  await expect(page.locator('h2:has-text("Resources & Categories")')).toBeVisible({ timeout: 15000 });
  await expect(page.locator(`text=Test Vehicle ${RUN_ID}`)).toBeVisible({ timeout: 15000 });

  /* ── Verify resource shows the custom type ─────────────────────────── */
  await expect(page.locator(`text=vehicle-${RUN_ID}`)).toBeVisible();

  /* ── Verify Types tab shows resource count ─────────────────────────── */
  await page.locator('button.tab-btn:has-text("Types")').click();
  const vehicleRow = page.locator('tr.plan-row').filter({ hasText: `Vehicle ${RUN_ID}` });
  await expect(vehicleRow).toBeVisible();

  /* ── Delete a type ─────────────────────────────────────────────────── */
  page.on('dialog', dialog => dialog.accept());
  const equipmentRow = page.locator('tr.plan-row').filter({ hasText: `Equipment ${RUN_ID}` });
  await equipmentRow.locator('button:has-text("Delete")').click();
  await expect(page.locator(`text=equipment-${RUN_ID}`)).not.toBeVisible();

  /* ── Cleanup via API ───────────────────────────────────────────────── */
  const loginResponse = await page.request.post('/api/v1/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const loginData = await loginResponse.json();
  const token = loginData.token || loginData.access_token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // Delete test resources
  const resourcesResponse = await page.request.get('/api/v1/admin/booking/resources', { headers: authHeaders });
  const resourcesData = await resourcesResponse.json();
  for (const resource of resourcesData.resources) {
    if (resource.name.endsWith(RUN_ID)) {
      await page.request.delete(`/api/v1/admin/booking/resources/${resource.id}`, { headers: authHeaders });
    }
  }

  // Delete test types
  const typesResponse = await page.request.get('/api/v1/admin/booking/resource-types', { headers: authHeaders });
  const typesData = await typesResponse.json();
  for (const resourceType of typesData.resource_types) {
    if (resourceType.slug.endsWith(RUN_ID)) {
      await page.request.delete(`/api/v1/admin/booking/resource-types/${resourceType.id}`, { headers: authHeaders });
    }
  }
});
