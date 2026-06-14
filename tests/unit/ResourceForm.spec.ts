import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createI18n } from 'vue-i18n';
import ResourceForm from '../../booking/views/ResourceForm.vue';
import bookingEn from '../../locales/en.json';
import { api } from '@/api';
import { configureAuthStore, useAuthStore } from '@/stores/auth';
import { __resetTaxOptionsCache } from '@/composables/useTaxOptions';

vi.mock('@/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  },
  initializeApi: vi.fn(),
  clearApiAuth: vi.fn(),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en: bookingEn },
});

const taxRates = [
  { id: 'tax-1', code: 'VAT19', name: 'Standard VAT', rate: '19.00', is_active: true },
  { id: 'tax-2', code: 'OLD', name: 'Retired', rate: '7.00', is_active: false },
];

const mockResource = {
  id: 'res-1',
  name: 'Room A',
  slug: 'room-a',
  description: '',
  custom_schema_id: null,
  capacity: 1,
  slot_duration_minutes: 30,
  price: '10.00',
  currency: 'EUR',
  price_unit: 'per_slot',
  is_active: true,
  sort_order: 0,
  categories: [],
  tax_ids: ['tax-1'],
};

function mockApiByUrl(resource: Record<string, unknown> | null): void {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/admin/tax/rates') return Promise.resolve({ rates: taxRates });
    if (url.startsWith('/admin/booking/resources/')) return Promise.resolve(resource);
    if (url === '/admin/booking/categories') return Promise.resolve({ categories: [] });
    if (url === '/admin/booking/schemas') return Promise.resolve({ schemas: [] });
    return Promise.resolve({});
  });
}

const ImageGalleryStub = { name: 'ResourceImageGallery', template: '<div />' };

function mountForm(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin/booking/resources', name: 'resources', component: { template: '<div />' } },
      { path: '/admin/booking/resources/new', name: 'resource-new', component: ResourceForm },
      { path: '/admin/booking/resources/:id/edit', name: 'resource-edit', component: ResourceForm },
    ],
  });
  return router.push(path).then(() =>
    mount(ResourceForm, {
      global: {
        plugins: [router, i18n],
        stubs: { ResourceImageGallery: ImageGalleryStub },
      },
    }),
  );
}

describe('ResourceForm.vue — Taxes block (S72.3)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    configureAuthStore({
      storageKey: 'test_token',
      apiClient: api as Parameters<typeof configureAuthStore>[0]['apiClient'],
    });
    const authStore = useAuthStore();
    authStore.$patch({
      user: { id: '1', email: 'admin@test.com', role: 'SUPER_ADMIN', permissions: ['*'] },
      token: 'test-token',
    });
    vi.clearAllMocks();
    __resetTaxOptionsCache();
  });

  it('lists active taxes from /admin/tax/rates', async () => {
    mockApiByUrl(null);
    const wrapper = await mountForm('/admin/booking/resources/new');
    await flushPromises();

    expect(wrapper.find('[data-testid="resource-taxes-section"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dual-list-available-tax-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dual-list-available-tax-2"]').exists()).toBe(false);
  });

  it('pre-selects the resource\'s assigned tax_ids on edit', async () => {
    mockApiByUrl(mockResource);
    const wrapper = await mountForm('/admin/booking/resources/res-1/edit');
    await flushPromises();

    expect(wrapper.find('[data-testid="dual-list-assigned-tax-1"]').exists()).toBe(true);
  });

  it('sends tax_ids in the update payload', async () => {
    mockApiByUrl(mockResource);
    vi.mocked(api.put).mockResolvedValue(mockResource);
    const wrapper = await mountForm('/admin/booking/resources/res-1/edit');
    await flushPromises();

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(api.put).toHaveBeenCalledWith(
      '/admin/booking/resources/res-1',
      expect.objectContaining({ tax_ids: ['tax-1'] }),
    );
  });
});

describe('ResourceForm.vue — Price display override (S72.4)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    configureAuthStore({
      storageKey: 'test_token',
      apiClient: api as Parameters<typeof configureAuthStore>[0]['apiClient'],
    });
    const authStore = useAuthStore();
    authStore.$patch({
      user: { id: '1', email: 'admin@test.com', role: 'SUPER_ADMIN', permissions: ['*'] },
      token: 'test-token',
    });
    vi.clearAllMocks();
    __resetTaxOptionsCache();
  });

  it('defaults to Inherit (empty) when price_display_mode is null', async () => {
    mockApiByUrl(null);
    const wrapper = await mountForm('/admin/booking/resources/new');
    await flushPromises();

    const select = wrapper.find('[data-testid="resource-price-display-mode"]');
    expect(select.exists()).toBe(true);
    // The Inherit option (empty value) is the default selection.
    expect((select.element as HTMLSelectElement).selectedIndex).toBe(0);
  });

  it('pre-selects the resource\'s price_display_mode on edit', async () => {
    mockApiByUrl({ ...mockResource, price_display_mode: 'netto' });
    const wrapper = await mountForm('/admin/booking/resources/res-1/edit');
    await flushPromises();

    const select = wrapper.find('[data-testid="resource-price-display-mode"]');
    expect((select.element as HTMLSelectElement).value).toBe('netto');
  });

  it('sends price_display_mode=null when Inherit is selected', async () => {
    mockApiByUrl(mockResource);
    vi.mocked(api.put).mockResolvedValue(mockResource);
    const wrapper = await mountForm('/admin/booking/resources/res-1/edit');
    await flushPromises();

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(api.put).toHaveBeenCalledWith(
      '/admin/booking/resources/res-1',
      expect.objectContaining({ price_display_mode: null }),
    );
  });

  it('sends the selected override in the update payload', async () => {
    mockApiByUrl(mockResource);
    vi.mocked(api.put).mockResolvedValue(mockResource);
    const wrapper = await mountForm('/admin/booking/resources/res-1/edit');
    await flushPromises();

    await wrapper.find('[data-testid="resource-price-display-mode"]').setValue('brutto');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(api.put).toHaveBeenCalledWith(
      '/admin/booking/resources/res-1',
      expect.objectContaining({ price_display_mode: 'brutto' }),
    );
  });
});
