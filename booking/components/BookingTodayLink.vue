<template>
  <!-- Shown on every admin page: a quick stat + shortcut to the All Bookings
       list. Rendered as a plain icon + string (no button chrome). Visibility is
       gated only by the booking.bookings.view permission (the registry filters
       it), so core stays agnostic. -->
  <RouterLink
    class="booking-topbar-today"
    to="/admin/booking/list"
    data-testid="booking-topbar-today"
  >
    <Icon name="calendar" />
    <span>{{ t('booking.topbar.bookingsToday', { count: todaysBookings }) }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Icon } from 'vbwd-view-component';
import { api } from '@/api';

const { t } = useI18n();

const todaysBookings = ref(0);

async function loadCount(): Promise<void> {
  try {
    const response = (await api.get('/admin/booking/dashboard')) as {
      todays_bookings?: number;
    };
    todaysBookings.value = response.todays_bookings || 0;
  } catch {
    // Backend unreachable or permission missing — keep zero, stay quiet.
  }
}

// The topbar lives in the persistent admin layout, so this mounts once.
onMounted(loadCount);
</script>

<style scoped>
/* Plain icon + string — no button border/background. */
.booking-topbar-today {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #2c3e50;
  text-decoration: none;
  font-size: 0.9rem;
  line-height: 1;
}

.booking-topbar-today:hover {
  text-decoration: underline;
}
</style>
