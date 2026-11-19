import { InjectionToken } from '@angular/core';

/** Resolves /api in tests or proxied dev/prod builds, else direct Express backend on port 5000. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    if (typeof window === 'undefined' || /jsdom/i.test(window.navigator?.userAgent ?? '')) {
      return '/api';
    }
    const { hostname, port } = window.location ?? {};
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocalHost && port && port !== '4200' && port !== '5000') {
      return 'http://127.0.0.1:5000/api';
    }
    return '/api';
  },
});
