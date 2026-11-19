import { InjectionToken } from '@angular/core';

export const PROD_API_BASE_URL = 'https://fleureshop.onrender.com/api';

/** Resolves /api in tests or local dev proxy, local Express on custom ports, and Render API in production. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    if (typeof window === 'undefined' || /jsdom/i.test(window.navigator?.userAgent ?? '')) {
      return '/api';
    }
    const { hostname, port } = window.location ?? {};
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocalHost) {
      return PROD_API_BASE_URL;
    }
    if (port && port !== '4200' && port !== '5000') {
      return 'http://127.0.0.1:5000/api';
    }
    return '/api';
  },
});
