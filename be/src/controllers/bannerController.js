/**
 * ============================================================================
 * FILE: src/controllers/bannerController.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Điều khiển Nghiệp vụ (`Controller`).
 * Xử lý yêu cầu HTTP liên quan đến danh sách Banner quảng bá trên Trang chủ.
 * ============================================================================
 */

import { BannerModel } from '../models/Banner.js';

/**
 * API: GET /api/banners
 * Lấy danh sách các banner đang bật hiển thị (`isActive: true`), sắp xếp theo thứ tự ưu tiên
 * và hỗ trợ giới hạn số lượng qua tham số truy vấn `?limit=`.
 */
export async function getBanners(req, res, next) {
  try {
    // Đọc tham số ?limit= trên URL (nếu có) và ép kiểu sang số
    const limitNum = Number(req.query.limit);

    // Chỉ truy vấn các banner đang kích hoạt, ưu tiên order tăng dần rồi tới id mới nhất giảm dần
    const query = BannerModel.find({ isActive: true }).sort({ order: 1, id: -1 });

    // Nếu người gọi truyền ?limit= là số nguyên dương hợp lệ thì giới hạn số bản ghi trả về
    if (Number.isInteger(limitNum) && limitNum > 0) {
      query.limit(limitNum);
    }

    // Dùng .lean() để Mongoose trả về Plain JS Object nhẹ nhàng, tăng tốc độ phản hồi JSON
    const items = await query.lean();
    res.json(items);
  } catch (err) {
    // Chuyển mọi lỗi phát sinh về Middleware bắt lỗi tập trung ở app.js
    next(err);
  }
}
