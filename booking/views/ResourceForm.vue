<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResourceAdminStore } from '../stores/resourceAdmin';

const route = useRoute();
const router = useRouter();
const store = useResourceAdminStore();

const isEdit = computed(() => route.params.id && route.params.id !== 'new');
const saving = ref(false);

const availableCategories = computed(() =>
  store.categories.filter(category => !form.value.category_ids.includes(category.id))
);
const assignedCategories = computed(() =>
  store.categories.filter(category => form.value.category_ids.includes(category.id))
);

function assignCategory(categoryId: string) {
  if (!form.value.category_ids.includes(categoryId)) {
    form.value.category_ids.push(categoryId);
  }
}
function unassignCategory(categoryId: string) {
  form.value.category_ids = form.value.category_ids.filter(id => id !== categoryId);
}

const form = ref({
  name: '',
  slug: '',
  description: '',
  resource_type: '',
  capacity: 1,
  slot_duration_minutes: 30 as number | null,
  price: '0.00',
  currency: 'EUR',
  price_unit: 'per_slot',
  is_active: true,
  sort_order: 0,
  category_ids: [] as string[],
});

onMounted(async () => {
  await Promise.all([store.fetchCategories(), store.fetchResourceTypes()]);
  if (isEdit.value) {
    await store.fetchResourceDetail(route.params.id as string);
    if (store.currentResource) {
      const resource = store.currentResource;
      form.value = {
        name: resource.name,
        slug: resource.slug,
        description: resource.description || '',
        resource_type: resource.resource_type,
        capacity: resource.capacity,
        slot_duration_minutes: resource.slot_duration_minutes,
        price: resource.price,
        currency: resource.currency,
        price_unit: resource.price_unit,
        is_active: resource.is_active,
        sort_order: resource.sort_order,
        category_ids: resource.categories.map(category => category.id),
      };
    }
  }
});

function generateSlug() {
  form.value.slug = form.value.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function save() {
  saving.value = true;
  try {
    if (isEdit.value) {
      await store.updateResource(route.params.id as string, form.value);
    } else {
      await store.createResource(form.value);
    }
    router.push('/admin/booking/resources');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="resource-form">
    <h1>{{ isEdit ? 'Edit Resource' : 'New Resource' }}</h1>

    <form @submit.prevent="save" class="resource-form__form">
      <div class="resource-form__grid">
        <div class="resource-form__field">
          <label>Name</label>
          <input v-model="form.name" @blur="!isEdit && generateSlug()" required />
        </div>

        <div class="resource-form__field">
          <label>Slug</label>
          <input v-model="form.slug" required />
        </div>

        <div class="resource-form__field">
          <label>Type</label>
          <select v-model="form.resource_type">
            <option v-for="resourceType in store.resourceTypes" :key="resourceType.slug" :value="resourceType.slug">{{ resourceType.name }}</option>
          </select>
        </div>

        <div class="resource-form__field">
          <label>Capacity</label>
          <input v-model.number="form.capacity" type="number" min="1" required />
        </div>

        <div class="resource-form__field">
          <label>Slot Duration (minutes)</label>
          <input v-model.number="form.slot_duration_minutes" type="number" min="1" placeholder="Leave empty for flexible (e.g. per night)" />
        </div>

        <div class="resource-form__field">
          <label>Price</label>
          <input v-model="form.price" type="number" step="0.01" min="0" required />
        </div>

        <div class="resource-form__field">
          <label>Currency</label>
          <input v-model="form.currency" maxlength="3" required />
        </div>

        <div class="resource-form__field">
          <label>Price Unit</label>
          <select v-model="form.price_unit">
            <option value="per_slot">Per Slot</option>
            <option value="per_hour">Per Hour</option>
            <option value="per_night">Per Night</option>
            <option value="per_seat">Per Seat</option>
          </select>
        </div>

        <div class="resource-form__field">
          <label>Sort Order</label>
          <input v-model.number="form.sort_order" type="number" />
        </div>

        <div class="resource-form__field">
          <label>
            <input v-model="form.is_active" type="checkbox" />
            Active
          </label>
        </div>
      </div>

      <div class="resource-form__field resource-form__field--full">
        <label>Description</label>
        <textarea v-model="form.description" rows="3"></textarea>
      </div>

      <div class="categories-section">
        <h3>Categories</h3>
        <div class="categories-panels">
          <div class="category-panel">
            <h4>Available</h4>
            <div class="category-list">
              <div
                v-for="category in availableCategories"
                :key="category.id"
                class="category-item"
              >
                <span>{{ category.name }}</span>
                <button type="button" class="assign-btn" @click="assignCategory(category.id)">+</button>
              </div>
              <p v-if="availableCategories.length === 0" class="empty-hint">All categories assigned</p>
            </div>
          </div>
          <div class="category-panel">
            <h4>Assigned</h4>
            <div class="category-list">
              <div
                v-for="category in assignedCategories"
                :key="category.id"
                class="category-item"
              >
                <span>{{ category.name }}</span>
                <button type="button" class="unassign-btn" @click="unassignCategory(category.id)">&times;</button>
              </div>
              <p v-if="assignedCategories.length === 0" class="empty-hint">No categories assigned</p>
            </div>
          </div>
        </div>
      </div>

      <div class="resource-form__actions">
        <button type="submit" :disabled="saving" class="btn btn--primary">
          {{ saving ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
        </button>
        <button type="button" @click="router.push('/admin/booking/resources')" class="btn btn--secondary">
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.resource-form__form {
  background: var(--vbwd-bg-card, #fff);
  border: 1px solid var(--vbwd-border, #e2e8f0);
  border-radius: var(--vbwd-radius, 8px);
  padding: 1.5rem;
}

.resource-form__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.resource-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.resource-form__field--full {
  margin-top: 1rem;
}

.resource-form__field label {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--vbwd-text-secondary, #64748b);
}

.resource-form__field input,
.resource-form__field select,
.resource-form__field textarea {
  padding: 0.5rem;
  border: 1px solid var(--vbwd-border, #e2e8f0);
  border-radius: var(--vbwd-radius, 4px);
  font-size: 0.9rem;
}

.categories-section {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #eee;
}

.categories-section h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.categories-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.category-panel h4 {
  margin: 0 0 10px 0;
  color: #555;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category-list {
  border: 1px solid #e9ecef;
  border-radius: 4px;
  min-height: 100px;
  max-height: 250px;
  overflow-y: auto;
  padding: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.category-item:hover {
  background: #f8f9fa;
}

.category-item span:first-child {
  flex: 1;
}

.assign-btn,
.unassign-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.assign-btn {
  background: #d4edda;
  color: #155724;
}

.assign-btn:hover {
  background: #c3e6cb;
}

.unassign-btn {
  background: #f8d7da;
  color: #721c24;
}

.unassign-btn:hover {
  background: #f5c6cb;
}

.empty-hint {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 20px 0;
}

.resource-form__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.btn { padding: 0.5rem 1rem; border-radius: 4px; border: none; cursor: pointer; font-weight: 500; }
.btn--primary { background: var(--vbwd-primary, #3498db); color: #fff; }
.btn--secondary { background: var(--vbwd-bg-secondary, #f1f5f9); color: var(--vbwd-text, #1e293b); }
</style>
