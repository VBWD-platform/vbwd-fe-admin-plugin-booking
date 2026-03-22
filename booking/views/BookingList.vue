<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBookingAdminStore } from '../stores/bookingAdmin';

const router = useRouter();
const store = useBookingAdminStore();
const statusFilter = ref('');
const searchQuery = ref('');

type SortColumn = 'resource' | 'start_at' | 'status' | 'created_at' | null;
type SortDirection = 'asc' | 'desc';
const sortColumn = ref<SortColumn>(null);
const sortDirection = ref<SortDirection>('asc');

const filteredBookings = computed(() => {
  let bookings = store.bookings;
  if (statusFilter.value) {
    bookings = bookings.filter(booking => booking.status === statusFilter.value);
  }
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    bookings = bookings.filter(booking =>
      (booking.resource?.name || '').toLowerCase().includes(query)
    );
  }
  return bookings;
});

const sortedBookings = computed(() => {
  const list = [...filteredBookings.value];
  if (!sortColumn.value) return list;
  return list.sort((a, b) => {
    let comparison = 0;
    switch (sortColumn.value) {
      case 'resource': comparison = (a.resource?.name || '').localeCompare(b.resource?.name || ''); break;
      case 'start_at': comparison = a.start_at.localeCompare(b.start_at); break;
      case 'status': comparison = a.status.localeCompare(b.status); break;
      case 'created_at': comparison = a.created_at.localeCompare(b.created_at); break;
    }
    return sortDirection.value === 'asc' ? comparison : -comparison;
  });
});

function handleSort(column: SortColumn) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
}

function getSortIndicator(column: SortColumn): string {
  if (sortColumn.value !== column) return '';
  return sortDirection.value === 'asc' ? '▲' : '▼';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

onMounted(() => {
  store.fetchBookings();
});

function viewDetail(bookingId: string) {
  router.push(`/admin/booking/${bookingId}`);
}
</script>

<template>
  <div class="plans-view">
    <div class="plans-header">
      <div class="header-left">
        <h2>{{ $t('booking.bookings.title') }}</h2>
        <span
          v-if="!store.loading"
          class="total-count"
        >{{ filteredBookings.length }} {{ $t('booking.common.noData') !== '—' ? '' : '' }}</span>
      </div>
    </div>

    <div class="plans-filters">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="$t('booking.resources.search')"
        class="search-input"
      >
      <select
        v-model="statusFilter"
        class="filter-select"
      >
        <option value="">{{ $t('booking.bookings.allStatuses') }}</option>
        <option value="confirmed">{{ $t('booking.bookings.statuses.confirmed') }}</option>
        <option value="pending">{{ $t('booking.bookings.statuses.pending') }}</option>
        <option value="cancelled">{{ $t('booking.bookings.statuses.cancelled') }}</option>
        <option value="completed">{{ $t('booking.bookings.statuses.completed') }}</option>
        <option value="no_show">{{ $t('booking.bookings.statuses.noShow') }}</option>
      </select>
    </div>

    <div
      v-if="store.loading"
      class="loading-state"
    >
      <div class="spinner" />
      <p>{{ $t('booking.common.loading') }}</p>
    </div>

    <div
      v-else-if="filteredBookings.length === 0"
      class="empty-state"
    >
      <p>{{ $t('booking.bookings.noBookingsFound') }}</p>
    </div>

    <div
      v-else
      class="plans-table-wrap"
    >
      <table class="plans-table">
        <thead>
          <tr>
            <th
              class="sortable"
              @click="handleSort('resource')"
            >
              {{ $t('booking.bookings.table.resource') }}
              <span class="sort-indicator">{{ getSortIndicator('resource') }}</span>
            </th>
            <th
              class="sortable"
              @click="handleSort('start_at')"
            >
              {{ $t('booking.bookings.table.start') }}
              <span class="sort-indicator">{{ getSortIndicator('start_at') }}</span>
            </th>
            <th>{{ $t('booking.bookings.table.end') }}</th>
            <th
              class="sortable"
              @click="handleSort('status')"
            >
              {{ $t('booking.bookings.table.status') }}
              <span class="sort-indicator">{{ getSortIndicator('status') }}</span>
            </th>
            <th>{{ $t('booking.bookings.table.quantity') }}</th>
            <th
              class="sortable"
              @click="handleSort('created_at')"
            >
              {{ $t('booking.bookings.table.created') }}
              <span class="sort-indicator">{{ getSortIndicator('created_at') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="booking in sortedBookings"
            :key="booking.id"
            class="plan-row"
            @click="viewDetail(booking.id)"
          >
            <td>{{ booking.resource?.name || $t('booking.dashboard.unknown') }}</td>
            <td>{{ formatDateTime(booking.start_at) }}</td>
            <td>{{ formatDateTime(booking.end_at) }}</td>
            <td>
              <span
                class="status-badge"
                :class="booking.status"
              >
                {{ booking.status }}
              </span>
            </td>
            <td>{{ booking.quantity }}</td>
            <td>{{ formatDate(booking.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.plans-view { background: white; padding: 20px; border-radius: 8px; }
.plans-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.plans-header h2 { margin: 0; color: #2c3e50; }
.header-left { display: flex; align-items: center; gap: 15px; }
.total-count { color: #666; font-size: 0.9rem; }

.plans-filters { display: flex; gap: 15px; margin-bottom: 20px; }
.search-input { flex: 1; max-width: 300px; padding: 10px 15px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
.search-input:focus { outline: none; border-color: #3498db; }
.filter-select { padding: 10px 15px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; min-width: 150px; }

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

.status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 500; }
.status-badge.confirmed { background: #d4edda; color: #155724; }
.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.cancelled { background: #f8d7da; color: #721c24; }
.status-badge.completed { background: #cce5ff; color: #004085; }
.status-badge.no_show { background: #e9ecef; color: #495057; }

@media (max-width: 768px) {
  .plans-view { padding: 12px; border-radius: 0; }
  .plans-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .plans-filters { flex-direction: column; }
  .search-input { max-width: none; }
  .filter-select { width: 100%; }
  .plans-table { min-width: 600px; }
  .plans-table th, .plans-table td { padding: 8px 8px; font-size: 0.85rem; }
}

@media (max-width: 480px) {
  .plans-view { padding: 8px; }
  .plans-table { min-width: 480px; }
  .plans-table th, .plans-table td { padding: 6px 6px; font-size: 0.8rem; }
  .status-badge { padding: 2px 6px; font-size: 0.7rem; }
}
</style>
