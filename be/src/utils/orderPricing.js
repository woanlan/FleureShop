/**
 * ============================================================================
 * FILE: src/utils/orderPricing.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Hàm Tiện Ích Nghiệp Vụ (`Utils`).
 * Đóng gói quy tắc tính tiền đơn hàng, kiểm tra điều kiện mã giảm giá (Voucher),
 * chính sách miễn phí giao hàng và hàm sinh mã vận đơn ngẫu nhiên trên Server.
 * ============================================================================
 */

// Tập hợp 3 mã khuyến mãi hợp lệ được hệ thống FLEURÉ chấp nhận (dùng Set để tra cứu O(1))
const VALID_VOUCHERS = new Set(['FLEURE20', 'YEUHOA15', 'FREESHIP60']);

/**
 * Tính toán chi tiết hóa đơn trên Server dựa vào tổng tiền hàng gốc (`subtotal`) từ MongoDB:
 * - `FLEURE20`: Giảm 20% tổng tiền hoa (yêu cầu đơn tối thiểu từ 450.000đ).
 * - `YEUHOA15`: Giảm 15% tổng tiền hoa cho mọi giá trị đơn hàng.
 * - `FREESHIP60`: Miễn phí giao nhanh 60 phút (ngoài ra đơn từ 399.000đ cũng tự động Freeship).
 */
export function calculateOrderTotals(subtotal, rawVoucherCode) {
  // Chuẩn hóa mã voucher khách nhập về chữ IN HOA và cắt khoảng trắng thừa
  const code = typeof rawVoucherCode === 'string' ? rawVoucherCode.trim().toUpperCase() : '';
  let appliedVoucher = null;

  // Kiểm tra mã có nằm trong danh sách hợp lệ và thỏa điều kiện giá trị đơn tối thiểu hay không
  if (code && VALID_VOUCHERS.has(code)) {
    if (code === 'FLEURE20' && subtotal < 450000) {
      appliedVoucher = null; // Chưa đủ 450.000đ nên không áp dụng mã FLEURE20
    } else {
      appliedVoucher = code;
    }
  }

  // Tính số tiền được khấu trừ theo phần trăm của từng mã giảm giá
  let discountAmount = 0;
  if (appliedVoucher === 'FLEURE20' && subtotal >= 450000) {
    discountAmount = Math.round(subtotal * 0.2);
  } else if (appliedVoucher === 'YEUHOA15') {
    discountAmount = Math.round(subtotal * 0.15);
  }

  // Tính phí giao hàng: Miễn phí (0đ) nếu dùng mã FREESHIP60 hoặc tổng tiền hoa >= 399.000đ; ngược lại thu 25.000đ
  const shippingFee =
    subtotal === 0 || appliedVoucher === 'FREESHIP60' || subtotal >= 399000 ? 0 : 25000;

  // Tổng tiền thanh toán cuối cùng (dùng Math.max(0, ...) đảm bảo không bao giờ âm)
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  return {
    voucherCode: appliedVoucher,
    subtotal,
    discountAmount,
    shippingFee,
    grandTotal,
  };
}

/**
 * Sinh mã tham chiếu đơn hàng thân thiện dễ đọc cho khách hàng (định dạng `FL-XXXXXX` gồm 6 chữ số).
 */
export function createOrderCode() {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `FL-${randomDigits}`;
}
