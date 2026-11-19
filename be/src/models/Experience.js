/**
 * ============================================================================
 * FILE: src/models/Experience.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Mô hình Dữ liệu (`Model`).
 * Định nghĩa cấu trúc bảng video trải nghiệm & hướng dẫn cắm hoa (collection `experiences`),
 * phục vụ trang Góc Trải Nghiệm Atelier FLEURÉ.
 * ============================================================================
 */

import mongoose from 'mongoose';

// Khai báo Schema cho từng Video trải nghiệm thực tế & hướng dẫn chăm sóc hoa
const experienceSchema = new mongoose.Schema(
  {
    // Mã định danh số nguyên duy nhất của video trải nghiệm
    id: { type: Number, required: true, unique: true, index: true },
    // Tiêu đề chính của buổi workshop hoặc video hướng dẫn
    title: { type: String, required: true, trim: true },
    // Đường dẫn tĩnh chuẩn SEO duy nhất tạo từ tiêu đề để truy cập trang chi tiết thân thiện
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    // Tóm tắt ngắn gọn nội dung hoặc cảm hứng của video
    subtitle: { type: String, required: true },
    // Nhóm chủ đề video — ràng buộc `enum` chỉ chấp nhận đúng 1 trong 3 chuyên mục hợp lệ
    category: {
      type: String,
      required: true,
      enum: ['Kỹ thuật bó hoa', 'Chăm hoa tại nhà', 'Atelier FLEURÉ'],
    },
    // Thời lượng phát video hiển thị trên thẻ (ví dụ: '00:08')
    duration: { type: String, required: true },
    // Số lượt xem video (ràng buộc min: 0 không cho phép số âm)
    views: { type: Number, default: 0, min: 0 },
    // Ảnh bìa xem trước (Thumbnail / Poster) trước khi người dùng bấm phát video
    posterImage: { type: String, required: true },
    // Đường dẫn tới tệp video MP4 trình chiếu trên giao diện
    videoUrl: { type: String, required: true },
    // Mảng chuỗi liệt kê từng bước thực hiện cụ thể trong video hướng dẫn
    steps: { type: [String], required: true },
    // Mã ID sản phẩm hoa thực tế được sử dụng trong video (liên kết sang bảng Products để gợi ý mua nhanh)
    linkedProductId: { type: Number, required: true },
    // Ngày đăng tải video (định dạng YYYY-MM-DD)
    publishedAt: { type: String, required: true },
  },
  {
    // Ẩn trường `__v` mặc định của Mongoose
    versionKey: false,
  }
);

// Xuất Model 'Experience' ánh xạ tới collection 'experiences' trong MongoDB
export const ExperienceModel = mongoose.model('Experience', experienceSchema);
