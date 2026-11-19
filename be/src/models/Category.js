/**
 * ============================================================================
 * FILE: src/models/Category.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Mô hình Dữ liệu (`Model`).
 * Định nghĩa cấu trúc bảng danh mục hoa (collection `categories`) dùng cho thanh lọc
 * sản phẩm và khối danh mục nổi bật trên Trang chủ.
 * ============================================================================
 */

import mongoose from 'mongoose';

// Khai báo Schema cho Danh mục hoa (Sinh nhật, Tình yêu, Chúc mừng, Hoa cưới, Lan hồ điệp)
const categorySchema = new mongoose.Schema(
  {
    // Mã số danh mục duy nhất (khóa chính nghiệp vụ để liên kết với Product.categoryId)
    id: { type: Number, required: true, unique: true, index: true },
    // Tên hiển thị tiếng Việt của danh mục (ví dụ: 'Hoa sinh nhật')
    name: { type: String, required: true, trim: true },
    // Chuỗi đường dẫn tĩnh chuẩn SEO duy nhất (ví dụ: 'hoa-sinh-nhat'), dùng làm khóa lọc trên URL
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    // Thứ tự sắp xếp danh mục trên giao diện từ trái sang phải
    order: { type: Number, default: 0 },
    // Tên biểu tượng minh họa hiển thị kèm danh mục trên giao diện Angular
    icon: { type: String, default: 'flower' },
    // Đoạn giới thiệu ngắn gọn ý nghĩa của dòng hoa thuộc danh mục này
    description: { type: String, default: '' },
  },
  {
    // Loại bỏ trường phiên bản nội bộ `__v` của Mongoose khi lưu và xuất JSON
    versionKey: false,
  }
);

// Xuất Model 'Category' quản lý collection 'categories' trong MongoDB
export const CategoryModel = mongoose.model('Category', categorySchema);
