<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBookingAdminStore } from '../stores/bookingAdmin';

const router = useRouter();
const store = useBookingAdminStore();
const statusFilter = ref('');

const filteredBookings = computed(() => {
  if (!statusFilter.value) return store.bookings;
  return store.bookings.filter(booking => booking.status === statusFilter.value);
});

onMounted(() => {
  store.fetchBookings();
});

function viewDetail(bookingId: string) {
  router.push(`/admin/booking/${bookingId}`);
}
</script>

<template>
  <div class="booking-list">
    <div class="booking-list__header">
      <h1>{{ $t('booking.bookings.title') }}</h1>
      <select v-model="statusFilter" class="booking-list__filter">
        <option value="">{{ $t('booking.bookings.allStatuses') }}</option>
        <option value="confirmed">{{ $t('booking.bookings.statuses.confirmed') }}</option>
        <option value="pending">{{ $t('booking.bookings.statuses.pending') }}</option>
        <option value="cancelled">{{ $t('booking.bookings.statuses.cancelled') }}</option>
        <option value="completed">{{ $t('booking.bookings.statuses.completed') }}</option>
        <option value="no_show">{{ $t('booking.bookings.statuses.noShow') }}</option>
      </select>
    </div>

    <div v-if="store.loading" class="booking-list__loading">{{ $t('booking.common.loading') }}</div>

    <table v-else-if="filteredBookings.length" class="booking-list__table">
      <thead>
        <tr>
          <th>{{ $t('booking.bookings.table.resource') }}</th>
          <th>{{ $t('booking.bookings.table.start') }}</th>
          <th>{{ $t('booking.bookings.table.end') }}</th>
          <th>{{ $t('booking.bookings.table.status') }}</th>
          <th>{{ $t('booking.bookings.table.quantity') }}</th>
          <th>{{ $t('booking.bookings.table.created') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="booking in filteredBookings"
          :key="booking.id"
          @click="viewDetail(booking.id)"
          class="booking-list__row"
        >
          <td>{{ booking.resource?.name || $t('booking.dashboard.unknown') }}</td>
          <td>{{ new Date(booking.start_at).toLocaleString() }}</td>
          <td>{{ new Date(booking.end_at).toLocaleString() }}</td>
          <td>
            <span :class="`booking-status booking-status--${booking.status}`">
              {{ booking.status }}
            </span>
          </td>
          <td>{{ booking.quantity }}</td>
          <td>{{ new Date(booking.created_at).toLocaleDateString() }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else>{{ $t('booking.bookings.noBookingsFound') }}</p>
  </div>
</template>

<style scoped>
.booking-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.booking-list__filter {
  padding: 0.5rem;
  border: 1px solid var(--vbwd-border, #e2e8f0);
  border-radius: var(--vbwd-radius, 4px);
}

.booking-list__table {
  width: 100%;
  border-collapse: collapse;
}

.booking-list__table th,
.booking-list__table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--vbwd-border, #e2e8f0);
  text-align: left;
}

.booking-list__row {
  cursor: pointer;
}

.booking-list__row:hover {
  background: var(--vbwd-bg-hover, #f8fafc);
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
