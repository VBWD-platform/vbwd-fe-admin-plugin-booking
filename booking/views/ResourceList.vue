<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useResourceAdminStore } from '../stores/resourceAdmin';

const router = useRouter();
const store = useResourceAdminStore();

onMounted(() => {
  store.fetchResources();
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
</script>

<template>
  <div class="resource-list">
    <div class="resource-list__header">
      <h1>Resources</h1>
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
</template>

<style scoped>
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
}

.btn { padding: 0.5rem 1rem; border-radius: 4px; border: none; cursor: pointer; font-weight: 500; }
.btn--primary { background: var(--vbwd-primary, #3498db); color: #fff; }
.btn--small { padding: 0.25rem 0.5rem; font-size: 0.85rem; background: var(--vbwd-bg-secondary, #f1f5f9); }

.badge { padding: 0.2rem 0.5rem; border-radius: 4px; border: none; cursor: pointer; font-size: 0.85rem; }
.badge--active { background: #dcfce7; color: #166534; }
.badge--inactive { background: #fee2e2; color: #991b1b; }
</style>
