<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useResourceAdminStore } from '../stores/resourceAdmin';

const router = useRouter();
const store = useResourceAdminStore();
const activeTab = ref<'resources' | 'categories'>('resources');

onMounted(async () => {
  await Promise.all([store.fetchResources(), store.fetchCategories()]);
});

function editResource(resourceId: string) {
  router.push(`/admin/booking/resources/${resourceId}`);
}

function createResource() {
  router.push('/admin/booking/resources/new');
}

async function toggleActive(resource: { id: string; is_active: boolean }) {
  await store.updateResource(resource.id, { is_active: !resource.is_active });
  await store.fetchResources();
}

async function deleteCategory(categoryId: string) {
  if (!confirm('Delete this category?')) return;
  await store.deleteCategory(categoryId);
}

const newCategoryName = ref('');
const newCategorySlug = ref('');

async function createCategory() {
  if (!newCategoryName.value || !newCategorySlug.value) return;
  await store.createCategory({
    name: newCategoryName.value,
    slug: newCategorySlug.value,
  });
  newCategoryName.value = '';
  newCategorySlug.value = '';
}

function generateSlug() {
  newCategorySlug.value = newCategoryName.value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
</script>

<template>
  <div class="resource-list">
    <h1>Resources & Categories</h1>

    <!-- Tabs -->
    <div class="resource-list__tabs">
      <button
        :class="['resource-list__tab', { active: activeTab === 'resources' }]"
        @click="activeTab = 'resources'"
      >
        Resources ({{ store.resources.length }})
      </button>
      <button
        :class="['resource-list__tab', { active: activeTab === 'categories' }]"
        @click="activeTab = 'categories'"
      >
        Categories ({{ store.categories.length }})
      </button>
    </div>

    <!-- Resources Tab -->
    <div v-if="activeTab === 'resources'">
      <div class="resource-list__header">
        <span></span>
        <button @click="createResource" class="btn btn--primary">+ New Resource</button>
      </div>

      <div v-if="store.loading">Loading...</div>

      <table v-else-if="store.resources.length" class="resource-list__table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Capacity</th>
            <th>Price</th>
            <th>Categories</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="resource in store.resources" :key="resource.id">
            <td>
              <a @click.prevent="editResource(resource.id)" href="#" class="resource-list__link">
                {{ resource.name }}
              </a>
            </td>
            <td>
              <span class="resource-list__type-badge">{{ resource.resource_type }}</span>
            </td>
            <td>{{ resource.capacity }}</td>
            <td>{{ resource.price }} {{ resource.currency }} / {{ resource.price_unit }}</td>
            <td>
              <span
                v-for="cat in resource.categories"
                :key="cat.id"
                class="resource-list__category-chip"
              >
                {{ cat.name }}
              </span>
              <span v-if="!resource.categories?.length" class="resource-list__no-category">—</span>
            </td>
            <td>
              <button
                @click="toggleActive(resource)"
                :class="resource.is_active ? 'badge badge--active' : 'badge badge--inactive'"
              >
                {{ resource.is_active ? 'Active' : 'Inactive' }}
              </button>
            </td>
            <td>
              <button @click="editResource(resource.id)" class="btn btn--small">Edit</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else>No resources yet. Click "New Resource" to create one.</p>
    </div>

    <!-- Categories Tab -->
    <div v-if="activeTab === 'categories'">
      <div class="resource-list__header">
        <span></span>
      </div>

      <table v-if="store.categories.length" class="resource-list__table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Description</th>
            <th>Resources</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in store.categories" :key="category.id">
            <td>{{ category.name }}</td>
            <td><code>{{ category.slug }}</code></td>
            <td>{{ category.description || '—' }}</td>
            <td>{{ store.resources.filter(r => r.categories?.some((c: { id: string }) => c.id === category.id)).length }}</td>
            <td>
              <span :class="category.is_active ? 'badge badge--active' : 'badge badge--inactive'">
                {{ category.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <button @click="deleteCategory(category.id)" class="btn btn--small btn--danger">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else>No categories yet.</p>

      <!-- Quick add category form -->
      <div class="resource-list__add-category">
        <h3>Add Category</h3>
        <div class="resource-list__add-form">
          <input
            v-model="newCategoryName"
            @blur="generateSlug"
            placeholder="Category name"
            class="resource-list__input"
          />
          <input
            v-model="newCategorySlug"
            placeholder="slug"
            class="resource-list__input"
          />
          <button
            @click="createCategory"
            :disabled="!newCategoryName || !newCategorySlug"
            class="btn btn--primary"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resource-list__tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--vbwd-border, #e2e8f0);
}

.resource-list__tab {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  color: var(--vbwd-text-secondary, #64748b);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.resource-list__tab.active {
  color: var(--vbwd-primary, #3498db);
  border-bottom-color: var(--vbwd-primary, #3498db);
}

.resource-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.resource-list__table {
  width: 100%;
  border-collapse: collapse;
}

.resource-list__table th,
.resource-list__table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--vbwd-border, #e2e8f0);
  text-align: left;
}

.resource-list__link {
  color: var(--vbwd-primary, #3498db);
  text-decoration: none;
  cursor: pointer;
}

.resource-list__type-badge {
  background: var(--vbwd-bg-secondary, #f1f5f9);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.resource-list__category-chip {
  background: var(--vbwd-bg-secondary, #f1f5f9);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  margin-right: 0.25rem;
}

.resource-list__no-category {
  color: var(--vbwd-text-secondary, #94a3b8);
}

.resource-list__add-category {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--vbwd-bg-card, #fff);
  border: 1px solid var(--vbwd-border, #e2e8f0);
  border-radius: var(--vbwd-radius, 8px);
}

.resource-list__add-form {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.resource-list__input {
  padding: 0.5rem;
  border: 1px solid var(--vbwd-border, #e2e8f0);
  border-radius: var(--vbwd-radius, 4px);
  flex: 1;
}

.btn { padding: 0.5rem 1rem; border-radius: 4px; border: none; cursor: pointer; font-weight: 500; }
.btn--primary { background: var(--vbwd-primary, #3498db); color: #fff; }
.btn--small { padding: 0.25rem 0.5rem; font-size: 0.85rem; background: var(--vbwd-bg-secondary, #f1f5f9); }
.btn--danger { background: #fee2e2; color: #991b1b; }

.badge { padding: 0.2rem 0.5rem; border-radius: 4px; border: none; font-size: 0.85rem; }
.badge--active { background: #dcfce7; color: #166534; }
.badge--inactive { background: #fee2e2; color: #991b1b; }

code {
  background: var(--vbwd-bg-secondary, #f1f5f9);
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.85rem;
}
</style>
