import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    categoryId: { type: Number, required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ['Hoa sinh nhật', 'Hoa tình yêu', 'Hoa chúc mừng', 'Hoa cưới', 'Lan hồ điệp'],
    },
    categorySlug: { type: String, required: true, index: true, trim: true },
    price: { type: String, required: true },
    oldPrice: { type: String, default: '' },
    priceValue: { type: Number, required: true, min: 0 },
    oldPriceValue: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    description: { type: String, required: true },
    meaning: { type: String, required: true },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    sold: { type: Number, default: 0, min: 0 },
    createdAt: { type: String, required: true },
    badge: { type: String },
    badgeClass: { type: String },
  },
  {
    versionKey: false,
  }
);

export const ProductModel = mongoose.model('Product', productSchema);
