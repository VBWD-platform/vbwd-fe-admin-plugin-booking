<template>
  <div class="plans-view">
    <div class="plans-header">
      <h2>{{ category ? category.name : $t('booking.categoryEditor.editCategory') }}</h2>
    </div>

    <div v-if="loading" class="loading-state"><div class="spinner" /><p>{{ $t('booking.common.loading') }}</p></div>

    <template v-else-if="category">
      <form class="resource-form__form" @submit.prevent="save">
        <div class="resource-form__grid">
          <div class="resource-form__field">
            <label>{{ $t('booking.categoryEditor.name') }}</label>
            <input v-model="category.name" required />
          </div>
          <div class="resource-form__field">
            <label>{{ $t('booking.categoryEditor.slug') }}</label>
            <input v-model="category.slug" required />
          </div>
        </div>

        <div class="resource-form__field resource-form__field--full">
          <label>{{ $t('booking.categoryEditor.description') }}</label>
          <textarea v-model="category.description" rows="3"></textarea>
        </div>

        <div class="resource-form__grid">
          <div class="resource-form__field">
            <label>{{ $t('booking.categoryEditor.imageUrl') }}</label>
            <input v-model="category.image_url" placeholder="https://..." />
          </div>
          <div class="resource-form__field">
            <label>{{ $t('booking.categoryEditor.sortOrder') }}</label>
            <input v-model.number="category.sort_order" type="number" />
          </div>
          <div class="resource-form__field">
            <label>
              <input v-model="category.is_active" type="checkbox" />
              {{ $t('booking.categoryEditor.active') }}
            </label>
          </div>
        </div>

        <div class="resource-form__actions">
          <button type="submit" :disabled="saving" class="btn btn--primary">
            {{ saving ? $t('booking.categoryEditor.saving') : $t('booking.categoryEditor.save') }}
          </button>
          <button type="button" class="btn btn--secondary" @click="goBack">
            {{ $t('booking.categoryEditor.cancel') }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResourceAdminStore, type ResourceCategory } from '../stores/resourceAdmin';

const route = useRoute();
const router = useRouter();
const store = useResourceAdminStore();

const categoryId = route.params.id as string;
const category = ref<Partial<ResourceCategory> | null>(null);
const loading = ref(true);
const saving = ref(false);

onMounted(async () => {
  try {
    const data = await store.fetchCategory(categoryId);
    category.value = { ...data };
  } finally {
    loading.value = false;
  }
});

async function save() {
  if (!category.value) return;
  saving.value = true;
  try {
    await store.updateCategory(categoryId, category.value);
    goBack();
  } finally {
    saving.value = false;
  }
}

function goBack() {
  router.push('/admin/booking/resources');
}
</script>

<style scoped>
.plans-view { background: white; padding: 20px; border-radius: 8px; }
.plans-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.plans-header h2 { margin: 0; color: #2c3e50; }
.loading-state { text-align: center; padding: 40px; color: #666; }
.spinner { width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.resource-form__form { background: var(--vbwd-bg-card, #fff); border: 1px solid var(--vbwd-border, #e2e8f0); border-radius: var(--vbwd-radius, 8px); padding: 1.5rem; }
.resource-form__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
.resource-form__field { display: flex; flex-direction: column; gap: 0.25rem; }
.resource-form__field--full { margin-top: 1rem; }
.resource-form__field label { font-weight: 600; font-size: 0.85rem; color: var(--vbwd-text-secondary, #64748b); }
.resource-form__field input,
.resource-form__field textarea { padding: 0.5rem; border: 1px solid var(--vbwd-border, #e2e8f0); border-radius: var(--vbwd-radius, 4px); font-size: 0.9rem; }
.resource-form__actions { display: flex; gap: 0.5rem; margin-top: 1.5rem; }
.btn { padding: 0.5rem 1rem; border-radius: 4px; border: none; cursor: pointer; font-weight: 500; }
.btn--primary { background: var(--vbwd-primary, #3498db); color: #fff; }
.btn--secondary { background: var(--vbwd-bg-secondary, #f1f5f9); color: var(--vbwd-text, #1e293b); }

@media (max-width: 768px) {
  .plans-view { padding: 12px; border-radius: 0; }
  .plans-header h2 { font-size: 1.2rem; }
  .resource-form__form { padding: 1rem; }
  .resource-form__grid { grid-template-columns: 1fr; }
  .resource-form__actions { flex-direction: column; }
  .resource-form__actions .btn { width: 100%; text-align: center; }
}

@media (max-width: 480px) {
  .plans-view { padding: 8px; }
  .resource-form__form { padding: 0.75rem; }
  .resource-form__field label { font-size: 0.8rem; }
  .resource-form__field input,
  .resource-form__field textarea { font-size: 0.85rem; padding: 0.4rem; }
}
</style>
