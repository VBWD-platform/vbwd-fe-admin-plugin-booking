import type { IPlugin, IPlatformSDK } from 'vbwd-view-component';
import { extensionRegistry } from '../../vue/src/plugins/extensionRegistry';
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
  version: '0.1.0',

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
    sdk.addRoute({
      path: 'booking/categories/:id',
      name: 'booking-category-editor',
      component: () => import('./booking/views/CategoryEditor.vue'),
    });
    sdk.addRoute({
      path: 'booking/schemas/:id',
      name: 'booking-schema-editor',
      component: () => import('./booking/views/SchemaEditor.vue'),
    });
    sdk.addRoute({
      path: 'booking/resources/:id/schedule',
      name: 'booking-resource-schedule',
      component: () => import('./booking/views/ResourceSchedule.vue'),
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
