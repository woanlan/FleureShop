/**
 * ============================================================================
 * FILE: src/models/Post.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Mô hình Dữ liệu (`Model`).
 * Định nghĩa cấu trúc bảng Bài viết Blog / Cẩm nang hoa (collection `posts`),
 * lưu trữ kiến thức chăm sóc hoa, ý nghĩa loài hoa và xu hướng quà tặng.
 * ============================================================================
 */

import mongoose from 'mongoose';

// Khai báo Schema cho Bài viết Cẩm nang hoa tươi
const postSchema = new mongoose.Schema(
  {
    // Mã bài viết số nguyên duy nhất, có đánh chỉ mục
    id: { type: Number, required: true, unique: true, index: true },
    // Tiêu đề bài viết hiển thị trên thẻ tin tức và trang đọc bài
    title: { type: String, required: true, trim: true },
    // Đường dẫn tĩnh chuẩn SEO duy nhất tạo từ tiêu đề (ví dụ: '5-bi-quyet-giu-hoa-tuoi-lau...')
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    // Đoạn trích dẫn ngắn (sapo) hiển thị bên ngoài danh sách bài viết
    excerpt: { type: String, required: true },
    // Nội dung chi tiết bài viết được chia thành mảng các đoạn văn (`string[]`) dễ trình bày HTML
    content: { type: [String], required: true },
    // Hộp mẹo nhỏ chăm sóc hoa (Care Tip) đóng khung nổi bật cuối bài đọc
    careTip: { type: String, required: true },
    // Ảnh bìa minh họa cho bài viết
    image: { type: String, required: true },
    // Chuyên mục bài viết — kiểm soát chặt bằng `enum` gồm 4 chủ đề cố định
    category: {
      type: String,
      required: true,
      enum: ['Chăm sóc hoa', 'Ý nghĩa hoa', 'Nghệ thuật gói', 'Xu hướng'],
    },
    // Tên tác giả hoặc đội ngũ biên tập bài viết
    author: { type: String, required: true },
    // Ngày xuất bản bài viết (chuỗi YYYY-MM-DD dùng để sắp xếp bài mới nhất lên đầu)
    publishedAt: { type: String, required: true },
    // Thời gian đọc ước tính (tính bằng phút, tối thiểu 1 phút)
    readTimeMinutes: { type: Number, required: true, min: 1 },
    // Mã ID bó hoa gợi ý liên quan trực tiếp tới nội dung bài viết
    relatedProductId: { type: Number, required: true },
  },
  {
    // Ẩn trường `__v` mặc định của Mongoose
    versionKey: false,
  }
);

// Xuất Model 'Post' quản lý collection 'posts' trong MongoDB
export const PostModel = mongoose.model('Post', postSchema);
