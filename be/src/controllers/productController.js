/**
 * ============================================================================
 * FILE: src/controllers/productController.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Điều khiển Nghiệp vụ (`Controller`).
 * Xử lý truy vấn Cửa hàng hoa: kết hợp linh hoạt Lọc danh mục (`categorySlug`),
 * Tìm kiếm từ khóa bằng biểu thức chính quy (`?search=`), Sắp xếp (`?sort=`),
 * Giới hạn số lượng (`?limit=`) và Xem chi tiết bó hoa theo SEO Slug / ID.
 * ============================================================================
 */

import { ProductModel } from '../models/Product.js';
import { findBySlugOrId } from '../utils/lookup.js';

// Bảng ánh xạ từ khóa sắp xếp trên URL sang quy tắc sort tương ứng của MongoDB
// (1 = tăng dần, -1 = giảm dần; dùng `priceValue` kiểu số để so sánh giá chính xác tuyệt đối)
const SORT_MAP = {
  newest: { id: -1 }, // Mới nhất lên đầu
  bestseller: { sold: -1, id: -1 }, // Bán chạy nhất lên đầu
  promotion: { discount: -1, id: -1 }, // Ưu đãi giảm sâu nhất lên đầu
  'price-asc': { priceValue: 1, id: -1 }, // Giá thấp đến cao
  'price-desc': { priceValue: -1, id: -1 }, // Giá cao xuống thấp
};

/**
 * API: GET /api/products
 * Lọc danh sách hoa theo `categorySlug` (hoặc tên `category`), tìm kiếm theo `?search=`,
 * sắp xếp theo `?sort=` và giới hạn kết quả với `?limit=`.
 */
export async function getProducts(req, res, next) {
  try {
    const filter = {};

    // Đọc và chuẩn hóa các tham số lọc từ URL Query Parameters
    const categorySlug =
      typeof req.query.categorySlug === 'string' ? req.query.categorySlug.trim().toLowerCase() : '';
    const category =
      typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    // Bước 1: Lọc theo danh mục — ưu tiên khóa ngoại chuẩn SEO `categorySlug` (bỏ qua nếu chọn 'tat-ca')
    if (categorySlug && categorySlug !== 'tat-ca') {
      filter.categorySlug = categorySlug;
    } else if (category && category !== 'Tất cả') {
      filter.category = category;
    }

    // Bước 2: Tìm kiếm theo từ khóa `?search=` (hỗ trợ cả tiếng Việt có dấu lẫn chuỗi không dấu nhờ đối chiếu cả trường `slug`)
    if (search) {
      // Escape các ký tự đặc biệt của Regex (như +, *, ?, (, )...) để tránh lỗi cú pháp RegExp hoặc tấn công ReDoS
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Cờ 'i' giúp tìm kiếm không phân biệt chữ hoa / chữ thường
      const regex = new RegExp(escaped, 'i');
      // Toán tử $or khớp từ khóa trên bất kỳ 1 trong 4 trường: tên hoa, danh mục, mô tả hoặc slug
      filter.$or = [
        { name: regex },
        { category: regex },
        { description: regex },
        { slug: regex },
      ];
    }

    // Bước 3: Chọn tiêu chí sắp xếp từ SORT_MAP (nếu truyền sai khóa thì mặc định quay về 'newest')
    const sortKey = typeof req.query.sort === 'string' ? req.query.sort.trim() : 'newest';
    const sortSpec = SORT_MAP[sortKey] ?? SORT_MAP.newest;

    // Bước 4: Khởi tạo câu truy vấn và áp dụng giới hạn số lượng `?limit=` nếu có
    const query = ProductModel.find(filter).sort(sortSpec);
    const limitNum = Number(req.query.limit);
    if (Number.isInteger(limitNum) && limitNum > 0) {
      query.limit(limitNum);
    }

    // Thực thi truy vấn với .lean() để trả về mảng JSON tốc độ cao
    const items = await query.lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/**
 * API: GET /api/products/:slugOrId
 * Lấy chi tiết 1 mẫu hoa cụ thể dựa vào đường dẫn tĩnh SEO (`slug`) hoặc mã số (`id`).
 */
export async function getProductDetail(req, res, next) {
  try {
    const doc = await findBySlugOrId(ProductModel, req.params.slugOrId);
    if (!doc) {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm trong MongoDB.' });
      return;
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
}
