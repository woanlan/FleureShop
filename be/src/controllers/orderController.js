/**
 * ============================================================================
 * FILE: src/controllers/orderController.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Điều khiển Nghiệp vụ (`Controller`).
 * Xử lý luồng Đặt hàng & Tra cứu đơn hàng: Kiểm tra hợp lệ thông tin người nhận,
 * truy vấn lại giá gốc sản phẩm từ MongoDB (chống gian lận sửa giá ở Client),
 * tính toán mã giảm giá / phí giao hàng trên Server rồi lưu vào bảng `orders`.
 * ============================================================================
 */

import { OrderModel } from '../models/Order.js';
import { ProductModel } from '../models/Product.js';
import { calculateOrderTotals, createOrderCode } from '../utils/orderPricing.js';
import { toSlug } from '../utils/slugify.js';

/**
 * API: GET /api/orders
 * Lấy danh sách 20 đơn đặt hoa mới nhất từ MongoDB (sắp xếp theo thời gian tạo giảm dần).
 */
export async function getOrders(_req, res, next) {
  try {
    const orders = await OrderModel.find({}).sort({ createdAt: -1 }).limit(20).lean();
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

/**
 * API: POST /api/orders
 * Tiếp nhận yêu cầu đặt hoa từ trang Thanh toán (Checkout), xác thực chặt chẽ dữ liệu,
 * tự tính lại toàn bộ tiền hàng dựa trên giá chuẩn trong MongoDB và lưu hóa đơn mới.
 */
export async function createOrder(req, res, next) {
  try {
    // Bước 1: Đọc danh sách sản phẩm đặt mua và làm sạch chuỗi thông tin người nhận từ req.body
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const rawCustomer = req.body?.customer ?? {};
    const fullName = String(rawCustomer.fullName ?? '').trim();
    const phone = String(rawCustomer.phone ?? '').trim();
    const address = String(rawCustomer.address ?? '').trim();
    const note = String(rawCustomer.note ?? '').trim();

    // Bước 2: Kiểm tra bắt buộc phải có đủ Họ tên, Số điện thoại và Địa chỉ giao hoa
    if (!fullName || !phone || !address) {
      res.status(400).json({
        message: 'Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ giao hoa.',
      });
      return;
    }

    // Không cho phép tạo đơn nếu mảng giỏ hàng gửi lên bị rỗng
    if (rawItems.length === 0) {
      res.status(400).json({ message: 'Giỏ hàng trống, không thể tạo đơn hàng.' });
      return;
    }

    // Bước 3: Kiểm tra tính hợp lệ của từng productId & số lượng, đồng thời cộng dồn nếu trùng mã sản phẩm
    const normalizedQuantities = new Map();
    for (const entry of rawItems) {
      const productId = Number(entry?.productId);
      const qty = Math.floor(Number(entry?.quantity));
      if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(qty) || qty <= 0) {
        res.status(400).json({ message: 'Dữ liệu sản phẩm trong đơn hàng không hợp lệ.' });
        return;
      }
      normalizedQuantities.set(productId, (normalizedQuantities.get(productId) ?? 0) + qty);
    }

    // Bước 4: BẢO MẬT GIÁ TIỀN — Truy vấn lại thông tin & đơn giá thật từ bảng Products trong MongoDB
    // Tuyệt đối KHÔNG tin tưởng đơn giá hay tổng tiền do phía trình duyệt (Client) gửi lên!
    const requestedIds = [...normalizedQuantities.keys()];
    const dbProducts = await ProductModel.find({ id: { $in: requestedIds } }).lean();
    const productById = new Map(dbProducts.map((p) => [p.id, p]));

    // Nếu số sản phẩm tìm thấy trong DB ít hơn số mã khách gửi -> có mã sản phẩm ảo hoặc đã ngừng bán
    if (productById.size !== requestedIds.length) {
      res.status(400).json({ message: 'Có sản phẩm không còn tồn tại trong cơ sở dữ liệu.' });
      return;
    }

    // Bước 5: Tính tổng tiền hàng tạm tính (subtotal) bằng giá chuẩn `p.priceValue` từ MongoDB
    let subtotal = 0;
    const verifiedItems = requestedIds.map((productId) => {
      const p = productById.get(productId);
      const quantity = normalizedQuantities.get(productId);
      subtotal += p.priceValue * quantity;
      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        priceValue: p.priceValue,
        image: p.image,
        quantity,
      };
    });

    // Bước 6: Áp dụng mã giảm giá (voucher), tính phí vận chuyển và tổng thanh toán qua hàm tiện ích
    const totals = calculateOrderTotals(subtotal, req.body?.voucherCode);

    // Bước 7: Sinh mã vận đơn duy nhất (VD: FL-123456) kèm slug tương ứng và lưu vào collection `orders`
    const orderCode = createOrderCode();
    const created = await OrderModel.create({
      orderCode,
      slug: toSlug(orderCode),
      customer: { fullName, phone, address, note },
      items: verifiedItems,
      ...totals,
    });

    // Trả mã HTTP 201 (Created) kèm toàn bộ thông tin hóa đơn vừa lưu để Frontend hiển thị màn hình Đặt hàng thành công
    res.status(201).json(created.toObject());
  } catch (err) {
    next(err);
  }
}
