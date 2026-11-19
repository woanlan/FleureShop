/**
 * ============================================================================
 * FILE: src/models/Order.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Mô hình Dữ liệu (`Model`).
 * Định nghĩa cấu trúc lưu trữ Đơn đặt hoa (collection `orders`), bao gồm thông tin
 * người nhận, danh sách sản phẩm đã chụp nhanh giá tại thời điểm mua (snapshot) và hóa đơn.
 * ============================================================================
 */

import mongoose from 'mongoose';

/**
 * Schema con (Sub-document) mô tả từng dòng sản phẩm nằm bên trong đơn hàng.
 * Lưu lại bản chụp tên, ảnh, giá hiển thị và giá số tại thời điểm đặt để sau này shop đổi giá
 * thì lịch sử hóa đơn cũ của khách vẫn giữ nguyên chính xác.
 */
const orderItemSchema = new mongoose.Schema(
  {
    // Mã sản phẩm gốc liên kết tới bảng Products
    productId: { type: Number, required: true },
    // Tên bó hoa tại thời điểm khách đặt mua
    name: { type: String, required: true },
    // Chuỗi giá hiển thị có định dạng tiền Việt (ví dụ: '390.000đ')
    price: { type: String, required: true },
    // Giá trị số thực tế (VNĐ) lấy từ MongoDB để nhân với số lượng thành tiền
    priceValue: { type: Number, required: true, min: 0 },
    // Đường dẫn ảnh đại diện của bó hoa
    image: { type: String, required: true },
    // Số lượng đặt mua (tối thiểu từ 1 bó trở lên)
    quantity: { type: Number, required: true, min: 1 },
  },
  // Tắt tự sinh `_id` riêng cho từng dòng hàng con giúp document đơn hàng gọn nhẹ
  { _id: false }
);

/**
 * Schema chính của bảng Đơn hàng (`orders`).
 */
const orderSchema = new mongoose.Schema(
  {
    // Mã vận đơn / hóa đơn duy nhất dễ đọc cho khách tra cứu (ví dụ: 'FL-849201')
    orderCode: { type: String, required: true, unique: true, index: true },
    // Đường dẫn tĩnh chuẩn SEO duy nhất được chuyển đổi từ mã đơn hàng (ví dụ: 'fl-849201')
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    // Thông tin người nhận hoa (bắt buộc nhập họ tên, SĐT, địa chỉ giao; lời nhắn thiệp là tùy chọn)
    customer: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      note: { type: String, default: '', trim: true },
    },
    // Danh sách các mặt hàng hoa khách đặt (nhúng mảng orderItemSchema ở trên)
    items: { type: [orderItemSchema], required: true },
    // Mã giảm giá hợp lệ đã áp dụng (lưu null nếu không dùng mã hoặc mã không đủ điều kiện)
    voucherCode: { type: String, default: null },
    // Tạm tính tiền hàng trước khi trừ khuyến mãi và cộng phí giao hàng
    subtotal: { type: Number, required: true, min: 0 },
    // Số tiền được giảm nhờ mã voucher
    discountAmount: { type: Number, required: true, min: 0 },
    // Phí vận chuyển nội thành (0đ nếu đơn >= 399.000đ hoặc dùng mã FREESHIP60, ngược lại 25.000đ)
    shippingFee: { type: Number, required: true, min: 0 },
    // Tổng thanh toán cuối cùng khách phải trả (subtotal - discountAmount + shippingFee)
    grandTotal: { type: Number, required: true, min: 0 },
    // Trạng thái xử lý đơn hàng mặc định ngay khi tiếp nhận thành công
    status: { type: String, default: 'Đã tiếp nhận' },
  },
  {
    // Tự động sinh thêm 2 trường thời gian `createdAt` (lúc đặt đơn) và `updatedAt` (lúc cập nhật)
    timestamps: true,
    // Bỏ trường `__v` không cần thiết
    versionKey: false,
  }
);

// Xuất Model 'Order' quản lý collection 'orders' trong MongoDB
export const OrderModel = mongoose.model('Order', orderSchema);
