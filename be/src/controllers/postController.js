/**
 * ============================================================================
 * FILE: src/controllers/postController.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Điều khiển Nghiệp vụ (`Controller`).
 * Quản lý việc lấy danh sách bài viết Cẩm nang hoa (hỗ trợ lọc chuyên mục)
 * và xem nội dung chi tiết từng bài viết theo đường dẫn SEO `slug` hoặc `id`.
 * ============================================================================
 */

import { PostModel } from '../models/Post.js';
import { findBySlugOrId } from '../utils/lookup.js';

/**
 * API: GET /api/posts
 * Trả về danh sách bài viết blog sắp xếp mới nhất lên đầu (`publishedAt` giảm dần),
 * có hỗ trợ lọc theo chuyên mục qua query `?category=`.
 */
export async function getPosts(req, res, next) {
  try {
    const filter = {};
    // Lấy chuyên mục cần lọc từ query string (ví dụ: ?category=Chăm sóc hoa)
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    if (category && category !== 'Tất cả') {
      filter.category = category;
    }

    // Truy vấn bài viết khớp bộ lọc, ưu tiên ngày đăng mới nhất trước
    const items = await PostModel.find(filter).sort({ publishedAt: -1, id: 1 }).lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/**
 * API: GET /api/posts/:slugOrId
 * Lấy toàn bộ nội dung bài viết, mẹo chăm hoa (`careTip`) và mã sản phẩm gợi ý theo `slug` hoặc `id`.
 */
export async function getPostDetail(req, res, next) {
  try {
    const doc = await findBySlugOrId(PostModel, req.params.slugOrId);
    // Báo lỗi 404 nếu bài viết không tồn tại trong cơ sở dữ liệu
    if (!doc) {
      res.status(404).json({ message: 'Không tìm thấy bài viết trong MongoDB.' });
      return;
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
}
