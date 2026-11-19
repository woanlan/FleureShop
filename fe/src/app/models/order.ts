/**
 * Các mô hình dữ liệu phục vụ quy trình Đặt hàng & Thanh toán (`POST /api/orders`).
 * Tách bạch rõ dữ liệu gửi đi từ Frontend (`CreateOrderPayload`) và hóa đơn đã lưu từ MongoDB (`SavedOrder`).
 */

/** Thông tin người nhận hoa nhập từ biểu mẫu đặt hàng trong trang Giỏ hàng */
export interface OrderCustomer {
  fullName: string;  // Họ và tên người nhận
  phone: string;     // Số điện thoại liên hệ giao hoa
  address: string;   // Địa chỉ nhận hoa chi tiết
  note?: string;     // Lời nhắn ghi trên thiệp hoặc lưu ý giờ giao (không bắt buộc)
}

/** Gói dữ liệu Frontend gửi lên Backend khi khách bấm nút "Xác nhận đặt hoa" */
export interface CreateOrderPayload {
  customer: OrderCustomer;                           // Thông tin khách hàng nhận hoa
  items: { productId: number; quantity: number }[];  // Danh sách mã sản phẩm và số lượng đặt mua
  voucherCode?: string | null;                       // Mã giảm giá áp dụng (nếu có)
}

/** Chi tiết từng bó hoa đã được Backend đối chiếu và chốt giá tại thời điểm tạo đơn */
export interface SavedOrderItem {
  productId: number;   // Mã định danh bó hoa
  name: string;        // Tên bó hoa lưu cứng vào hóa đơn
  price: string;       // Chuỗi giá hiển thị (ví dụ: "450.000đ")
  priceValue: number;  // Giá trị số nguyên (VNĐ) dùng để nhân số lượng
  image: string;       // Ảnh đại diện bó hoa
  quantity: number;    // Số lượng đặt mua
}

/** Đối tượng Đơn hàng hoàn chỉnh trả về sau khi lưu thành công vào MongoDB */
export interface SavedOrder {
  _id?: string;                // ObjectId tự sinh của MongoDB
  orderCode: string;           // Mã đơn hàng thân thiện cho khách tra cứu (ví dụ: FLR-...)
  customer: OrderCustomer;     // Thông tin người nhận
  items: SavedOrderItem[];     // Danh sách các bó hoa trong đơn
  voucherCode: string | null;  // Mã voucher đã áp dụng hợp lệ
  subtotal: number;            // Tạm tính tiền hàng trước giảm giá (VNĐ)
  discountAmount: number;      // Số tiền được giảm nhờ mã khuyến mãi (VNĐ)
  shippingFee: number;         // Phí giao hàng (VNĐ)
  grandTotal: number;          // Tổng số tiền thanh toán cuối cùng (VNĐ)
  status: string;              // Trạng thái đơn hàng (mặc định: chờ xác nhận / mới tạo)
  createdAt?: string;          // Thời điểm ghi nhận đơn hàng trên hệ thống
}
