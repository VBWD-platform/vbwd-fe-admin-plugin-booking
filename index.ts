import type { IPlugin, IPlatformSDK } from 'vbwd-view-component';

export const bookingAdminPlugin: IPlugin = {
  name: 'booking',
  version: '0.1.0',
  install(sdk: IPlatformSDK) {
    // Routes, stores, extension registry will be registered here
  },
  activate() {},
  deactivate() {},
};
