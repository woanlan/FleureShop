/**
 * Cấu hình địa chỉ gốc của Backend API (`API_BASE_URL`) bằng Angular `InjectionToken`.
 * Giúp ứng dụng tự động chuyển đổi linh hoạt giữa môi trường phát triển nội bộ (Local/Test)
 * và môi trường triển khai thực tế trên đám mây (Frontend trên Vercel gọi Backend trên Render)
 * mà không cần sửa code thủ công khi build.
 */
import { InjectionToken } from '@angular/core';

// Địa chỉ REST API Backend (Express + MongoDB) đã triển khai thực tế trên Render
export const PROD_API_BASE_URL = 'https://fleureshop.onrender.com/api';

/**
 * Token cung cấp URL gốc cho `ShopService`:
 * 1. Khi chạy Unit Test (`jsdom` hoặc không có `window`) -> trả về `/api`.
 * 2. Khi chạy trên tên miền thật (như Vercel, khác `localhost` / `127.0.0.1`) -> trỏ tới `PROD_API_BASE_URL` trên Render.
 * 3. Khi mở Frontend ở cổng nội bộ khác `4200` và `5000` -> gọi trực tiếp Backend Express tại `http://127.0.0.1:5000/api`.
 * 4. Khi chạy `ng serve` ở cổng `4200` (có proxy chuyển tiếp) hoặc chạy chung cổng `5000` -> dùng đường dẫn tương đối `/api`.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    // Trường hợp môi trường kiểm thử tự động (Unit Test / SSR) không chạy trên trình duyệt thật
    if (typeof window === 'undefined' || /jsdom/i.test(window.navigator?.userAgent ?? '')) {
      return '/api';
    }
    const { hostname, port } = window.location ?? {};
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    // Nếu không phải máy cục bộ (ví dụ đã deploy lên Vercel) thì gọi API trên Render
    if (!isLocalHost) {
      return PROD_API_BASE_URL;
    }

    // Nếu đang mở trên localhost ở một cổng tùy chỉnh khác 4200 / 5000 thì trỏ thẳng tới cổng 5000 của Express
    if (port && port !== '4200' && port !== '5000') {
      return 'http://127.0.0.1:5000/api';
    }

    // Mặc định khi chạy `ng serve` (cổng 4200 qua proxy.conf) -> dùng `/api`
    return '/api';
  },
});
