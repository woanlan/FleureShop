/**
 * ============================================================================
 * FILE: src/app.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Khởi tạo & Cấu hình Ứng dụng Express (Application Layer).
 * Tách riêng phần thiết lập Express (CORS, đọc JSON, định tuyến /api, bắt lỗi tập trung)
 * khỏi server.js để mã nguồn rõ ràng và dễ dàng kiểm thử tự động (Integration Test).
 * ============================================================================
 */

import express from 'express';
import cors from 'cors';
import { shopRouter } from './routes/shopRoutes.js';

/**
 * Khởi tạo đối tượng Express cùng đầy đủ Middleware: phân tích cú pháp JSON,
 * cấp quyền truy cập chéo miền (CORS cho Angular Frontend) và gắn toàn bộ Route API.
 */
export function createApp() {
  const app = express();

  // Đọc danh sách tên miền Frontend được phép gọi API từ biến môi trường (mặc định là Angular chạy cổng 4200)
  const originEnv = process.env.CORS_ORIGIN || 'http://localhost:4200';
  const allowedOrigins = originEnv.split(',').map((s) => s.trim()).filter(Boolean);

  // Middleware CORS: Cho phép trình duyệt từ phía Angular (khác cổng hoặc khác domain Vercel) gọi sang Backend
  app.use(
    cors({
      origin(origin, callback) {
        // Cho phép request từ công cụ không có Origin (Postman, curl, mobile) hoặc nằm trong danh sách cho phép
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        // Mặc định mở quyền truy cập để tránh lỗi chặn CORS khi demo trên nhiều môi trường triển khai
        callback(null, true);
      },
    })
  );

  // Middleware tích hợp sẵn của Express giúp đọc dữ liệu body dạng JSON (ví dụ payload khi POST /api/orders)
  app.use(express.json());

  // Route gốc '/' giúp kiểm tra nhanh trạng thái sống của dịch vụ khi mở trực tiếp link Backend trên trình duyệt
  app.get('/', (_req, res) => {
    res.json({
      service: 'FLEURÉ Flower Boutique API',
      status: 'ok',
      health: '/api/health',
      endpoints: ['/api/home', '/api/categories', '/api/products', '/api/posts', '/api/experiences', '/api/orders'],
    });
  });

  // Gắn toàn bộ định tuyến nghiệp vụ cửa hàng hoa dưới tiền tố chung '/api'
  app.use('/api', shopRouter);

  // Middleware xử lý lỗi tập trung (Global Error Handler - có đủ 4 tham số err, req, res, next)
  // Mọi lỗi bất ngờ ở Controller được đẩy qua next(err) sẽ nhảy về đây và trả mã HTTP 500 gọn gàng
  app.use((err, _req, res, _next) => {
    console.error('API Error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xử lý dữ liệu MongoDB.' });
  });

  return app;
}
