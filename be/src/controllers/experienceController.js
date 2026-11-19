import { ExperienceModel } from '../models/Experience.js';
import { findBySlugOrId } from '../utils/lookup.js';

/** GET /api/experiences - Lists workshop & care videos with optional category filter. */
export async function getExperiences(req, res, next) {
  try {
    const filter = {};
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    if (category && category !== 'Tất cả') {
      filter.category = category;
    }
    const items = await ExperienceModel.find(filter).sort({ id: 1 }).lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/** GET /api/experiences/:slugOrId - Fetches a single video by slug or id. */
export async function getExperienceDetail(req, res, next) {
  try {
    const doc = await findBySlugOrId(ExperienceModel, req.params.slugOrId);
    if (!doc) {
      res.status(404).json({ message: 'Không tìm thấy video trải nghiệm trong MongoDB.' });
      return;
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
}
