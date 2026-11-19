import { OrderModel } from '../models/Order.js';
import { ProductModel } from '../models/Product.js';
import { calculateOrderTotals, createOrderCode } from '../utils/orderPricing.js';
import { toSlug } from '../utils/slugify.js';

/** GET /api/orders - Lists recent saved orders from MongoDB. */
export async function getOrders(_req, res, next) {
  try {
    const orders = await OrderModel.find({}).sort({ createdAt: -1 }).limit(20).lean();
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

/** POST /api/orders - Validates customer, verifies MongoDB prices/vouchers, and persists order. */
export async function createOrder(req, res, next) {
  try {
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const rawCustomer = req.body?.customer ?? {};
    const fullName = String(rawCustomer.fullName ?? '').trim();
    const phone = String(rawCustomer.phone ?? '').trim();
    const address = String(rawCustomer.address ?? '').trim();
    const note = String(rawCustomer.note ?? '').trim();

    if (!fullName || !phone || !address) {
      res.status(400).json({
        message: 'Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ giao hoa.',
      });
      return;
    }

    if (rawItems.length === 0) {
      res.status(400).json({ message: 'Giỏ hàng trống, không thể tạo đơn hàng.' });
      return;
    }

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

    const requestedIds = [...normalizedQuantities.keys()];
    const dbProducts = await ProductModel.find({ id: { $in: requestedIds } }).lean();
    const productById = new Map(dbProducts.map((p) => [p.id, p]));

    if (productById.size !== requestedIds.length) {
      res.status(400).json({ message: 'Có sản phẩm không còn tồn tại trong cơ sở dữ liệu.' });
      return;
    }

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

    const totals = calculateOrderTotals(subtotal, req.body?.voucherCode);
    const orderCode = createOrderCode();
    const created = await OrderModel.create({
      orderCode,
      slug: toSlug(orderCode),
      customer: { fullName, phone, address, note },
      items: verifiedItems,
      ...totals,
    });

    res.status(201).json(created.toObject());
  } catch (err) {
    next(err);
  }
}
