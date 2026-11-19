import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { connectDb, disconnectDb } from './config/db.js';
import { CategoryModel } from './models/Category.js';
import { BannerModel } from './models/Banner.js';
import { ProductModel } from './models/Product.js';
import { PostModel } from './models/Post.js';
import { ExperienceModel } from './models/Experience.js';
import {
  CATEGORIES_SEED,
  BANNERS_SEED,
  PRODUCTS_SEED,
  POSTS_SEED,
  EXPERIENCES_SEED,
} from './data/seedData.js';

/** Replaces all catalog collections with clean seeded data (every table includes SEO slug). */
export async function seedDatabase(uri) {
  await connectDb(uri);

  await Promise.all([
    CategoryModel.deleteMany({}),
    BannerModel.deleteMany({}),
    ProductModel.deleteMany({}),
    PostModel.deleteMany({}),
    ExperienceModel.deleteMany({}),
  ]);

  const [categories, banners, products, posts, experiences] = await Promise.all([
    CategoryModel.insertMany(CATEGORIES_SEED),
    BannerModel.insertMany(BANNERS_SEED),
    ProductModel.insertMany(PRODUCTS_SEED),
    PostModel.insertMany(POSTS_SEED),
    ExperienceModel.insertMany(EXPERIENCES_SEED),
  ]);

  return {
    categories: categories.length,
    banners: banners.length,
    products: products.length,
    posts: posts.length,
    experiences: experiences.length,
  };
}

/** Auto-seeds any empty or legacy (pre-slug) catalog collection when the server starts. */
export async function ensureSeeded(uri) {
  await connectDb(uri);

  const [catCount, bannerCount, missingSlugCount] = await Promise.all([
    CategoryModel.countDocuments(),
    BannerModel.countDocuments(),
    ProductModel.countDocuments({ slug: { $exists: false } }),
  ]);

  if (catCount === 0 || bannerCount === 0 || missingSlugCount > 0) {
    return seedDatabase(uri);
  }

  return null;
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  seedDatabase()
    .then((counts) => {
      console.log(
        `Seeded MongoDB (fleure_shop): ${counts.categories} categories, ${counts.banners} banners, ${counts.products} products, ${counts.posts} posts, ${counts.experiences} experiences.`
      );
    })
    .catch((err) => {
      console.error('MongoDB seed failed:', err);
      process.exitCode = 1;
    })
    .finally(() => disconnectDb());
}
