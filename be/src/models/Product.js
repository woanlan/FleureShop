/**
 * ============================================================================
 * FILE: src/models/Product.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Mô hình Dữ liệu (`Model`).
 * Định nghĩa cấu trúc bảng Sản phẩm hoa tươi (collection `products`) — bảng trung tâm
 * phục vụ hiển thị cửa hàng, lọc danh mục, tìm kiếm, sắp xếp giá và tính tiền đơn hàng.
 * ============================================================================
 */

import mongoose from 'mongoose';

// Khai báo Schema quản lý thông tin từng thiết kế hoa tại FLEURÉ
const productSchema = new mongoose.Schema(
  {
    // Mã sản phẩm số nguyên duy nhất (dùng để tham chiếu giỏ hàng và liên kết bài viết/video)
    id: { type: Number, required: true, unique: true, index: true },
    // Tên bó hoa / giỏ hoa / chậu lan
    name: { type: String, required: true, trim: true },
    // Đường dẫn tĩnh chuẩn SEO duy nhất trên URL (ví dụ: 'bo-hoa-diu-ngot-pastel-fleure')
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    // Khóa ngoại dạng số trỏ về `Category.id`
    categoryId: { type: Number, required: true, index: true },
    // Tên danh mục tiếng Việt — giới hạn `enum` đúng 5 dòng hoa kinh doanh của tiệm
    category: {
      type: String,
      required: true,
      enum: ['Hoa sinh nhật', 'Hoa tình yêu', 'Hoa chúc mừng', 'Hoa cưới', 'Lan hồ điệp'],
    },
    // Khóa ngoại dạng chuỗi SEO (`Category.slug`) giúp lọc nhanh sản phẩm theo URL `?categorySlug=hoa-tinh-yeu`
    categorySlug: { type: String, required: true, index: true, trim: true },
    // Chuỗi giá bán đã định dạng để hiển thị ngay lên giao diện (ví dụ: '390.000đ')
    price: { type: String, required: true },
    // Chuỗi giá gốc trước khi giảm (để gạch ngang khi có khuyến mãi, rỗng nếu không giảm giá)
    oldPrice: { type: String, default: '' },
    // Giá bán kiểu số nguyên (VNĐ) — cực kỳ quan trọng để sắp xếp giá tăng/giảm và tính tổng tiền đơn hàng trên Server
    priceValue: { type: Number, required: true, min: 0 },
    // Giá gốc kiểu số nguyên (VNĐ) dùng để đối chiếu mức tiết kiệm
    oldPriceValue: { type: Number, required: true, min: 0 },
    // Đường dẫn hình ảnh sản phẩm
    image: { type: String, required: true },
    // Mô tả chi tiết thành phần hoa, giấy gói và độ bền tươi
    description: { type: String, required: true },
    // Thông điệp cảm xúc & ý nghĩa trao tặng của bó hoa
    meaning: { type: String, required: true },
    // Phần trăm giảm giá (từ 0% đến 100%) phục vụ lọc sản phẩm đang Flash Sale
    discount: { type: Number, default: 0, min: 0, max: 100 },
    // Số lượng bó đã bán ra — dùng để xếp hạng mục "Sản phẩm bán chạy" (Best Seller)
    sold: { type: Number, default: 0, min: 0 },
    // Ngày ra mắt mẫu hoa (định dạng YYYY-MM-DD)
    createdAt: { type: String, required: true },
    // Nhãn góc trên thẻ sản phẩm (ví dụ: 'NEW' hoặc '-25%')
    badge: { type: String },
    // Tên class CSS định kiểu màu sắc cho nhãn badge trên giao diện Frontend
    badgeClass: { type: String },
  },
  {
    // Ẩn trường `__v` mặc định của Mongoose
    versionKey: false,
  }
);

// Xuất Model 'Product' quản lý collection 'products' trong MongoDB
export const ProductModel = mongoose.model('Product', productSchema);
