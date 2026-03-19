import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'vbwd-view-component';

export interface Booking {
  id: string;
  resource_id: string;
  user_id: string;
  invoice_id: string | null;
  start_at: string;
  end_at: string;
  status: string;
  quantity: number;
  custom_fields: Record<string, unknown>;
  notes: string | null;
  admin_notes: string | null;
  resource: BookableResource | null;
  created_at: string;
}

export interface BookableResource {
  id: string;
  name: string;
  slug: string;
  resource_type: string;
  capacity: number;
  price: string;
  price_unit: string;
}

export interface DashboardStats {
  today: number;
  upcoming: number;
}

export const useBookingAdminStore = defineStore('bookingAdmin', () => {
  const bookings = ref<Booking[]>([]);
  const currentBooking = ref<Booking | null>(null);
  const dashboardStats = ref<DashboardStats>({ today: 0, upcoming: 0 });
  const loading = ref(false);

  async function fetchBookings(filters?: { status?: string; resource_id?: string }) {
    loading.value = true;
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.resource_id) params.set('resource_id', filters.resource_id);
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/admin/booking/bookings${query}`) as { bookings: Booking[] };
      bookings.value = response.bookings;
    } finally {
      loading.value = false;
    }
  }

  async function fetchBookingDetail(bookingId: string) {
    loading.value = true;
    try {
      currentBooking.value = await api.get(`/admin/booking/bookings/${bookingId}`) as Booking;
    } finally {
      loading.value = false;
    }
  }

  async function updateBookingStatus(bookingId: string, status: string, adminNotes?: string) {
    const payload: Record<string, string> = { status };
    if (adminNotes !== undefined) payload.admin_notes = adminNotes;
    const response = await api.put(`/admin/booking/bookings/${bookingId}`, payload) as Booking;
    currentBooking.value = response;
    return response;
  }

  async function fetchDashboardStats() {
    dashboardStats.value = await api.get('/admin/booking/dashboard') as DashboardStats;
  }

  return {
    bookings,
    currentBooking,
    dashboardStats,
    loading,
    fetchBookings,
    fetchBookingDetail,
    updateBookingStatus,
    fetchDashboardStats,
  };
});
