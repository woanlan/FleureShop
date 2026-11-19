/**
 * ============================================================================
 * FILE: src/controllers/homeController.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Điều khiển Nghiệp vụ (`Controller`).
 * Cung cấp 2 API trọng tâm:
 *   1. `/api/health`: Kiểm tra sức khỏe kết nối MongoDB và thống kê số bản ghi 6 bảng.
 *   2. `/api/home`: Gom trọn 6 phần dữ liệu của Trang chủ bằng `Promise.all` chạy song song.
 * ============================================================================
 */

import mongoose from 'mongoose';
import { BannerModel } from '../models/Banner.js';
import { CategoryModel } from '../models/Category.js';
import { ExperienceModel } from '../models/Experience.js';
import { OrderModel } from '../models/Order.js';
import { PostModel } from '../models/Post.js';
import { ProductModel } from '../models/Product.js';

/**
 * API: GET /api/health
 * Kiểm tra trạng thái sống của kết nối MongoDB và đếm số lượng bản ghi hiện có ở cả 6 collection.
 */
export async function getHealth(_req, res, next) {
  try {
    // readyState === 1 đồng nghĩa Mongoose đang kết nối thông suốt với MongoDB
    const connected = mongoose.connection.readyState === 1;

    // Nếu đã kết nối, chạy song song 6 lệnh countDocuments() để thống kê nhanh toàn bộ DB
    const [categories, banners, products, posts, experiences, orders] = connected
      ? await Promise.all([
          CategoryModel.countDocuments(),
          BannerModel.countDocuments(),
          ProductModel.countDocuments(),
          PostModel.countDocuments(),
          ExperienceModel.countDocuments(),
          OrderModel.countDocuments(),
        ])
      : [0, 0, 0, 0, 0, 0];

    // Trả mã 200 OK khi DB sẵn sàng, hoặc 503 Service Unavailable nếu mất kết nối DB
    res.status(connected ? 200 : 503).json({
      ok: connected,
      database: mongoose.connection.name || 'fleure_shop',
      counts: { categories, banners, products, posts, experiences, orders },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * API: GET /api/home
 * Endpoint chuyên biệt cho Trang chủ Angular: Sử dụng `Promise.all` để kích hoạt đồng thời
 * 6 câu truy vấn MongoDB song song (thay vì chờ tuần tự từng câu `await` một), giúp giảm mạnh
 * độ trễ mạng và tải toàn bộ Trang chủ chỉ trong 1 HTTP Request duy nhất.
 */
export async function getHomeData(_req, res, next) {
  try {
    const [
      banners,
      categories,
      newProducts,
      bestSellingProducts,
      saleProducts,
      latestPosts,
    ] = await Promise.all([
      // 1. Lấy tối đa 3 Hero Banner đang hoạt động theo thứ tự hiển thị
      BannerModel.find({ isActive: true }).sort({ order: 1, id: -1 }).limit(3).lean(),
      // 2. Lấy toàn bộ danh mục hoa để vẽ thanh chọn nhanh trên Trang chủ
      CategoryModel.find({}).sort({ order: 1, id: 1 }).lean(),
      // 3. Lấy 4 mẫu hoa mới ra mắt gần nhất (id lớn nhất)
      ProductModel.find({}).sort({ id: -1 }).limit(4).lean(),
      // 4. Lấy 4 mẫu hoa bán chạy nhất dựa trên lượt bán `sold` giảm dần
      ProductModel.find({}).sort({ sold: -1, id: -1 }).limit(4).lean(),
      // 5. Lấy 4 mẫu hoa đang khuyến mãi (`discount > 0`), ưu tiên mức giảm sâu nhất lên đầu
      ProductModel.find({ discount: { $gt: 0 } }).sort({ discount: -1, id: -1 }).limit(4).lean(),
      // 6. Lấy 3 bài viết cẩm nang hoa mới xuất bản gần đây nhất
      PostModel.find({}).sort({ publishedAt: -1, id: 1 }).limit(3).lean(),
    ]);

    // Đóng gói cả 6 tập dữ liệu vào chung 1 JSON phản hồi về cho Angular HomeComponent
    res.json({
      banners,
      categories,
      newProducts,
      bestSellingProducts,
      saleProducts,
      latestPosts,
    });
  } catch (err) {
    next(err);
  }
}
