import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    priceValue: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    customer: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      note: { type: String, default: '', trim: true },
    },
    items: { type: [orderItemSchema], required: true },
    voucherCode: { type: String, default: null },
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    status: { type: String, default: 'Đã tiếp nhận' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const OrderModel = mongoose.model('Order', orderSchema);
