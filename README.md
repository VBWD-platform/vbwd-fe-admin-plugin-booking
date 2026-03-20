# vbwd-fe-admin-plugin-booking

Admin booking plugin — resource management, booking dashboard, category & type CRUD.

## Structure

```
plugins/booking/
├── index.ts              # bookingAdminPlugin: IPlugin (named export)
├── booking/              # Source code
│   ├── views/            # ResourceList, ResourceForm, BookingList, etc.
│   └── stores/           # resourceAdmin, bookingAdmin
├── tests/
│   ├── unit/
│   └── e2e/              # Playwright tests
└── .github/workflows/    # CI (style + unit + e2e)
```

## Tests

### Unit tests

```bash
cd vbwd-fe-admin
npx vitest run plugins/booking/
```

### E2E tests (Playwright)

E2E tests run against the full platform (backend API + fe-admin). The platform must be running before you start.

**Prerequisites:**

```bash
# 1. Start backend (from vbwd-backend/ or vbwd-platform/)
make up

# 2. Start fe-admin dev server (from vbwd-fe-admin/)
docker compose --profile dev up -d
# OR without docker:
npm run dev
```

**Run all booking e2e tests:**

```bash
cd vbwd-fe-admin
E2E_BASE_URL=http://localhost:8081 npx playwright test plugins/booking/tests/e2e/ --config=playwright.platform.config.ts
```

**Run a specific test file:**

```bash
E2E_BASE_URL=http://localhost:8081 npx playwright test plugins/booking/tests/e2e/booking-resources-crud.spec.ts --config=playwright.platform.config.ts
```

**Run with visible browser (headed mode):**

```bash
E2E_BASE_URL=http://localhost:8081 npx playwright test plugins/booking/tests/e2e/ --config=playwright.platform.config.ts --headed
```

**Test files:**

| File | Covers |
|------|--------|
| `booking-admin.spec.ts` | Plugin installation, nav, page loads, API endpoints |
| `booking-resources-crud.spec.ts` | Create categories, create resources with different types |
| `booking-resource-types.spec.ts` | CRUD resource types, verify dynamic type dropdown |
