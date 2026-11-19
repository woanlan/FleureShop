/**
 * ============================================================================
 * FILE: src/controllers/categoryController.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Điều khiển Nghiệp vụ (`Controller`).
 * Đảm nhận lấy toàn bộ danh mục hoa và tra cứu chi tiết một danh mục theo Slug hoặc ID.
 * ============================================================================
 */

import { CategoryModel } from '../models/Category.js';
import { findBySlugOrId } from '../utils/lookup.js';

/**
 * API: GET /api/categories
 * Trả về toàn bộ danh mục hoa được sắp xếp theo thứ tự hiển thị (`order` tăng dần).
 */
export async function getCategories(_req, res, next) {
  try {
    // Truy vấn tất cả danh mục, sắp xếp theo order rồi tới id, dùng .lean() để tối ưu hiệu năng đọc
    const items = await CategoryModel.find({}).sort({ order: 1, id: 1 }).lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/**
 * API: GET /api/categories/:slugOrId
 * Tìm chi tiết 1 danh mục hoa dựa trên đường dẫn tĩnh chuẩn SEO (`slug`) hoặc mã số (`id`).
 */
export async function getCategoryDetail(req, res, next) {
  try {
    // Gọi hàm tiện ích dùng chung: ưu tiên dò theo slug trước, nếu không thấy mới dò theo id số
    const doc = await findBySlugOrId(CategoryModel, req.params.slugOrId);

    // Nếu không khớp bản ghi nào trong MongoDB -> trả mã lỗi HTTP 404 (Not Found)
    if (!doc) {
      res.status(404).json({ message: 'Không tìm thấy danh mục trong MongoDB.' });
      return;
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
}
