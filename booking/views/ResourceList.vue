<template>
  <div class="plans-view">
    <div class="plans-header">
      <h2>Resources & Categories</h2>
    </div>

    <!-- Tabs (same as Plans page) -->
    <div class="tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'resources' }" @click="activeTab = 'resources'">Resources</button>
      <button class="tab-btn" :class="{ active: activeTab === 'categories' }" @click="activeTab = 'categories'">Categories</button>
      <button class="tab-btn" :class="{ active: activeTab === 'types' }" @click="activeTab = 'types'">Types</button>
    </div>

    <!-- Resources Tab -->
    <template v-if="activeTab === 'resources'">
      <div class="plans-subheader">
        <button class="create-btn" @click="createResource">+ New Resource</button>
      </div>
      <div class="plans-filters">
        <input v-model="searchQuery" type="text" placeholder="Search resources..." class="search-input">
      </div>

      <div v-if="store.loading" class="loading-state"><div class="spinner" /><p>Loading...</p></div>
      <div v-else-if="filteredResources.length === 0" class="empty-state">
        <p>No resources found.</p>
        <button class="create-btn" @click="createResource">Create first resource</button>
      </div>

      <div v-else class="plans-table-wrap">
        <table class="plans-table">
          <thead>
            <tr>
              <th class="sortable" @click="handleSort('name')">Name <span class="sort-indicator">{{ getSortIndicator('name') }}</span></th>
              <th>Type</th>
              <th class="sortable" @click="handleSort('capacity')">Capacity <span class="sort-indicator">{{ getSortIndicator('capacity') }}</span></th>
              <th class="sortable" @click="handleSort('price')">Price <span class="sort-indicator">{{ getSortIndicator('price') }}</span></th>
              <th>Categories</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="resource in sortedResources" :key="resource.id" class="plan-row" @click="editResource(resource.id)">
              <td>{{ resource.name }}</td>
              <td><span class="category-slug">{{ resource.resource_type }}</span></td>
              <td>{{ resource.capacity }}</td>
              <td>{{ resource.price }} {{ resource.currency }} / {{ resource.price_unit.replace('per_', '') }}</td>
              <td class="categories-cell">
                <span v-for="cat in (resource.categories || [])" :key="cat.id" class="category-slug">{{ cat.name }}</span>
                <span v-if="!resource.categories || resource.categories.length === 0" class="no-category">—</span>
              </td>
              <td>
                <span class="status-badge" :class="resource.is_active ? 'active' : 'inactive'" @click.stop="toggleActive(resource)">{{ resource.is_active ? 'Active' : 'Inactive' }}</span>
              </td>
              <td @click.stop><button class="action-btn archive" @click="editResource(resource.id)">Edit</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Categories Tab -->
    <template v-if="activeTab === 'categories'">
      <div v-if="store.categories.length" class="plans-table-wrap">
        <table class="plans-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Resources</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in store.categories" :key="category.id" class="plan-row">
              <td>{{ category.name }}</td>
              <td><span class="category-slug">{{ category.slug }}</span></td>
              <td>{{ category.description || '—' }}</td>
              <td>{{ countResourcesInCategory(category.id) }}</td>
              <td><span class="status-badge" :class="category.is_active ? 'active' : 'inactive'">{{ category.is_active ? 'Active' : 'Inactive' }}</span></td>
              <td @click.stop><button class="action-btn archive" @click="deleteCategory(category.id)">Delete</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state"><p>No categories yet.</p></div>

      <div class="add-form-section">
        <h3>Add Category</h3>
        <div class="add-form-row">
          <input v-model="newCategoryName" type="text" placeholder="Category name" class="search-input" @blur="generateSlug">
          <input v-model="newCategorySlug" type="text" placeholder="slug" class="search-input">
          <button class="create-btn" :disabled="!newCategoryName || !newCategorySlug" @click="createCategory">Add</button>
        </div>
      </div>
    </template>

    <!-- Types Tab -->
    <template v-if="activeTab === 'types'">
      <div v-if="store.resourceTypes.length" class="plans-table-wrap">
        <table class="plans-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Resources</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="resourceType in store.resourceTypes" :key="resourceType.id" class="plan-row">
              <td>{{ resourceType.name }}</td>
              <td><span class="category-slug">{{ resourceType.slug }}</span></td>
              <td>{{ countResourcesByType(resourceType.slug) }}</td>
              <td><span class="status-badge" :class="resourceType.is_active ? 'active' : 'inactive'">{{ resourceType.is_active ? 'Active' : 'Inactive' }}</span></td>
              <td @click.stop><button class="action-btn archive" @click="deleteResourceType(resourceType.id)">Delete</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state"><p>No resource types yet.</p></div>

      <div class="add-form-section">
        <h3>Add Type</h3>
        <div class="add-form-row">
          <input v-model="newTypeName" type="text" placeholder="Type name" class="search-input" @blur="generateTypeSlug">
          <input v-model="newTypeSlug" type="text" placeholder="slug" class="search-input">
          <button class="create-btn" :disabled="!newTypeName || !newTypeSlug" @click="createResourceType">Add</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useResourceAdminStore } from '../stores/resourceAdmin';

const router = useRouter();
const store = useResourceAdminStore();
const activeTab = ref<'resources' | 'categories' | 'types'>('resources');
const searchQuery = ref('');
type SortColumn = 'name' | 'capacity' | 'price' | null;
type SortDirection = 'asc' | 'desc';
const sortColumn = ref<SortColumn>(null);
const sortDirection = ref<SortDirection>('asc');
const newCategoryName = ref('');
const newCategorySlug = ref('');
const newTypeName = ref('');
const newTypeSlug = ref('');

onMounted(async () => { await Promise.all([store.fetchResources(), store.fetchCategories(), store.fetchResourceTypes()]); });

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
function createResource() { router.push('/admin/booking/resources/new'); }
async function toggleActive(resource: { id: string; is_active: boolean }) {
  await store.updateResource(resource.id, { is_active: !resource.is_active });
  await store.fetchResources();
}
function countResourcesInCategory(categoryId: string): number {
  return store.resources.filter(r => r.categories?.some(c => c.id === categoryId)).length;
}
async function deleteCategory(categoryId: string) {
  if (!confirm('Delete this category?')) return;
  await store.deleteCategory(categoryId);
}
function generateSlug() {
  newCategorySlug.value = newCategoryName.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
async function createCategory() {
  if (!newCategoryName.value || !newCategorySlug.value) return;
  await store.createCategory({ name: newCategoryName.value, slug: newCategorySlug.value });
  newCategoryName.value = '';
  newCategorySlug.value = '';
}
function countResourcesByType(typeSlug: string): number {
  return store.resources.filter(r => r.resource_type === typeSlug).length;
}
function generateTypeSlug() {
  newTypeSlug.value = newTypeName.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
async function createResourceType() {
  if (!newTypeName.value || !newTypeSlug.value) return;
  await store.createResourceType({ name: newTypeName.value, slug: newTypeSlug.value });
  newTypeName.value = '';
  newTypeSlug.value = '';
}
async function deleteResourceType(typeId: string) {
  if (!confirm('Delete this resource type?')) return;
  await store.deleteResourceType(typeId);
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
@media (max-width: 768px) {
  .plans-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .plans-table { min-width: 640px; }
  .plans-table th, .plans-table td { padding: 10px 10px; font-size: 0.85rem; }
  .add-form-row { flex-direction: column; }
}
</style>
