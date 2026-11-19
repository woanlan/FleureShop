/**
 * ============================================================================
 * FILE: src/seed.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Kịch bản Khởi tạo Dữ liệu Mẫu (Database Seeder).
 * Hỗ trợ 2 chế độ:
 *   1. Chạy độc lập bằng lệnh `npm run seed` để làm mới toàn bộ dữ liệu danh mục.
 *   2. Được gọi tự động từ `server.js` qua `ensureSeeded()` nếu DB mới tạo chưa có dữ liệu.
 * Lưu ý: Không xóa bảng `orders` để giữ lại lịch sử đơn đặt hoa thật của khách.
 * ============================================================================
 */

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

/**
 * Xóa sạch dữ liệu cũ và nạp mới đồng loạt 5 bảng danh mục (mỗi bản ghi đều có sẵn slug chuẩn SEO).
 */
export async function seedDatabase(uri) {
  await connectDb(uri);

  // Chạy song song lệnh xóa dữ liệu cũ ở 5 collection bằng Promise.all để rút ngắn thời gian chờ
  await Promise.all([
    CategoryModel.deleteMany({}),
    BannerModel.deleteMany({}),
    ProductModel.deleteMany({}),
    PostModel.deleteMany({}),
    ExperienceModel.deleteMany({}),
  ]);

  // Chèn đồng loạt dữ liệu mẫu chuẩn vào 5 collection tương ứng trong MongoDB
  const [categories, banners, products, posts, experiences] = await Promise.all([
    CategoryModel.insertMany(CATEGORIES_SEED),
    BannerModel.insertMany(BANNERS_SEED),
    ProductModel.insertMany(PRODUCTS_SEED),
    PostModel.insertMany(POSTS_SEED),
    ExperienceModel.insertMany(EXPERIENCES_SEED),
  ]);

  // Trả về số lượng bản ghi đã nạp thành công để ghi log báo cáo
  return {
    categories: categories.length,
    banners: banners.length,
    products: products.length,
    posts: posts.length,
    experiences: experiences.length,
  };
}

/**
 * Kiểm tra khi khởi động server: Tự động nạp dữ liệu mẫu nếu bảng trống
 * hoặc phát hiện dữ liệu phiên bản cũ chưa có trường `slug`.
 */
export async function ensureSeeded(uri) {
  await connectDb(uri);

  // Đếm song song số lượng danh mục, banner và số sản phẩm bị thiếu trường slug
  const [catCount, bannerCount, missingSlugCount] = await Promise.all([
    CategoryModel.countDocuments(),
    BannerModel.countDocuments(),
    ProductModel.countDocuments({ slug: { $exists: false } }),
  ]);

  // Nếu thiếu dữ liệu hoặc cấu trúc cũ chưa có slug -> tiến hành nạp lại bộ dữ liệu mẫu chuẩn
  if (catCount === 0 || bannerCount === 0 || missingSlugCount > 0) {
    return seedDatabase(uri);
  }

  // Nếu dữ liệu đã đầy đủ và hợp lệ -> bỏ qua không ghi đè, trả về null
  return null;
}

// Kiểm tra xem file này đang được chạy trực tiếp bằng lệnh `node src/seed.js` hay được import từ file khác
const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

// Nếu sinh viên chạy lệnh `npm run seed` trực tiếp trên Terminal thì thực thi nạp dữ liệu rồi đóng kết nối DB
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
