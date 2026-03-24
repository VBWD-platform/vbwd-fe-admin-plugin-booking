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

export interface SchemaField {
  id: string;
  label: string;
  type: 'string' | 'text' | 'integer' | 'boolean' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface CustomSchema {
  id: string;
  name: string;
  slug: string;
  fields: SchemaField[];
  sort_order: number;
  is_active: boolean;
}

export interface ResourceImage {
  id: string;
  resource_id: string;
  cms_image_id: string;
  url?: string;
  alt?: string;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface BookableResource {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  resource_type: string;
  resource_type_name: string;
  custom_schema_id: string | null;
  capacity: number;
  slot_duration_minutes: number | null;
  price: string;
  currency: string;
  price_unit: string;
  availability: Record<string, unknown>;
  custom_fields_schema: SchemaField[] | null;
  image_url: string | null;
  config: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export interface ScheduleSlot {
  start: string;
  end: string;
  status: 'available' | 'booked' | 'blocked';
  booking_id?: string;
  booking_status?: string;
  customer_name?: string;
  block_id?: string;
  reason?: string;
}

export interface ScheduleDay {
  date: string;
  closed: boolean;
  slots: ScheduleSlot[];
}

export const useResourceAdminStore = defineStore('resourceAdmin', () => {
  const resources = ref<BookableResource[]>([]);
  const currentResource = ref<BookableResource | null>(null);
  const categories = ref<ResourceCategory[]>([]);
  const schemas = ref<CustomSchema[]>([]);
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

  async function fetchCategory(categoryId: string) {
    return await api.get(`/admin/booking/categories/${categoryId}`) as ResourceCategory;
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

  // ── Schemas ────────────────────────────────────────────────────────────

  async function fetchSchemas() {
    const response = await api.get('/admin/booking/schemas') as { schemas: CustomSchema[] };
    schemas.value = response.schemas;
  }

  async function fetchSchema(schemaId: string) {
    return await api.get(`/admin/booking/schemas/${schemaId}`) as CustomSchema;
  }

  async function createSchema(data: Partial<CustomSchema>) {
    const response = await api.post('/admin/booking/schemas', data) as CustomSchema;
    schemas.value.push(response);
    return response;
  }

  async function updateSchema(schemaId: string, data: Partial<CustomSchema>) {
    const response = await api.put(`/admin/booking/schemas/${schemaId}`, data) as CustomSchema;
    const index = schemas.value.findIndex(schema => schema.id === schemaId);
    if (index !== -1) schemas.value[index] = response;
    return response;
  }

  async function deleteSchema(schemaId: string) {
    await api.delete(`/admin/booking/schemas/${schemaId}`);
    schemas.value = schemas.value.filter(schema => schema.id !== schemaId);
  }

  // ── Resource Images ───────────────────────────────────────────────────

  async function fetchResourceImages(resourceId: string) {
    const response = await api.get(`/admin/booking/resources/${resourceId}/images`) as { images: ResourceImage[] };
    return response.images;
  }

  async function uploadResourceImage(resourceId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return await api.post(`/admin/booking/resources/${resourceId}/images`, formData) as ResourceImage;
  }

  async function setResourceImagePrimary(resourceId: string, imageId: string) {
    await api.post(`/admin/booking/resources/${resourceId}/images/${imageId}/primary`, {});
  }

  async function reorderResourceImages(resourceId: string, imageIds: string[]) {
    await api.post(`/admin/booking/resources/${resourceId}/images/reorder`, { order: imageIds });
  }

  async function deleteResourceImage(resourceId: string, imageId: string) {
    await api.delete(`/admin/booking/resources/${resourceId}/images/${imageId}`);
  }

  // ── Schedule ──────────────────────────────────────────────────────────

  async function fetchSchedule(resourceId: string, dateFrom: string, dateTo: string): Promise<ScheduleDay[]> {
    const response = await api.get(`/admin/booking/resources/${resourceId}/schedule?date_from=${dateFrom}&date_to=${dateTo}`) as { days: ScheduleDay[] };
    return response.days;
  }

  async function blockSlot(resourceId: string, data: { date: string; start: string; end: string; reason?: string }) {
    return await api.post(`/admin/booking/resources/${resourceId}/block-slot`, data);
  }

  async function unblockSlot(resourceId: string, blockId: string) {
    await api.delete(`/admin/booking/resources/${resourceId}/block-slot/${blockId}`);
  }

  async function copySchedule(resourceId: string, targetResourceIds: string[]) {
    return await api.post(`/admin/booking/resources/${resourceId}/copy-schedule`, { target_resource_ids: targetResourceIds });
  }

  return {
    resources,
    currentResource,
    categories,
    schemas,
    loading,
    fetchResources,
    fetchResourceDetail,
    createResource,
    updateResource,
    deleteResource,
    fetchCategories,
    fetchCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchSchemas,
    fetchSchema,
    createSchema,
    updateSchema,
    deleteSchema,
    fetchResourceImages,
    uploadResourceImage,
    setResourceImagePrimary,
    reorderResourceImages,
    deleteResourceImage,
    fetchSchedule,
    blockSlot,
    unblockSlot,
    copySchedule,
  };
});
