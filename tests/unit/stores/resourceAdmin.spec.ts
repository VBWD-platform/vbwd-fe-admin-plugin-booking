import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useResourceAdminStore } from '../../../booking/stores/resourceAdmin';

vi.mock('vbwd-view-component', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from 'vbwd-view-component';

describe('useResourceAdminStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetchResources populates resources array', async () => {
    const mockResources = [
      { id: '1', name: 'Dr. Smith', resource_type: 'specialist' },
      { id: '2', name: 'Room A', resource_type: 'space' },
    ];
    vi.mocked(api.get).mockResolvedValue({ resources: mockResources });

    const store = useResourceAdminStore();
    await store.fetchResources();

    expect(store.resources).toHaveLength(2);
    expect(store.resources[0].name).toBe('Dr. Smith');
  });

  it('createResource calls API and adds to array', async () => {
    const newResource = { id: '3', name: 'Yoga', resource_type: 'class' };
    vi.mocked(api.post).mockResolvedValue(newResource);

    const store = useResourceAdminStore();
    const result = await store.createResource({ name: 'Yoga', slug: 'yoga', resource_type: 'class', price: '15.00' });

    expect(api.post).toHaveBeenCalledWith('/admin/booking/resources', expect.objectContaining({ name: 'Yoga' }));
    expect(store.resources).toContainEqual(newResource);
    expect(result.name).toBe('Yoga');
  });

  it('updateResource calls API and updates in array', async () => {
    const updated = { id: '1', name: 'Dr. Smith Updated', resource_type: 'specialist' };
    vi.mocked(api.put).mockResolvedValue(updated);

    const store = useResourceAdminStore();
    store.resources = [{ id: '1', name: 'Dr. Smith', resource_type: 'specialist' } as never];

    await store.updateResource('1', { name: 'Dr. Smith Updated' });

    expect(store.resources[0].name).toBe('Dr. Smith Updated');
    expect(store.currentResource?.name).toBe('Dr. Smith Updated');
  });

  it('deleteResource removes from array', async () => {
    vi.mocked(api.delete).mockResolvedValue({});

    const store = useResourceAdminStore();
    store.resources = [
      { id: '1', name: 'A' } as never,
      { id: '2', name: 'B' } as never,
    ];

    await store.deleteResource('1');

    expect(store.resources).toHaveLength(1);
    expect(store.resources[0].id).toBe('2');
  });

  it('fetchCategories populates categories array', async () => {
    const mockCategories = [
      { id: '1', name: 'Medical', slug: 'medical' },
      { id: '2', name: 'Workspace', slug: 'workspace' },
    ];
    vi.mocked(api.get).mockResolvedValue({ categories: mockCategories });

    const store = useResourceAdminStore();
    await store.fetchCategories();

    expect(store.categories).toHaveLength(2);
  });

  it('createCategory adds to categories array', async () => {
    const newCategory = { id: '3', name: 'Events', slug: 'events' };
    vi.mocked(api.post).mockResolvedValue(newCategory);

    const store = useResourceAdminStore();
    await store.createCategory({ name: 'Events', slug: 'events' });

    expect(store.categories).toContainEqual(newCategory);
  });

  it('deleteCategory removes from array', async () => {
    vi.mocked(api.delete).mockResolvedValue({});

    const store = useResourceAdminStore();
    store.categories = [
      { id: '1', name: 'Medical', slug: 'medical' } as never,
      { id: '2', name: 'Workspace', slug: 'workspace' } as never,
    ];

    await store.deleteCategory('1');

    expect(store.categories).toHaveLength(1);
    expect(store.categories[0].id).toBe('2');
  });
});
