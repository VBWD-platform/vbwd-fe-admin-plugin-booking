<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResourceAdminStore } from '../stores/resourceAdmin';

const route = useRoute();
const router = useRouter();
const store = useResourceAdminStore();

const isEdit = computed(() => route.params.id && route.params.id !== 'new');
const saving = ref(false);

const form = ref({
  name: '',
  slug: '',
  description: '',
  resource_type: 'specialist',
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
  await store.fetchCategories();
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
            <option value="specialist">Specialist</option>
            <option value="room">Room</option>
            <option value="space">Space</option>
            <option value="seat">Seat</option>
            <option value="class">Class</option>
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

      <div class="resource-form__field resource-form__field--full">
        <label>Categories</label>
        <div class="resource-form__categories">
          <label v-for="category in store.categories" :key="category.id" class="resource-form__category-checkbox">
            <input
              type="checkbox"
              :value="category.id"
              v-model="form.category_ids"
            />
            {{ category.name }}
          </label>
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

.resource-form__categories {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.resource-form__category-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: normal;
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
