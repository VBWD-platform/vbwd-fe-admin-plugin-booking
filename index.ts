import type { IPlugin, IPlatformSDK } from 'vbwd-view-component';
import { extensionRegistry } from 'vbwd-view-component';

export const bookingAdminPlugin: IPlugin = {
  name: 'booking',
  version: '0.1.0',

  install(sdk: IPlatformSDK) {
    // Admin routes
    sdk.addRoute({
      path: 'booking',
      name: 'booking-dashboard',
      component: () => import('./booking/views/BookingDashboard.vue'),
    });
    sdk.addRoute({
      path: 'booking/list',
      name: 'booking-list',
      component: () => import('./booking/views/BookingList.vue'),
    });
    sdk.addRoute({
      path: 'booking/:id',
      name: 'booking-detail',
      component: () => import('./booking/views/BookingDetail.vue'),
    });
    sdk.addRoute({
      path: 'booking/resources',
      name: 'booking-resources',
      component: () => import('./booking/views/ResourceList.vue'),
    });
    sdk.addRoute({
      path: 'booking/resources/:id',
      name: 'booking-resource-form',
      component: () => import('./booking/views/ResourceForm.vue'),
    });

    // Extension registry — add nav section to admin sidebar
    extensionRegistry.register('booking', {
      navSections: [
        {
          id: 'booking',
          label: 'Bookings',
          items: [
            { label: 'Dashboard', to: '/admin/booking' },
            { label: 'All Bookings', to: '/admin/booking/list' },
            { label: 'Resources', to: '/admin/booking/resources' },
          ],
        },
      ],
    });
  },

  activate() {},
  deactivate() {},
};
