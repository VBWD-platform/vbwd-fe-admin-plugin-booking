import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api';

export interface ResourceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  config: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
}

export interface BookableResource {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  resource_type: string;
  capacity: number;
  slot_duration_minutes: number | null;
  price: string;
  currency: string;
  price_unit: string;
  availability: Record<string, unknown>;
  custom_fields_schema: Array<Record<string, unknown>> | null;
  image_url: string | null;
  config: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export interface ResourceType {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

export const useResourceAdminStore = defineStore('resourceAdmin', () => {
  const resources = ref<BookableResource[]>([]);
  const currentResource = ref<BookableResource | null>(null);
  const categories = ref<ResourceCategory[]>([]);
  const resourceTypes = ref<ResourceType[]>([]);
  const loading = ref(false);

  // ── Resources ──────────────────────────────────────────────────────────

  async function fetchResources() {
    loading.value = true;
    try {
      const response = await api.get('/admin/booking/resources') as { resources: BookableResource[] };
      resources.value = response.resources;
    } finally {
      loading.value = false;
    }
  }

  async function fetchResourceDetail(resourceId: string) {
    loading.value = true;
    try {
      currentResource.value = await api.get(`/admin/booking/resources/${resourceId}`) as BookableResource;
    } finally {
      loading.value = false;
    }
  }

  async function createResource(data: Partial<BookableResource> & { category_ids?: string[] }) {
    const response = await api.post('/admin/booking/resources', data) as BookableResource;
    resources.value.push(response);
    return response;
  }

  async function updateResource(resourceId: string, data: Partial<BookableResource>) {
    const response = await api.put(`/admin/booking/resources/${resourceId}`, data) as BookableResource;
    currentResource.value = response;
    const index = resources.value.findIndex(resource => resource.id === resourceId);
    if (index !== -1) resources.value[index] = response;
    return response;
  }

  async function deleteResource(resourceId: string) {
    await api.delete(`/admin/booking/resources/${resourceId}`);
    resources.value = resources.value.filter(resource => resource.id !== resourceId);
  }

  // ── Categories ─────────────────────────────────────────────────────────

  async function fetchCategories() {
    const response = await api.get('/admin/booking/categories') as { categories: ResourceCategory[] };
    categories.value = response.categories;
  }

  async function createCategory(data: Partial<ResourceCategory>) {
    const response = await api.post('/admin/booking/categories', data) as ResourceCategory;
    categories.value.push(response);
    return response;
  }

  async function updateCategory(categoryId: string, data: Partial<ResourceCategory>) {
    const response = await api.put(`/admin/booking/categories/${categoryId}`, data) as ResourceCategory;
    const index = categories.value.findIndex(category => category.id === categoryId);
    if (index !== -1) categories.value[index] = response;
    return response;
  }

  async function deleteCategory(categoryId: string) {
    await api.delete(`/admin/booking/categories/${categoryId}`);
    categories.value = categories.value.filter(category => category.id !== categoryId);
  }

  // ── Resource Types ──────────────────────────────────────────────────

  async function fetchResourceTypes() {
    const response = await api.get('/admin/booking/resource-types') as { resource_types: ResourceType[] };
    resourceTypes.value = response.resource_types;
  }

  async function createResourceType(data: Partial<ResourceType>) {
    const response = await api.post('/admin/booking/resource-types', data) as ResourceType;
    resourceTypes.value.push(response);
    return response;
  }

  async function updateResourceType(typeId: string, data: Partial<ResourceType>) {
    const response = await api.put(`/admin/booking/resource-types/${typeId}`, data) as ResourceType;
    const index = resourceTypes.value.findIndex(resourceType => resourceType.id === typeId);
    if (index !== -1) resourceTypes.value[index] = response;
    return response;
  }

  async function deleteResourceType(typeId: string) {
    await api.delete(`/admin/booking/resource-types/${typeId}`);
    resourceTypes.value = resourceTypes.value.filter(resourceType => resourceType.id !== typeId);
  }

  return {
    resources,
    currentResource,
    categories,
    resourceTypes,
    loading,
    fetchResources,
    fetchResourceDetail,
    createResource,
    updateResource,
    deleteResource,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchResourceTypes,
    createResourceType,
    updateResourceType,
    deleteResourceType,
  };
});
