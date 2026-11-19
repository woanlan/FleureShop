import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    badge: { type: String, required: true, trim: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    ctaLabel: { type: String, required: true },
    ctaRoute: { type: String, required: true },
    image: { type: String, required: true },
    order: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  {
    versionKey: false,
  }
);

export const BannerModel = mongoose.model('Banner', bannerSchema);
