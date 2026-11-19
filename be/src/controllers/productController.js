import { ProductModel } from '../models/Product.js';
import { findBySlugOrId } from '../utils/lookup.js';

const SORT_MAP = {
  newest: { id: -1 },
  bestseller: { sold: -1, id: -1 },
  promotion: { discount: -1, id: -1 },
  'price-asc': { priceValue: 1, id: -1 },
  'price-desc': { priceValue: -1, id: -1 },
};

/** GET /api/products - Filters by categorySlug/category, ?search=, sort, and ?limit=. */
export async function getProducts(req, res, next) {
  try {
    const filter = {};
    const categorySlug =
      typeof req.query.categorySlug === 'string' ? req.query.categorySlug.trim().toLowerCase() : '';
    const category =
      typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    if (categorySlug && categorySlug !== 'tat-ca') {
      filter.categorySlug = categorySlug;
    } else if (category && category !== 'Tất cả') {
      filter.category = category;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { name: regex },
        { category: regex },
        { description: regex },
        { slug: regex },
      ];
    }

    const sortKey = typeof req.query.sort === 'string' ? req.query.sort.trim() : 'newest';
    const sortSpec = SORT_MAP[sortKey] ?? SORT_MAP.newest;

    const query = ProductModel.find(filter).sort(sortSpec);
    const limitNum = Number(req.query.limit);
    if (Number.isInteger(limitNum) && limitNum > 0) {
      query.limit(limitNum);
    }

    const items = await query.lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/** GET /api/products/:slugOrId - Fetches a single flower product by SEO slug or id. */
export async function getProductDetail(req, res, next) {
  try {
    const doc = await findBySlugOrId(ProductModel, req.params.slugOrId);
    if (!doc) {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm trong MongoDB.' });
      return;
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
}
