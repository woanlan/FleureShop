/**
 * ============================================================================
 * FILE: src/config/db.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Cấu hình Cơ sở dữ liệu (`Config`).
 * Quản lý việc thiết lập và đóng kết nối tới MongoDB thông qua thư viện ODM Mongoose.
 * ============================================================================
 */

import mongoose from 'mongoose';

// Chuỗi kết nối dự phòng (Fallback) trỏ về MongoDB cài trên máy cá nhân (database: fleure_shop)
export const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/fleure_shop';

/**
 * Kết nối Mongoose tới cơ sở dữ liệu MongoDB.
 * - Ưu tiên lấy `process.env.MONGODB_URI` (dùng cho MongoDB Atlas trên Cloud Render).
 * - Nếu chưa cấu hình biến môi trường `.env`, tự động chuyển về `DEFAULT_MONGODB_URI` ở máy Local.
 */
export async function connectDb(uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI) {
  // Kiểm tra trạng thái kết nối hiện tại của Mongoose:
  // (0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting)
  // Nếu readyState === 1 nghĩa là kết nối đã sẵn sàng -> trả về luôn để tái sử dụng, tránh mở kết nối trùng lặp
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Thực hiện mở kết nối bất đồng bộ tới MongoDB
  await mongoose.connect(uri);
  return mongoose.connection;
}

/**
 * Ngắt kết nối Mongoose an toàn khi tắt máy chủ hoặc kết thúc kịch bản nạp dữ liệu (seed).
 */
export async function disconnectDb() {
  // Chỉ gọi disconnect khi kết nối chưa ở trạng thái đóng hoàn toàn (khác 0)
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
