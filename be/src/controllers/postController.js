import { PostModel } from '../models/Post.js';
import { findBySlugOrId } from '../utils/lookup.js';

/** GET /api/posts - Lists blog posts sorted newest first with optional category filter. */
export async function getPosts(req, res, next) {
  try {
    const filter = {};
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    if (category && category !== 'Tất cả') {
      filter.category = category;
    }
    const items = await PostModel.find(filter).sort({ publishedAt: -1, id: 1 }).lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/** GET /api/posts/:slugOrId - Fetches a single blog post by slug or id. */
export async function getPostDetail(req, res, next) {
  try {
    const doc = await findBySlugOrId(PostModel, req.params.slugOrId);
    if (!doc) {
      res.status(404).json({ message: 'Không tìm thấy bài viết trong MongoDB.' });
      return;
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
}
