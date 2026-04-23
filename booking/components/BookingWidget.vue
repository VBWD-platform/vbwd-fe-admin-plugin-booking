<template>
  <div
    class="stat-card plugin-widget"
    data-testid="booking-widget"
  >
    <h3>{{ $t('booking.widget.title') }}</h3>
    <div
      v-if="loading"
      class="stat-value"
    >
      ...
    </div>
    <template v-else>
      <div
        class="stat-value"
        data-testid="booking-widget-today"
      >
        {{ stats.todaysBookings }}
      </div>
      <div class="stat-label">
        {{ $t('booking.widget.today') }}
      </div>
      <div class="stat-sub">
        <span>{{ stats.upcoming }} {{ $t('booking.widget.upcoming') }}</span>
        <span>·</span>
        <span>{{ stats.resources }} {{ $t('booking.widget.resources') }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api';

interface DashboardStats {
  todaysBookings: number;
  upcoming: number;
  resources: number;
  categories: number;
}

const stats = ref<DashboardStats>({
  todaysBookings: 0,
  upcoming: 0,
  resources: 0,
  categories: 0,
});
const loading = ref(true);

onMounted(async () => {
  try {
    const response = await api.get('/admin/booking/dashboard') as {
      todays_bookings?: number;
      upcoming?: number;
      resources?: number;
      categories?: number;
    };
    stats.value = {
      todaysBookings: response.todays_bookings || 0,
      upcoming: response.upcoming || 0,
      resources: response.resources || 0,
      categories: response.categories || 0,
    };
  } catch {
    // Backend unreachable or permission missing — keep zeros, stay quiet.
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem 1.25rem;
}
.stat-card h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #4a5568;
  margin: 0 0 0.5rem;
}
.stat-value {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1;
  color: #1a202c;
}
.stat-label {
  font-size: 0.85rem;
  color: #4a5568;
  margin-top: 0.25rem;
}
.stat-sub {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #718096;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}
</style>
