/** Looks up a MongoDB document by SEO slug first, falling back to positive numeric id. */
export async function findBySlugOrId(Model, rawSlugOrId) {
  const key = String(rawSlugOrId ?? '').trim();
  if (!key) {
    return null;
  }

  const bySlug = await Model.findOne({ slug: key.toLowerCase() }).lean();
  if (bySlug) {
    return bySlug;
  }

  const numId = Number(key);
  if (Number.isInteger(numId) && numId > 0) {
    return Model.findOne({ id: numId }).lean();
  }

  return null;
}
