import mongoose from 'mongoose';
import { BannerModel } from '../models/Banner.js';
import { CategoryModel } from '../models/Category.js';
import { ExperienceModel } from '../models/Experience.js';
import { OrderModel } from '../models/Order.js';
import { PostModel } from '../models/Post.js';
import { ProductModel } from '../models/Product.js';

/** GET /api/health - Checks MongoDB connection status and counts across all 6 collections. */
export async function getHealth(_req, res, next) {
  try {
    const connected = mongoose.connection.readyState === 1;
    const [categories, banners, products, posts, experiences, orders] = connected
      ? await Promise.all([
          CategoryModel.countDocuments(),
          BannerModel.countDocuments(),
          ProductModel.countDocuments(),
          PostModel.countDocuments(),
          ExperienceModel.countDocuments(),
          OrderModel.countDocuments(),
        ])
      : [0, 0, 0, 0, 0, 0];

    res.status(connected ? 200 : 503).json({
      ok: connected,
      database: mongoose.connection.name || 'fleure_shop',
      counts: { categories, banners, products, posts, experiences, orders },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/home - Dedicated Home API returning 3 newest banners, product sections, and 3 posts. */
export async function getHomeData(_req, res, next) {
  try {
    const [
      banners,
      categories,
      newProducts,
      bestSellingProducts,
      saleProducts,
      latestPosts,
    ] = await Promise.all([
      BannerModel.find({ isActive: true }).sort({ order: 1, id: -1 }).limit(3).lean(),
      CategoryModel.find({}).sort({ order: 1, id: 1 }).lean(),
      ProductModel.find({}).sort({ id: -1 }).limit(4).lean(),
      ProductModel.find({}).sort({ sold: -1, id: -1 }).limit(4).lean(),
      ProductModel.find({ discount: { $gt: 0 } }).sort({ discount: -1, id: -1 }).limit(4).lean(),
      PostModel.find({}).sort({ publishedAt: -1, id: 1 }).limit(3).lean(),
    ]);

    res.json({
      banners,
      categories,
      newProducts,
      bestSellingProducts,
      saleProducts,
      latestPosts,
    });
  } catch (err) {
    next(err);
  }
}
