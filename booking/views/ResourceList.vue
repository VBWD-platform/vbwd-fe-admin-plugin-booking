<template>
  <div class="plans-view">
    <div class="plans-header">
      <h2>{{ $t('booking.resources.title') }}</h2>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'resources' }"
        @click="activeTab = 'resources'"
      >
        {{ $t('booking.resources.tabs.resources') }}
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'categories' }"
        @click="activeTab = 'categories'"
      >
        {{ $t('booking.resources.tabs.categories') }}
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'schemas' }"
        @click="activeTab = 'schemas'"
      >
        {{ $t('booking.resources.tabs.schemas') }}
      </button>
    </div>

    <p
      v-if="importMessage"
      class="import-toast"
    >
      {{ importMessage }}
    </p>

    <!-- Resources Tab -->
    <template v-if="activeTab === 'resources'">
      <div class="plans-subheader">
        <div class="export-import-actions">
          <label class="action-btn archive import-label">
            {{ $t('booking.resources.import') }}
            <input
              type="file"
              accept=".csv,.json"
              class="import-input"
              @change="importEntity('resources', $event)"
            >
          </label>
        </div>
        <button
          class="create-btn"
          @click="createResource"
        >
          {{ $t('booking.resources.newResource') }}
        </button>
      </div>

      <!-- Bulk action bar -->
      <div
        v-if="selectedResourceIds.size > 0"
        class="bulk-bar"
      >
        <span>{{ selectedResourceIds.size }} {{ $t('booking.resources.selected') }}</span>
        <button
          class="action-btn archive"
          @click="bulkExport('csv')"
        >
          {{ $t('booking.resources.exportCsv') }}
        </button>
        <button
          class="action-btn archive"
          @click="bulkExport('json')"
        >
          {{ $t('booking.resources.exportJson') }}
        </button>
        <button
          class="action-btn archive"
          @click="bulkSetActive(true)"
        >
          {{ $t('booking.resources.activate') }}
        </button>
        <button
          class="action-btn archive"
          @click="bulkSetActive(false)"
        >
          {{ $t('booking.resources.deactivate') }}
        </button>
        <button
          class="action-btn delete"
          @click="bulkDelete"
        >
          {{ $t('booking.common.delete') }}
        </button>
      </div>

      <div class="plans-filters">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('booking.resources.search')"
          class="search-input"
        >
      </div>

      <div
        v-if="store.loading"
        class="loading-state"
      >
        <div class="spinner" /><p>{{ $t('booking.common.loading') }}</p>
      </div>
      <div
        v-else-if="filteredResources.length === 0"
        class="empty-state"
      >
        <p>{{ $t('booking.resources.noResourcesFound') }}</p>
        <button
          class="create-btn"
          @click="createResource"
        >
          {{ $t('booking.resources.createFirst') }}
        </button>
      </div>

      <div
        v-else
        class="plans-table-wrap"
      >
        <table class="plans-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input
                  type="checkbox"
                  :checked="allResourcesSelected"
                  @change="toggleAllResources"
                >
              </th>
              <th
                class="sortable"
                @click="handleSort('name')"
              >
                {{ $t('booking.resources.table.name') }} <span class="sort-indicator">{{ getSortIndicator('name') }}</span>
              </th>
              <th>{{ $t('booking.resources.table.schema') }}</th>
              <th
                class="sortable"
                @click="handleSort('capacity')"
              >
                {{ $t('booking.resources.table.capacity') }} <span class="sort-indicator">{{ getSortIndicator('capacity') }}</span>
              </th>
              <th
                class="sortable"
                @click="handleSort('price')"
              >
                {{ $t('booking.resources.table.price') }} <span class="sort-indicator">{{ getSortIndicator('price') }}</span>
              </th>
              <th>{{ $t('booking.resources.table.categories') }}</th>
              <th>{{ $t('booking.resources.table.status') }}</th>
              <th>{{ $t('booking.resources.table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="resource in sortedResources"
              :key="resource.id"
              class="plan-row"
              @click="editResource(resource.id)"
            >
              <td
                class="checkbox-col"
                @click.stop
              >
                <input
                  type="checkbox"
                  :checked="selectedResourceIds.has(resource.id)"
                  @change="toggleResource(resource.id)"
                >
              </td>
              <td>{{ resource.name }}</td>
              <td><span class="category-slug">{{ resource.resource_type_name || resource.resource_type }}</span></td>
              <td>{{ resource.capacity }}</td>
              <td>{{ resource.price }} {{ resource.currency }} / {{ resource.price_unit.replace('per_', '') }}</td>
              <td class="categories-cell">
                <span
                  v-for="cat in (resource.categories || [])"
                  :key="cat.id"
                  class="category-slug"
                >{{ cat.name }}</span>
                <span
                  v-if="!resource.categories || resource.categories.length === 0"
                  class="no-category"
                >—</span>
              </td>
              <td>
                <span
                  class="status-badge"
                  :class="resource.is_active ? 'active' : 'inactive'"
                  @click.stop="toggleActive(resource)"
                >{{ resource.is_active ? $t('booking.common.active') : $t('booking.common.inactive') }}</span>
              </td>
              <td @click.stop>
                <button
                  class="action-btn archive"
                  @click="editResource(resource.id)"
                >
                  {{ $t('booking.common.edit') }}
                </button>
                <button
                  class="action-btn schedule-btn"
                  @click="openSchedule(resource.id)"
                >
                  {{ $t('booking.schedule.title') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Categories Tab -->
    <template v-if="activeTab === 'categories'">
      <div class="plans-subheader">
        <div class="export-import-actions">
          <button
            class="action-btn archive"
            @click="exportEntity('categories', 'csv')"
          >
            {{ $t('booking.resources.exportCsv') }}
          </button>
          <button
            class="action-btn archive"
            @click="exportEntity('categories', 'json')"
          >
            {{ $t('booking.resources.exportJson') }}
          </button>
          <label class="action-btn archive import-label">
            {{ $t('booking.resources.import') }}
            <input
              type="file"
              accept=".csv,.json"
              class="import-input"
              @change="importEntity('categories', $event)"
            >
          </label>
        </div>
      </div>
      <div
        v-if="store.categories.length"
        class="plans-table-wrap"
      >
        <table class="plans-table">
          <thead>
            <tr>
              <th>{{ $t('booking.categories.table.name') }}</th>
              <th>{{ $t('booking.categories.table.slug') }}</th>
              <th>{{ $t('booking.categories.table.description') }}</th>
              <th>{{ $t('booking.categories.table.resources') }}</th>
              <th>{{ $t('booking.categories.table.status') }}</th>
              <th>{{ $t('booking.categories.table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="category in store.categories"
              :key="category.id"
              class="plan-row"
              @click="editCategory(category.id)"
            >
              <td>{{ category.name }}</td>
              <td><span class="category-slug">{{ category.slug }}</span></td>
              <td>{{ category.description || '—' }}</td>
              <td>{{ countResourcesInCategory(category.id) }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="category.is_active ? 'active' : 'inactive'"
                >{{ category.is_active ? $t('booking.common.active') : $t('booking.common.inactive') }}</span>
              </td>
              <td @click.stop>
                <button
                  class="action-btn archive"
                  @click="editCategory(category.id)"
                >
                  {{ $t('booking.common.edit') }}
                </button>
                <button
                  class="action-btn delete"
                  @click="deleteCategory(category.id)"
                >
                  {{ $t('booking.common.delete') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-else
        class="empty-state"
      >
        <p>{{ $t('booking.categories.noCategoriesYet') }}</p>
      </div>

      <div class="add-form-section">
        <h3>{{ $t('booking.categories.addCategory') }}</h3>
        <div class="add-form-row">
          <input
            v-model="newCategoryName"
            type="text"
            :placeholder="$t('booking.categories.categoryName')"
            class="search-input"
            @blur="generateCategorySlug"
          >
          <input
            v-model="newCategorySlug"
            type="text"
            :placeholder="$t('booking.categories.slug')"
            class="search-input"
          >
          <button
            class="create-btn"
            :disabled="!newCategoryName || !newCategorySlug"
            @click="createCategory"
          >
            {{ $t('booking.common.add') }}
          </button>
        </div>
      </div>
    </template>

    <!-- Schemas Tab -->
    <template v-if="activeTab === 'schemas'">
      <div
        v-if="store.schemas.length"
        class="plans-table-wrap"
      >
        <table class="plans-table">
          <thead>
            <tr>
              <th>{{ $t('booking.schemas.table.name') }}</th>
              <th>{{ $t('booking.schemas.table.slug') }}</th>
              <th>{{ $t('booking.schemas.table.fields') }}</th>
              <th>{{ $t('booking.schemas.table.resources') }}</th>
              <th>{{ $t('booking.schemas.table.status') }}</th>
              <th>{{ $t('booking.schemas.table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="schema in store.schemas"
              :key="schema.id"
              class="plan-row"
              @click="editSchema(schema.id)"
            >
              <td>{{ schema.name }}</td>
              <td><span class="category-slug">{{ schema.slug }}</span></td>
              <td>{{ schema.fields.length }}</td>
              <td>{{ countResourcesBySchema(schema.slug) }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="schema.is_active ? 'active' : 'inactive'"
                >{{ schema.is_active ? $t('booking.common.active') : $t('booking.common.inactive') }}</span>
              </td>
              <td @click.stop>
                <button
                  class="action-btn archive"
                  @click="deleteSchema(schema.id)"
                >
                  {{ $t('booking.common.delete') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-else
        class="empty-state"
      >
        <p>{{ $t('booking.schemas.noSchemasYet') }}</p>
      </div>

      <div class="add-form-section">
        <h3>{{ $t('booking.schemas.addSchema') }}</h3>
        <div class="add-form-row">
          <input
            v-model="newSchemaName"
            type="text"
            :placeholder="$t('booking.schemas.schemaName')"
            class="search-input"
            @blur="generateSchemaSlug"
          >
          <input
            v-model="newSchemaSlug"
            type="text"
            :placeholder="$t('booking.schemas.slug')"
            class="search-input"
          >
          <button
            class="create-btn"
            :disabled="!newSchemaName || !newSchemaSlug"
            @click="createSchema"
          >
            {{ $t('booking.common.add') }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useResourceAdminStore } from '../stores/resourceAdmin';
import { api } from '@/api';

const router = useRouter();
const importMessage = ref('');
const store = useResourceAdminStore();
const activeTab = ref<'resources' | 'categories' | 'schemas'>('resources');
const searchQuery = ref('');
const selectedResourceIds = reactive(new Set<string>());
type SortColumn = 'name' | 'capacity' | 'price' | null;
type SortDirection = 'asc' | 'desc';
const sortColumn = ref<SortColumn>(null);
const sortDirection = ref<SortDirection>('asc');
const newCategoryName = ref('');
const newCategorySlug = ref('');
const newSchemaName = ref('');
const newSchemaSlug = ref('');

onMounted(async () => { await Promise.all([store.fetchResources(), store.fetchCategories(), store.fetchSchemas()]); });

const filteredResources = computed(() => {
  if (!searchQuery.value.trim()) return store.resources;
  const query = searchQuery.value.toLowerCase();
  return store.resources.filter(r => r.name?.toLowerCase().includes(query) || r.resource_type?.toLowerCase().includes(query));
});

const sortedResources = computed(() => {
  const filtered = filteredResources.value;
  if (!sortColumn.value) return filtered;
  return [...filtered].sort((a, b) => {
    let comparison = 0;
    switch (sortColumn.value) {
      case 'name': comparison = (a.name || '').localeCompare(b.name || ''); break;
      case 'capacity': comparison = (a.capacity || 0) - (b.capacity || 0); break;
      case 'price': comparison = parseFloat(a.price || '0') - parseFloat(b.price || '0'); break;
    }
    return sortDirection.value === 'asc' ? comparison : -comparison;
  });
});

function handleSort(column: SortColumn): void {
  if (sortColumn.value === column) { sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'; }
  else { sortColumn.value = column; sortDirection.value = 'asc'; }
}
function getSortIndicator(column: SortColumn): string {
  if (sortColumn.value !== column) return '';
  return sortDirection.value === 'asc' ? '▲' : '▼';
}
function editResource(resourceId: string) { router.push(`/admin/booking/resources/${resourceId}`); }
function openSchedule(resourceId: string) { router.push(`/admin/booking/resources/${resourceId}/schedule`); }
function createResource() { router.push('/admin/booking/resources/new'); }
async function toggleActive(resource: { id: string; is_active: boolean }) {
  await store.updateResource(resource.id, { is_active: !resource.is_active });
  await store.fetchResources();
}

// Categories
function editCategory(categoryId: string) {
  router.push(`/admin/booking/categories/${categoryId}`);
}
function countResourcesInCategory(categoryId: string): number {
  return store.resources.filter(r => r.categories?.some(c => c.id === categoryId)).length;
}
async function deleteCategory(categoryId: string) {
  if (!confirm('Delete this category?')) return;
  await store.deleteCategory(categoryId);
}
function generateCategorySlug() {
  newCategorySlug.value = newCategoryName.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
async function createCategory() {
  if (!newCategoryName.value || !newCategorySlug.value) return;
  await store.createCategory({ name: newCategoryName.value, slug: newCategorySlug.value });
  newCategoryName.value = '';
  newCategorySlug.value = '';
}

// Schemas
function countResourcesBySchema(schemaSlug: string): number {
  return store.resources.filter(r => r.resource_type === schemaSlug).length;
}
function editSchema(schemaId: string) {
  router.push(`/admin/booking/schemas/${schemaId}`);
}
async function deleteSchema(schemaId: string) {
  if (!confirm('Delete this schema?')) return;
  await store.deleteSchema(schemaId);
}
function generateSchemaSlug() {
  newSchemaSlug.value = newSchemaName.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
async function createSchema() {
  if (!newSchemaName.value || !newSchemaSlug.value) return;
  await store.createSchema({ name: newSchemaName.value, slug: newSchemaSlug.value, fields: [] });
  newSchemaName.value = '';
  newSchemaSlug.value = '';
}

// Bulk operations for resources
const allResourcesSelected = computed(() =>
  sortedResources.value.length > 0 && sortedResources.value.every(r => selectedResourceIds.has(r.id))
);

function toggleAllResources() {
  if (allResourcesSelected.value) sortedResources.value.forEach(r => selectedResourceIds.delete(r.id));
  else sortedResources.value.forEach(r => selectedResourceIds.add(r.id));
}

function toggleResource(resourceId: string) {
  if (selectedResourceIds.has(resourceId)) selectedResourceIds.delete(resourceId);
  else selectedResourceIds.add(resourceId);
}

async function bulkSetActive(active: boolean) {
  const ids = [...selectedResourceIds];
  await Promise.all(ids.map(id => store.updateResource(id, { is_active: active })));
  selectedResourceIds.clear();
  await store.fetchResources();
}

async function bulkDelete() {
  if (!confirm(`Delete ${selectedResourceIds.size} resource(s)?`)) return;
  const ids = [...selectedResourceIds];
  await Promise.all(ids.map(id => store.deleteResource(id)));
  selectedResourceIds.clear();
}

function bulkExport(format: string) {
  if (format === 'json') {
    const rows = store.resources.filter(r => selectedResourceIds.has(r.id));
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `resources.${format}`;
    a.click();
    URL.revokeObjectURL(a.href);
  } else {
    exportEntity('resources', format);
  }
}

// Export / Import
function exportEntity(entity: string, format: string) {
  const token = localStorage.getItem('admin_token');
  const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
  window.open(`${baseUrl}/admin/booking/export/${entity}?format=${format}&token=${token}`, '_blank');
}

async function importEntity(entity: string, event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const formData = new FormData();
  formData.append('file', input.files[0]);

  try {
    const response = await api.post(`/admin/booking/import/${entity}`, formData) as { created: number; updated: number; errors: string[] };
    importMessage.value = `Imported: ${response.created} created, ${response.updated} updated`;
    if (response.errors?.length) {
      importMessage.value += ` (${response.errors.length} errors)`;
    }
    // Refresh data
    await Promise.all([store.fetchResources(), store.fetchCategories()]);
  } catch (error) {
    importMessage.value = error instanceof Error ? error.message : 'Import failed';
  } finally {
    input.value = '';
    setTimeout(() => { importMessage.value = ''; }, 5000);
  }
}
</script>

<style scoped>
.plans-view { background: white; padding: 20px; border-radius: 8px; }
.plans-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.plans-header h2 { margin: 0; color: #2c3e50; }
.tabs { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 2px solid #e9ecef; }
.tab-btn { padding: 10px 20px; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; font-size: 14px; font-weight: 500; color: #666; transition: color 0.2s, border-color 0.2s; }
.tab-btn:hover { color: #2c3e50; }
.tab-btn.active { color: #3498db; border-bottom-color: #3498db; }
.plans-subheader { display: flex; justify-content: flex-end; margin-bottom: 15px; }
.create-btn { padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; }
.create-btn:hover { background: #1e8449; }
.create-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.plans-filters { display: flex; gap: 15px; align-items: center; margin-bottom: 20px; }
.search-input { flex: 1; max-width: 300px; padding: 10px 15px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
.search-input:focus { outline: none; border-color: #3498db; }
.loading-state, .empty-state { text-align: center; padding: 40px; color: #666; }
.spinner { width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.plans-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.plans-table { width: 100%; border-collapse: collapse; }
.plans-table th, .plans-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; }
.plans-table th { background: #f8f9fa; font-weight: 600; color: #2c3e50; }
.plans-table th.sortable { cursor: pointer; user-select: none; transition: background-color 0.2s; }
.plans-table th.sortable:hover { background: #e9ecef; }
.sort-indicator { margin-left: 5px; font-size: 0.75rem; color: #3498db; }
.plan-row { cursor: pointer; transition: background-color 0.2s; }
.plan-row:hover { background-color: #f8f9fa; }
.status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 500; cursor: pointer; }
.status-badge.active { background: #d4edda; color: #155724; }
.status-badge.inactive { background: #f8d7da; color: #721c24; }
.action-btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
.action-btn.archive { background: #ffc107; color: #212529; }
.action-btn.archive:hover { background: #e0a800; }
.categories-cell { max-width: 200px; }
.category-slug { display: inline-block; padding: 2px 7px; margin: 2px 2px 2px 0; background: #e3f2fd; color: #1565c0; border-radius: 10px; font-size: 0.75rem; font-family: monospace; white-space: nowrap; }
.no-category { color: #bbb; font-size: 0.85rem; }
.add-form-section { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; }
.add-form-section h3 { margin: 0 0 15px; color: #2c3e50; }
.add-form-row { display: flex; gap: 10px; align-items: center; }
.add-form-row .search-input { max-width: none; }
.export-import-actions { display: flex; gap: 6px; align-items: center; }
.import-label { position: relative; cursor: pointer; }
.import-input { position: absolute; opacity: 0; width: 0; height: 0; overflow: hidden; }
.import-toast { padding: 10px 16px; border-radius: 6px; font-size: 13px; margin-bottom: 12px; background: #d1fae5; color: #065f46; }
.action-btn.delete { background: #f8d7da; color: #721c24; margin-left: 4px; }
.action-btn.delete:hover { background: #f5c6cb; }
.schedule-btn { background: #3498db; color: white; margin-left: 4px; }
.schedule-btn:hover { background: #2980b9; }
.bulk-bar { display: flex; align-items: center; gap: 10px; padding: 10px 15px; margin-bottom: 15px; background: #e3f2fd; border-radius: 6px; border: 1px solid #bbdefb; }
.bulk-bar span { font-weight: 600; color: #1565c0; font-size: 0.9rem; margin-right: 5px; }
.checkbox-col { width: 40px; text-align: center; }
.checkbox-col input[type="checkbox"] { cursor: pointer; }

/* ── Tablet ───────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .plans-subheader { flex-direction: column; align-items: stretch; gap: 10px; }
  .export-import-actions { justify-content: flex-start; flex-wrap: wrap; }
}

/* ── Mobile ───────────────────────────────────────────────── */
@media (max-width: 768px) {
  .plans-view { padding: 12px; border-radius: 0; }
  .plans-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .plans-header h2 { font-size: 1.2rem; }

  .tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .tab-btn { padding: 8px 14px; font-size: 13px; white-space: nowrap; }

  .plans-subheader { flex-direction: column; align-items: stretch; gap: 8px; }
  .create-btn { width: 100%; text-align: center; }
  .export-import-actions { flex-wrap: wrap; }

  .plans-filters { flex-direction: column; align-items: stretch; }
  .search-input { max-width: none; }

  .plans-table { min-width: 580px; }
  .plans-table th, .plans-table td { padding: 8px 8px; font-size: 0.8rem; }

  .add-form-row { flex-direction: column; }
  .add-form-row .search-input { width: 100%; }
  .add-form-row .create-btn { width: 100%; }

  .import-toast { font-size: 12px; padding: 8px 12px; }
}

/* ── Small phones ─────────────────────────────────────────── */
@media (max-width: 480px) {
  .plans-view { padding: 8px; }
  .plans-header h2 { font-size: 1.1rem; }
  .tab-btn { padding: 6px 10px; font-size: 12px; }
  .plans-table { min-width: 480px; }
  .plans-table th, .plans-table td { padding: 6px 6px; font-size: 0.75rem; }
  .status-badge { padding: 2px 6px; font-size: 0.7rem; }
  .action-btn { padding: 4px 8px; font-size: 11px; }
  .category-slug { font-size: 0.65rem; padding: 1px 5px; }
}
</style>
