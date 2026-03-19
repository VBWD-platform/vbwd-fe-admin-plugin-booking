<script setup lang="ts">
import { onMounted } from 'vue';
import { useBookingAdminStore } from '../stores/bookingAdmin';
import { useResourceAdminStore } from '../stores/resourceAdmin';

const bookingStore = useBookingAdminStore();
const resourceStore = useResourceAdminStore();

onMounted(async () => {
  await Promise.all([
    bookingStore.fetchDashboardStats(),
    bookingStore.fetchBookings(),
    resourceStore.fetchResources(),
    resourceStore.fetchCategories(),
  ]);
});
</script>

<template>
  <div class="booking-dashboard">
    <h1>Booking Dashboard</h1>

    <div class="booking-dashboard__stats">
      <div class="booking-dashboard__stat-card">
        <div class="booking-dashboard__stat-value">{{ bookingStore.dashboardStats.today }}</div>
        <div class="booking-dashboard__stat-label">Today's Bookings</div>
      </div>
      <div class="booking-dashboard__stat-card">
        <div class="booking-dashboard__stat-value">{{ bookingStore.dashboardStats.upcoming }}</div>
        <div class="booking-dashboard__stat-label">Upcoming</div>
      </div>
      <div class="booking-dashboard__stat-card">
        <div class="booking-dashboard__stat-value">{{ resourceStore.resources.length }}</div>
        <div class="booking-dashboard__stat-label">Resources</div>
      </div>
      <div class="booking-dashboard__stat-card">
        <div class="booking-dashboard__stat-value">{{ resourceStore.categories.length }}</div>
        <div class="booking-dashboard__stat-label">Categories</div>
      </div>
    </div>

    <h2>Recent Bookings</h2>
    <div v-if="bookingStore.loading" class="booking-dashboard__loading">Loading...</div>
    <table v-else-if="bookingStore.bookings.length" class="booking-dashboard__table">
      <thead>
        <tr>
          <th>Resource</th>
          <th>Date</th>
          <th>Status</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="booking in bookingStore.bookings.slice(0, 10)"
          :key="booking.id"
          @click="$router.push(`/admin/booking/${booking.id}`)"
          class="booking-dashboard__row"
        >
          <td>{{ booking.resource?.name || 'Unknown' }}</td>
          <td>{{ new Date(booking.start_at).toLocaleString() }}</td>
          <td>
            <span :class="`booking-status booking-status--${booking.status}`">
              {{ booking.status }}
            </span>
          </td>
          <td>{{ booking.quantity }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>No bookings yet.</p>
  </div>
</template>

<style scoped>
.booking-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.booking-dashboard__stat-card {
  background: var(--vbwd-bg-card, #fff);
  border: 1px solid var(--vbwd-border, #e2e8f0);
  border-radius: var(--vbwd-radius, 8px);
  padding: 1.5rem;
  text-align: center;
}

.booking-dashboard__stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--vbwd-primary, #3498db);
}

.booking-dashboard__stat-label {
  color: var(--vbwd-text-secondary, #64748b);
  margin-top: 0.25rem;
}

.booking-dashboard__table {
  width: 100%;
  border-collapse: collapse;
}

.booking-dashboard__table th,
.booking-dashboard__table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--vbwd-border, #e2e8f0);
  text-align: left;
}

.booking-dashboard__row {
  cursor: pointer;
}

.booking-dashboard__row:hover {
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
