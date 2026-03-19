import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBookingAdminStore } from '../../../booking/stores/bookingAdmin';

vi.mock('@/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '@/api';

describe('useBookingAdminStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetchBookings populates bookings array', async () => {
    const mockBookings = [
      { id: '1', status: 'confirmed', resource: { name: 'Dr. Smith' } },
      { id: '2', status: 'pending', resource: { name: 'Room A' } },
    ];
    vi.mocked(api.get).mockResolvedValue({ bookings: mockBookings });

    const store = useBookingAdminStore();
    await store.fetchBookings();

    expect(store.bookings).toHaveLength(2);
    expect(store.bookings[0].status).toBe('confirmed');
  });

  it('fetchBookings passes status filter', async () => {
    vi.mocked(api.get).mockResolvedValue({ bookings: [] });

    const store = useBookingAdminStore();
    await store.fetchBookings({ status: 'confirmed' });

    expect(api.get).toHaveBeenCalledWith('/admin/booking/bookings?status=confirmed');
  });

  it('fetchBookingDetail sets currentBooking', async () => {
    const mockBooking = { id: '1', status: 'confirmed', resource: { name: 'Dr. Smith' } };
    vi.mocked(api.get).mockResolvedValue(mockBooking);

    const store = useBookingAdminStore();
    await store.fetchBookingDetail('1');

    expect(store.currentBooking).toEqual(mockBooking);
  });

  it('updateBookingStatus calls API and updates currentBooking', async () => {
    const updatedBooking = { id: '1', status: 'completed' };
    vi.mocked(api.put).mockResolvedValue(updatedBooking);

    const store = useBookingAdminStore();
    const result = await store.updateBookingStatus('1', 'completed');

    expect(api.put).toHaveBeenCalledWith('/admin/booking/bookings/1', { status: 'completed' });
    expect(result.status).toBe('completed');
    expect(store.currentBooking?.status).toBe('completed');
  });

  it('updateBookingStatus includes admin notes when provided', async () => {
    vi.mocked(api.put).mockResolvedValue({ id: '1', status: 'cancelled' });

    const store = useBookingAdminStore();
    await store.updateBookingStatus('1', 'cancelled', 'Provider cancelled');

    expect(api.put).toHaveBeenCalledWith('/admin/booking/bookings/1', {
      status: 'cancelled',
      admin_notes: 'Provider cancelled',
    });
  });

  it('fetchDashboardStats populates stats', async () => {
    vi.mocked(api.get).mockResolvedValue({ today: 5, upcoming: 12 });

    const store = useBookingAdminStore();
    await store.fetchDashboardStats();

    expect(store.dashboardStats.today).toBe(5);
    expect(store.dashboardStats.upcoming).toBe(12);
  });

  it('loading is true during fetchBookings', async () => {
    let resolvePromise: (value: unknown) => void;
    vi.mocked(api.get).mockImplementation(() => new Promise(resolve => { resolvePromise = resolve; }));

    const store = useBookingAdminStore();
    const fetchPromise = store.fetchBookings();

    expect(store.loading).toBe(true);

    resolvePromise!({ bookings: [] });
    await fetchPromise;

    expect(store.loading).toBe(false);
  });
});
