/**
 * Điểm khởi chạy chính (Entry Point) của ứng dụng Angular FLEURÉ.
 * Sử dụng kiến trúc Standalone Component hiện đại (không cần NgModule truyền thống):
 * hàm `bootstrapApplication` nạp trực tiếp Component gốc `App` cùng cấu hình toàn cục `appConfig`.
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Khởi động ứng dụng trên trình duyệt và ghi log nếu xảy ra lỗi trong quá trình khởi tạo
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
