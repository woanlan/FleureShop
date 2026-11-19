/**
 * ============================================================================
 * FILE: src/server.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Điểm khởi chạy chính của máy chủ Backend (Entry Point).
 * Chịu trách nhiệm nạp biến môi trường (.env), kết nối MongoDB, tự động nạp dữ liệu
 * mẫu (Auto-seed) lần đầu, mở cổng HTTP lắng nghe request và đóng kết nối an toàn.
 * ============================================================================
 */

// Nạp tự động các biến cấu hình từ file .env (như PORT, MONGODB_URI, CORS_ORIGIN) vào process.env
import 'dotenv/config';
import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { ensureSeeded } from './seed.js';

// Ưu tiên lấy cổng PORT do nền tảng Cloud (như Render) cấp phát, mặc định là 5000 khi chạy ở máy cá nhân
const PORT = Number(process.env.PORT) || 5000;

// Lắng nghe trên địa chỉ '0.0.0.0' (tất cả card mạng) thay vì 'localhost'
// -> Bắt buộc phải dùng '0.0.0.0' để dịch vụ Cloud như Render quét và nhận diện được cổng mở của ứng dụng
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Hàm khởi động tuần tự toàn bộ hệ thống Backend FLEURÉ.
 */
async function startServer() {
  // Bước 1: Kết nối tới cơ sở dữ liệu MongoDB (Atlas trên Cloud hoặc Local dưới máy)
  await connectDb();

  // Bước 2: Gọi ensureSeeded() để kiểm tra và tự động bơm dữ liệu mẫu (hoa, danh mục, banner, bài viết...)
  // ngay lần khởi chạy đầu tiên nếu Database trên MongoDB Atlas / Local đang trống
  const seeded = await ensureSeeded();
  if (seeded) {
    console.log(
      `Auto-seeded MongoDB: ${seeded.categories} categories, ${seeded.banners} banners, ${seeded.products} products, ${seeded.posts} posts, ${seeded.experiences} experiences.`
    );
  }

  // Bước 3: Khởi tạo ứng dụng Express (gắn Middleware, CORS, Routes) và mở cổng lắng nghe HTTP
  const app = createApp();
  const server = app.listen(PORT, HOST, () => {
    console.log(`FLEURE Backend API listening at http://${HOST}:${PORT}/api`);
  });

  // Bước 4: Cơ chế Graceful Shutdown — đóng cổng HTTP rồi ngắt kết nối MongoDB sạch sẽ khi tắt server
  const shutdown = async () => {
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  // Bắt tín hiệu tắt tiến trình khi nhấn Ctrl+C ở Terminal (SIGINT) hoặc khi Render khởi động lại container (SIGTERM)
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Kích hoạt hàm khởi chạy; nếu lỗi kết nối DB ngay lúc mở server thì in lỗi và dừng tiến trình với mã lỗi 1
startServer().catch((err) => {
  console.error('Failed to start FLEURE Backend:', err);
  process.exit(1);
});
