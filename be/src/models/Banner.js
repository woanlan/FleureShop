/**
 * ============================================================================
 * FILE: src/models/Banner.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Mô hình Dữ liệu (`Model`).
 * Định nghĩa cấu trúc bảng (collection `banners`) lưu trữ các slide trình chiếu
 * đầu trang chủ (Hero Carousel) kèm nút kêu gọi hành động (CTA).
 * ============================================================================
 */

import mongoose from 'mongoose';

// Khai báo Schema kiểm tra kiểu dữ liệu và ràng buộc cho từng Banner quảng bá
const bannerSchema = new mongoose.Schema(
  {
    // Mã định danh số nguyên duy nhất, đánh chỉ mục (index) để truy vấn nhanh
    id: { type: Number, required: true, unique: true, index: true },
    // Đường dẫn tĩnh chuẩn SEO duy nhất (ví dụ: 'flash-sale-30-uu-dai-cuoi-tuan')
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    // Nhãn nổi bật phía trên tiêu đề (ví dụ: 'FLEURÉ Signature', 'Flash Sale -30%')
    badge: { type: String, required: true, trim: true },
    // Tiêu đề chính cỡ lớn hiển thị trên Hero Banner
    title: { type: String, required: true },
    // Dòng mô tả phụ giải thích thông điệp ưu đãi / dịch vụ giao hoa
    subtitle: { type: String, required: true },
    // Chữ hiển thị trên nút bấm kêu gọi hành động (Call-To-Action)
    ctaLabel: { type: String, required: true },
    // Đường dẫn điều hướng nội bộ trong Angular Router khi bấm nút (ví dụ: '/products', '/promotions')
    ctaRoute: { type: String, required: true },
    // Đường dẫn ảnh nền chất lượng cao của slide banner
    image: { type: String, required: true },
    // Thứ tự ưu tiên hiển thị trên thanh trượt (số nhỏ xuất hiện trước)
    order: { type: Number, default: 1 },
    // Cờ bật/tắt hiển thị banner (chỉ những banner có isActive: true mới được trả về trang chủ)
    isActive: { type: Boolean, default: true },
  },
  {
    // Tắt trường `__v` mặc định của Mongoose để dữ liệu JSON trả về cho Frontend gọn sạch
    versionKey: false,
  }
);

// Biên dịch Schema thành Model 'Banner' ánh xạ tới collection 'banners' trong MongoDB
export const BannerModel = mongoose.model('Banner', bannerSchema);
