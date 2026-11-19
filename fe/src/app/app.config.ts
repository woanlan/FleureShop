/**
 * Cấu hình toàn cục (ApplicationConfig) cho ứng dụng Angular Standalone.
 * Nơi đăng ký các dịch vụ nền tảng dùng chung cho toàn bộ project (HTTP, Router, bắt lỗi).
 */
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Lắng nghe và xử lý tập trung các lỗi phát sinh toàn cục trên trình duyệt
    provideBrowserGlobalErrorListeners(),

    // Cung cấp HttpClient sử dụng chuẩn Fetch API hiện đại để gọi REST API tới Express/MongoDB
    provideHttpClient(withFetch()),

    // Đăng ký bảng định tuyến `routes` kèm tính năng tự động cuộn lên đầu trang ('top') mỗi khi chuyển màn hình
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
  ],
};
