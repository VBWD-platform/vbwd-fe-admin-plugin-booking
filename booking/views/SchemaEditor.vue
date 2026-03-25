<template>
  <div class="plans-view">
    <div class="plans-header">
      <h2>{{ schema ? schema.name : $t('booking.schemaEditor.title') }}</h2>
    </div>

    <div
      v-if="loading"
      class="loading-state"
    >
      <div class="spinner" /><p>{{ $t('booking.common.loading') }}</p>
    </div>

    <template v-else-if="schema">
      <form
        class="resource-form__form"
        @submit.prevent="save"
      >
        <!-- Name & Slug -->
        <div class="resource-form__grid">
          <div class="resource-form__field">
            <label>{{ $t('booking.resourceForm.name') }}</label>
            <input
              v-model="schema.name"
              required
            >
          </div>
          <div class="resource-form__field">
            <label>{{ $t('booking.resourceForm.slug') }}</label>
            <input
              v-model="schema.slug"
              required
            >
          </div>
        </div>

        <!-- Fields editor -->
        <div class="schema-fields-section">
          <h3>{{ $t('booking.schemas.table.fields') }}</h3>

          <div
            v-if="schema.fields.length === 0"
            class="empty-state"
            style="padding: 20px;"
          >
            <p>{{ $t('booking.schemaEditor.noFieldsYet') }}</p>
          </div>

          <table
            v-else
            class="plans-table"
          >
            <thead>
              <tr>
                <th>{{ $t('booking.schemaEditor.table.label') }}</th>
                <th>{{ $t('booking.schemaEditor.table.id') }}</th>
                <th>{{ $t('booking.schemaEditor.table.type') }}</th>
                <th>{{ $t('booking.schemaEditor.table.required') }}</th>
                <th>{{ $t('booking.schemaEditor.table.options') }}</th>
                <th>{{ $t('booking.schemaEditor.table.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(field, index) in schema.fields"
                :key="index"
                class="plan-row"
              >
                <td>
                  <input
                    v-model="field.label"
                    class="inline-input"
                    :placeholder="$t('booking.schemaEditor.fieldLabel')"
                    @blur="autoGenerateFieldId(field)"
                  >
                </td>
                <td>
                  <span class="category-slug">{{ field.id }}</span>
                </td>
                <td>
                  <select
                    v-model="field.type"
                    class="inline-select"
                  >
                    <option value="string">
                      {{ $t('booking.schemaEditor.fieldTypes.string') }}
                    </option>
                    <option value="text">
                      {{ $t('booking.schemaEditor.fieldTypes.text') }}
                    </option>
                    <option value="integer">
                      {{ $t('booking.schemaEditor.fieldTypes.integer') }}
                    </option>
                    <option value="boolean">
                      {{ $t('booking.schemaEditor.fieldTypes.boolean') }}
                    </option>
                    <option value="select">
                      {{ $t('booking.schemaEditor.fieldTypes.select') }}
                    </option>
                  </select>
                </td>
                <td>
                  <input
                    v-model="field.required"
                    type="checkbox"
                  >
                </td>
                <td>
                  <input
                    v-if="field.type === 'select'"
                    :value="(field.options || []).join(', ')"
                    class="inline-input"
                    :placeholder="$t('booking.schemaEditor.optionsHint')"
                    @blur="parseOptions(field, $event)"
                  >
                  <span
                    v-else
                    class="no-category"
                  >—</span>
                </td>
                <td @click.stop>
                  <button
                    type="button"
                    class="action-btn delete"
                    @click="removeField(index)"
                  >
                    {{ $t('booking.schemaEditor.remove') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 15px;">
            <button
              type="button"
              class="create-btn"
              @click="addField"
            >
              {{ $t('booking.schemaEditor.addField') }}
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="resource-form__actions">
          <button
            type="submit"
            :disabled="saving"
            class="btn btn--primary"
          >
            {{ saving ? $t('booking.schemaEditor.saving') : $t('booking.schemaEditor.save') }}
          </button>
          <button
            type="button"
            class="btn btn--secondary"
            @click="router.push('/admin/booking/resources')"
          >
            {{ $t('booking.schemaEditor.cancel') }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResourceAdminStore, type SchemaField } from '../stores/resourceAdmin';

const route = useRoute();
const router = useRouter();
const store = useResourceAdminStore();

const schemaId = route.params.id as string;
const schema = ref<{ name: string; slug: string; fields: SchemaField[] } | null>(null);
const loading = ref(true);
const saving = ref(false);

onMounted(async () => {
  try {
    const data = await store.fetchSchema(schemaId);
    schema.value = {
      name: data.name,
      slug: data.slug,
      fields: (data.fields || []).map((field: SchemaField) => ({ ...field })),
    };
  } finally {
    loading.value = false;
  }
});

function addField() {
  if (!schema.value) return;
  schema.value.fields.push({
    id: '',
    label: '',
    type: 'string',
    required: false,
  });
}

function removeField(index: number) {
  if (!schema.value) return;
  schema.value.fields.splice(index, 1);
}

function autoGenerateFieldId(field: SchemaField) {
  if (!field.id && field.label) {
    field.id = field.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .replace(/-/g, '_');
  }
}

function parseOptions(field: SchemaField, event: Event) {
  const value = (event.target as HTMLInputElement).value;
  field.options = value.split(',').map(option => option.trim()).filter(Boolean);
}

async function save() {
  if (!schema.value) return;
  saving.value = true;
  try {
    await store.updateSchema(schemaId, {
      name: schema.value.name,
      slug: schema.value.slug,
      fields: schema.value.fields,
    });
    router.push('/admin/booking/resources');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.plans-view { background: white; padding: 20px; border-radius: 8px; }
.plans-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.plans-header h2 { margin: 0; color: #2c3e50; }
.loading-state, .empty-state { text-align: center; padding: 40px; color: #666; }
.spinner { width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.resource-form__form { background: var(--vbwd-bg-card, #fff); border: 1px solid var(--vbwd-border, #e2e8f0); border-radius: var(--vbwd-radius, 8px); padding: 1.5rem; }
.resource-form__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.resource-form__field { display: flex; flex-direction: column; gap: 0.25rem; }
.resource-form__field label { font-weight: 600; font-size: 0.85rem; color: var(--vbwd-text-secondary, #64748b); }
.resource-form__field input, .resource-form__field select { padding: 0.5rem; border: 1px solid var(--vbwd-border, #e2e8f0); border-radius: var(--vbwd-radius, 4px); font-size: 0.9rem; }
.resource-form__actions { display: flex; gap: 0.5rem; margin-top: 1.5rem; }
.btn { padding: 0.5rem 1rem; border-radius: 4px; border: none; cursor: pointer; font-weight: 500; }
.btn--primary { background: var(--vbwd-primary, #3498db); color: #fff; }
.btn--secondary { background: var(--vbwd-bg-secondary, #f1f5f9); color: var(--vbwd-text, #1e293b); }

.schema-fields-section { margin-top: 1.5rem; }
.schema-fields-section h3 { margin: 0 0 15px; color: #2c3e50; }

.plans-table { width: 100%; border-collapse: collapse; }
.plans-table th, .plans-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; }
.plans-table th { background: #f8f9fa; font-weight: 600; color: #2c3e50; font-size: 13px; }
.plan-row { transition: background-color 0.2s; }
.plan-row:hover { background-color: #f8f9fa; }

.inline-input { padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; width: 100%; }
.inline-input:focus { outline: none; border-color: #3498db; }
.inline-select { padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; }

.category-slug { display: inline-block; padding: 2px 7px; background: #e3f2fd; color: #1565c0; border-radius: 10px; font-size: 0.75rem; font-family: monospace; }
.no-category { color: #bbb; font-size: 0.85rem; }

.create-btn { padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; }
.create-btn:hover { background: #1e8449; }

.action-btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
.action-btn.delete { background: #f8d7da; color: #721c24; }
.action-btn.delete:hover { background: #f5c6cb; }

@media (max-width: 768px) {
  .plans-view { padding: 12px; border-radius: 0; }
  .plans-header h2 { font-size: 1.2rem; }
  .resource-form__form { padding: 1rem; }
  .resource-form__grid { grid-template-columns: 1fr; }
  .resource-form__actions { flex-direction: column; }
  .resource-form__actions .btn { width: 100%; text-align: center; }
  .plans-table { min-width: 500px; }
  .plans-table th, .plans-table td { padding: 8px 8px; font-size: 0.8rem; }
  .inline-input { font-size: 12px; padding: 5px 6px; }
  .inline-select { font-size: 12px; padding: 5px 6px; }
}

@media (max-width: 480px) {
  .plans-view { padding: 8px; }
  .resource-form__form { padding: 0.75rem; }
  .plans-table { min-width: 420px; }
  .plans-table th, .plans-table td { padding: 6px 4px; font-size: 0.75rem; }
  .action-btn { padding: 4px 8px; font-size: 11px; }
}
</style>
