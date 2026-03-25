<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBookingAdminStore } from '../stores/bookingAdmin';

const route = useRoute();
const router = useRouter();
const store = useBookingAdminStore();
const cancelReason = ref('');
const showCancelByProvider = ref(false);

const bookingId = route.params.id as string;

onMounted(() => {
  store.fetchBookingDetail(bookingId);
});

async function confirmBooking() {
  await store.updateBookingStatus(bookingId, 'confirmed');
}

async function completeBooking() {
  await store.updateBookingStatus(bookingId, 'completed');
}

async function markNoShow() {
  await store.updateBookingStatus(bookingId, 'no_show');
}

async function cancelBooking() {
  await store.updateBookingStatus(bookingId, 'cancelled');
}

async function cancelByProvider() {
  if (!cancelReason.value.trim()) return;
  await store.updateBookingStatus(bookingId, 'cancelled', `[Provider cancelled] ${cancelReason.value}`);
  showCancelByProvider.value = false;
  cancelReason.value = '';
}

function goBack() {
  router.push('/admin/booking/list');
}
</script>

<template>
  <div class="plans-view">
    <div class="plans-header">
      <div class="header-left">
        <button
          class="back-btn"
          @click="goBack"
        >
          &larr;
        </button>
        <h2>{{ $t('booking.bookingDetail.title') }}</h2>
        <span
          v-if="store.currentBooking"
          class="status-badge"
          :class="store.currentBooking.status"
        >{{ store.currentBooking.status }}</span>
      </div>
    </div>

    <div
      v-if="store.loading"
      class="loading-state"
    >
      <div class="spinner" /><p>{{ $t('booking.common.loading') }}</p>
    </div>

    <template v-else-if="store.currentBooking">
      <div class="booking-detail__card">
        <div class="booking-detail__grid">
          <div class="booking-detail__field">
            <label>{{ $t('booking.bookingDetail.customer') }}</label>
            <span>{{ store.currentBooking.customer_name || store.currentBooking.customer_email || store.currentBooking.user_id }}</span>
          </div>
          <div class="booking-detail__field">
            <label>{{ $t('booking.bookingDetail.email') }}</label>
            <span>{{ store.currentBooking.customer_email }}</span>
          </div>
          <div
            v-if="store.currentBooking.customer_phone"
            class="booking-detail__field"
          >
            <label>{{ $t('booking.bookingDetail.phone') }}</label>
            <span>{{ store.currentBooking.customer_phone }}</span>
          </div>
          <div
            v-if="store.currentBooking.customer_company"
            class="booking-detail__field"
          >
            <label>{{ $t('booking.bookingDetail.company') }}</label>
            <span>{{ store.currentBooking.customer_company }}</span>
          </div>
          <div class="booking-detail__field">
            <label>{{ $t('booking.bookingDetail.resource') }}</label>
            <span>{{ store.currentBooking.resource?.name || $t('booking.dashboard.unknown') }}</span>
          </div>
          <div class="booking-detail__field">
            <label>{{ $t('booking.bookingDetail.status') }}</label>
            <span :class="`booking-status booking-status--${store.currentBooking.status}`">
              {{ store.currentBooking.status }}
            </span>
          </div>
          <div class="booking-detail__field">
            <label>{{ $t('booking.bookingDetail.start') }}</label>
            <span>{{ new Date(store.currentBooking.start_at).toLocaleString() }}</span>
          </div>
          <div class="booking-detail__field">
            <label>{{ $t('booking.bookingDetail.end') }}</label>
            <span>{{ new Date(store.currentBooking.end_at).toLocaleString() }}</span>
          </div>
          <div class="booking-detail__field">
            <label>{{ $t('booking.bookingDetail.quantity') }}</label>
            <span>{{ store.currentBooking.quantity }}</span>
          </div>
          <div
            v-if="store.currentBooking.invoice_id"
            class="booking-detail__field"
          >
            <label>{{ $t('booking.bookingDetail.invoice') }}</label>
            <router-link :to="`/admin/invoices/${store.currentBooking.invoice_id}`">
              {{ $t('booking.bookingDetail.viewInvoice') }}
            </router-link>
          </div>
        </div>

        <div
          v-if="store.currentBooking.custom_fields && Object.keys(store.currentBooking.custom_fields).length"
          class="booking-detail__section"
        >
          <h3>{{ $t('booking.bookingDetail.customFields') }}</h3>
          <div
            v-for="(value, key) in store.currentBooking.custom_fields"
            :key="String(key)"
            class="booking-detail__field"
          >
            <label>{{ key }}</label>
            <span>{{ value }}</span>
          </div>
        </div>

        <div
          v-if="store.currentBooking.notes"
          class="booking-detail__section"
        >
          <h3>{{ $t('booking.bookingDetail.userNotes') }}</h3>
          <p>{{ store.currentBooking.notes }}</p>
        </div>

        <div
          v-if="store.currentBooking.admin_notes"
          class="booking-detail__section"
        >
          <h3>{{ $t('booking.bookingDetail.adminNotes') }}</h3>
          <p>{{ store.currentBooking.admin_notes }}</p>
        </div>
      </div>

      <!-- Admin Actions -->
      <div
        v-if="store.currentBooking.status === 'pending'"
        class="booking-detail__actions"
      >
        <button
          class="btn btn--primary"
          @click="confirmBooking"
        >
          {{ $t('booking.bookingDetail.actions.confirm') }}
        </button>
        <button
          class="btn btn--danger"
          @click="cancelBooking"
        >
          {{ $t('booking.bookingDetail.actions.cancel') }}
        </button>
      </div>

      <div
        v-if="store.currentBooking.status === 'confirmed'"
        class="booking-detail__actions"
      >
        <button
          class="btn btn--primary"
          @click="completeBooking"
        >
          {{ $t('booking.bookingDetail.actions.markComplete') }}
        </button>
        <button
          class="btn btn--warning"
          @click="markNoShow"
        >
          {{ $t('booking.bookingDetail.actions.markNoShow') }}
        </button>
        <button
          class="btn btn--danger"
          @click="cancelBooking"
        >
          {{ $t('booking.bookingDetail.actions.cancelUserPolicy') }}
        </button>
        <button
          class="btn btn--danger-outline"
          @click="showCancelByProvider = true"
        >
          {{ $t('booking.bookingDetail.actions.cancelByProvider') }}
        </button>
      </div>

      <!-- Cancel by Provider Modal -->
      <div
        v-if="showCancelByProvider"
        class="booking-detail__modal"
      >
        <div class="booking-detail__modal-content">
          <h3>{{ $t('booking.bookingDetail.cancelByProviderModal.title') }}</h3>
          <p>{{ $t('booking.bookingDetail.cancelByProviderModal.description') }}</p>
          <textarea
            v-model="cancelReason"
            :placeholder="$t('booking.bookingDetail.cancelByProviderModal.reasonPlaceholder')"
            rows="3"
            class="booking-detail__textarea"
          />
          <div class="booking-detail__modal-actions">
            <button
              :disabled="!cancelReason.trim()"
              class="btn btn--danger"
              @click="cancelByProvider"
            >
              {{ $t('booking.bookingDetail.cancelByProviderModal.confirm') }}
            </button>
            <button
              class="btn btn--secondary"
              @click="showCancelByProvider = false"
            >
              {{ $t('booking.bookingDetail.cancelByProviderModal.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <p
      v-else
      class="empty-state"
    >
      {{ $t('booking.bookingDetail.notFound') }}
    </p>
  </div>
</template>

<style scoped>
.plans-view { background: white; padding: 20px; border-radius: 8px; }
.plans-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-left h2 { margin: 0; color: #2c3e50; }
.back-btn { background: none; border: 1px solid #ddd; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 16px; color: #3498db; }
.back-btn:hover { background: #f0f0f0; }
.loading-state { text-align: center; padding: 40px; color: #666; }
.spinner { width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 40px; color: #666; }

.status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 500; }
.status-badge.confirmed { background: #d4edda; color: #155724; }
.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.cancelled { background: #f8d7da; color: #721c24; }
.status-badge.completed { background: #cce5ff; color: #004085; }
.status-badge.no_show { background: #e9ecef; color: #495057; }

.booking-detail__card {
  background: var(--vbwd-bg-card, #fff);
  border: 1px solid var(--vbwd-border, #e2e8f0);
  border-radius: var(--vbwd-radius, 8px);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.booking-detail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.booking-detail__field label {
  display: block;
  font-weight: 600;
  color: var(--vbwd-text-secondary, #64748b);
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.booking-detail__section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vbwd-border, #e2e8f0);
}

.booking-detail__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn { padding: 0.5rem 1rem; border-radius: 4px; border: 1px solid transparent; cursor: pointer; font-weight: 500; }
.btn--primary { background: var(--vbwd-primary, #3498db); color: #fff; }
.btn--danger { background: #ef4444; color: #fff; }
.btn--danger-outline { background: transparent; border-color: #ef4444; color: #ef4444; }
.btn--warning { background: #f59e0b; color: #fff; }
.btn--secondary { background: var(--vbwd-bg-secondary, #f1f5f9); color: var(--vbwd-text, #1e293b); }

.booking-detail__modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.booking-detail__modal-content {
  background: var(--vbwd-bg-card, #fff);
  border-radius: var(--vbwd-radius, 8px);
  padding: 2rem;
  max-width: 500px;
  width: 90%;
}

.booking-detail__textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--vbwd-border, #e2e8f0);
  border-radius: 4px;
  margin: 1rem 0;
  resize: vertical;
}

.booking-detail__modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.booking-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.booking-status--confirmed { background: #dcfce7; color: #166534; }
.booking-status--pending { background: #fef9c3; color: #854d0e; }
.booking-status--cancelled { background: #fee2e2; color: #991b1b; }
.booking-status--completed { background: #dbeafe; color: #1e40af; }
.booking-status--no_show { background: #f3f4f6; color: #6b7280; }
</style>
