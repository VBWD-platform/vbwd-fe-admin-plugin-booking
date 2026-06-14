/**
 * S77 — the booking ResourceForm mounts the generic Tags + Custom-fields
 * editors (edit mode only) with entity_type=booking_resource. Same reusable
 * components the other consumers use; the host passes only its entity type + id.
 */
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
import TagPicker from '@/components/TagPicker.vue';
import CustomFieldsEditor from '@/components/CustomFieldsEditor.vue';

vi.mock('@/api', () => ({
  api: {
    get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(),
    setToken: vi.fn(), clearToken: vi.fn(),
  },
  initializeApi: vi.fn(),
  clearApiAuth: vi.fn(),
}));

const i18n = createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: bookingEn } });

const mockResource = {
  id: 'res-1', name: 'Room A', slug: 'room-a', description: '', custom_schema_id: null,
  capacity: 1, slot_duration_minutes: 30, price: '10.00', currency: 'EUR',
  price_unit: 'per_slot', is_active: true, sort_order: 0, categories: [], tax_ids: [],
};

function mockApiByUrl(resource: Record<string, unknown> | null): void {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/admin/tax/rates') return Promise.resolve({ rates: [] });
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
      global: { plugins: [router, i18n], stubs: { ResourceImageGallery: ImageGalleryStub } },
    }),
  );
}

describe('ResourceForm.vue — S77 tags + custom fields', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    configureAuthStore({
      storageKey: 'test_token',
      apiClient: api as Parameters<typeof configureAuthStore>[0]['apiClient'],
    });
    useAuthStore().$patch({ user: { id: '1', email: 'a@t.com', role: 'SUPER_ADMIN', permissions: ['*'] }, token: 't' });
    __resetTaxOptionsCache();
    vi.clearAllMocks();
  });

  it('mounts TagPicker + CustomFieldsEditor with entity_type=booking_resource in edit mode', async () => {
    mockApiByUrl(mockResource);
    const wrapper = await mountForm('/admin/booking/resources/res-1/edit');
    await flushPromises();

    expect(wrapper.find('[data-testid="resource-tags-custom-fields"]').exists()).toBe(true);
    const tagPicker = wrapper.findComponent(TagPicker);
    expect(tagPicker.exists()).toBe(true);
    expect(tagPicker.props('entityType')).toBe('booking_resource');
    expect(tagPicker.props('entityId')).toBe('res-1');
    expect(wrapper.findComponent(CustomFieldsEditor).props('entityType')).toBe('booking_resource');
  });

  it('does not show the block in create mode', async () => {
    mockApiByUrl(null);
    const wrapper = await mountForm('/admin/booking/resources/new');
    await flushPromises();

    expect(wrapper.find('[data-testid="resource-tags-custom-fields"]').exists()).toBe(false);
  });
});
