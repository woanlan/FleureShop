import { CategoryModel } from '../models/Category.js';
import { findBySlugOrId } from '../utils/lookup.js';

/** GET /api/categories - Lists all categories ordered for display. */
export async function getCategories(_req, res, next) {
  try {
    const items = await CategoryModel.find({}).sort({ order: 1, id: 1 }).lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/** GET /api/categories/:slugOrId - Resolves a single category by slug or id. */
export async function getCategoryDetail(req, res, next) {
  try {
    const doc = await findBySlugOrId(CategoryModel, req.params.slugOrId);
    if (!doc) {
      res.status(404).json({ message: 'Không tìm thấy danh mục trong MongoDB.' });
      return;
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
}
