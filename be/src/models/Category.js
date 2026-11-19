import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    order: { type: Number, default: 0 },
    icon: { type: String, default: 'flower' },
    description: { type: String, default: '' },
  },
  {
    versionKey: false,
  }
);

export const CategoryModel = mongoose.model('Category', categorySchema);
