/**
 * ============================================================================
 * FILE: src/controllers/experienceController.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Điều khiển Nghiệp vụ (`Controller`).
 * Xử lý API danh sách và chi tiết các Video Trải Nghiệm / Hướng dẫn bó hoa Atelier.
 * ============================================================================
 */

import { ExperienceModel } from '../models/Experience.js';
import { findBySlugOrId } from '../utils/lookup.js';

/**
 * API: GET /api/experiences
 * Lấy danh sách video workshop & chăm sóc hoa, hỗ trợ lọc theo chuyên mục `?category=`.
 */
export async function getExperiences(req, res, next) {
  try {
    const filter = {};
    // Lấy giá trị tham số ?category= trên thanh địa chỉ và cắt khoảng trắng thừa
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';

    // Nếu người dùng chọn một chuyên mục cụ thể (khác 'Tất cả') thì gắn điều kiện lọc vào MongoDB query
    if (category && category !== 'Tất cả') {
      filter.category = category;
    }

    // Truy vấn danh sách video theo bộ lọc, sắp xếp id tăng dần và chuyển sang object thuần bằng .lean()
    const items = await ExperienceModel.find(filter).sort({ id: 1 }).lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/**
 * API: GET /api/experiences/:slugOrId
 * Lấy thông tin chi tiết của 1 video trải nghiệm theo đường dẫn SEO `slug` hoặc mã `id`.
 */
export async function getExperienceDetail(req, res, next) {
  try {
    const doc = await findBySlugOrId(ExperienceModel, req.params.slugOrId);
    // Trả về HTTP 404 nếu người dùng truy cập đường dẫn video không tồn tại
    if (!doc) {
      res.status(404).json({ message: 'Không tìm thấy video trải nghiệm trong MongoDB.' });
      return;
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
}
