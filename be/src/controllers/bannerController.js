import { BannerModel } from '../models/Banner.js';

/** GET /api/banners - Lists active banners sorted by order (supports optional ?limit=). */
export async function getBanners(req, res, next) {
  try {
    const limitNum = Number(req.query.limit);
    const query = BannerModel.find({ isActive: true }).sort({ order: 1, id: -1 });
    if (Number.isInteger(limitNum) && limitNum > 0) {
      query.limit(limitNum);
    }
    const items = await query.lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}
