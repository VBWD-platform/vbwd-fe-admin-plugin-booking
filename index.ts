import type { IPlugin, IPlatformSDK } from 'vbwd-view-component';
import { extensionRegistry } from '../../vue/src/plugins/extensionRegistry';
import BookingTodayLink from './booking/components/BookingTodayLink.vue';
import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import ru from './locales/ru.json';
import th from './locales/th.json';
import zh from './locales/zh.json';

export const bookingAdminPlugin: IPlugin = {
  name: 'booking',
  version: '26.6.1',

  install(sdk: IPlatformSDK) {
    // Translations
    sdk.addTranslations('en', { booking: (en as Record<string, unknown>)['booking'] });
    sdk.addTranslations('de', { booking: (de as Record<string, unknown>)['booking'] });
    sdk.addTranslations('es', { booking: (es as Record<string, unknown>)['booking'] });
    sdk.addTranslations('fr', { booking: (fr as Record<string, unknown>)['booking'] });
    sdk.addTranslations('ja', { booking: (ja as Record<string, unknown>)['booking'] });
    sdk.addTranslations('ru', { booking: (ru as Record<string, unknown>)['booking'] });
    sdk.addTranslations('th', { booking: (th as Record<string, unknown>)['booking'] });
    sdk.addTranslations('zh', { booking: (zh as Record<string, unknown>)['booking'] });

    // Admin routes
    sdk.addRoute({
      path: 'booking',
      name: 'booking-dashboard',
      component: () => import('./booking/views/BookingDashboard.vue'),
      meta: { requiredPermission: 'booking.bookings.view' },
    });
    sdk.addRoute({
      path: 'booking/list',
      name: 'booking-list',
      component: () => import('./booking/views/BookingList.vue'),
      meta: { requiredPermission: 'booking.bookings.view' },
    });
    sdk.addRoute({
      path: 'booking/:id',
      name: 'booking-detail',
      component: () => import('./booking/views/BookingDetail.vue'),
      meta: { requiredPermission: 'booking.bookings.view' },
    });
    sdk.addRoute({
      path: 'booking/resources',
      name: 'booking-resources',
      component: () => import('./booking/views/ResourceList.vue'),
      meta: { requiredPermission: 'booking.resources.view' },
    });
    sdk.addRoute({
      path: 'booking/resources/:id',
      name: 'booking-resource-form',
      component: () => import('./booking/views/ResourceForm.vue'),
      meta: { requiredPermission: 'booking.resources.view' },
    });
    sdk.addRoute({
      path: 'booking/categories/:id',
      name: 'booking-category-editor',
      component: () => import('./booking/views/CategoryEditor.vue'),
      meta: { requiredPermission: 'booking.resources.manage' },
    });
    sdk.addRoute({
      path: 'booking/schemas/:id',
      name: 'booking-schema-editor',
      component: () => import('./booking/views/SchemaEditor.vue'),
      meta: { requiredPermission: 'booking.resources.manage' },
    });
    sdk.addRoute({
      path: 'booking/resources/:id/schedule',
      name: 'booking-resource-schedule',
      component: () => import('./booking/views/ResourceSchedule.vue'),
      meta: { requiredPermission: 'booking.resources.manage' },
    });

    // Admin dashboard widget — component name "BookingWidget" matches the
    // "booking" plugin key via Dashboard.vue's normalised-name filter.
    sdk.addComponent(
      'BookingWidget',
      () => import('./booking/components/BookingWidget.vue') as Promise<{ default: unknown }>,
    );

    // Routes are registered here (install runs once).
    // Nav sections are registered in activate() so they respect enable/disable.
  },

  activate() {
    extensionRegistry.register('booking', {
      // Right-aligned topbar action: "<count> bookings today" → All Bookings.
      // Self-scopes to /admin/booking pages (see the component).
      topbarActions: [
        {
          id: 'booking-today',
          component: BookingTodayLink,
          order: 100,
          requiredPermission: 'booking.bookings.view',
        },
      ],
      sectionItems: {
        sales: [
          {
            label: 'Bookings',
            to: '/admin/booking',
            id: 'bookings',
            icon: 'calendar',
            requiredPermission: 'booking.bookings.view',
            children: [
              { label: 'Dashboard', to: '/admin/booking', icon: 'dashboard', requiredPermission: 'booking.bookings.view' },
              { label: 'All Bookings', to: '/admin/booking/list', icon: 'calendar', requiredPermission: 'booking.bookings.view' },
              { label: 'Resources', to: '/admin/booking/resources', icon: 'list', requiredPermission: 'booking.resources.view' },
            ],
          },
        ],
      },
    });
  },

  deactivate() {
    extensionRegistry.unregister('booking');
  },
};

// Default export — loader falls back to scanning named exports when this
// is missing, which is non-deterministic under some bundler hot-reload
// paths. Matches the cms-admin pattern for robustness.
export default bookingAdminPlugin;
