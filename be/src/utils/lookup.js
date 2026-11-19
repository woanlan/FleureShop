/**
 * ============================================================================
 * FILE: src/utils/lookup.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Hàm Tiện Ích Dùng Chung (`Utils`).
 * Cung cấp hàm tra cứu linh hoạt 1 bản ghi bất kỳ trong MongoDB bằng cả đường dẫn
 * chuẩn SEO (`slug`) lẫn mã định danh số nguyên (`id`).
 * ============================================================================
 */

/**
 * Tìm một document trong Model dựa trên chuỗi đầu vào `rawSlugOrId`:
 * - Bước 1: Ưu tiên dò theo trường `slug` (chữ thường) phục vụ URL thân thiện SEO.
 * - Bước 2: Nếu không khớp slug, kiểm tra nếu đầu vào là số nguyên dương thì dò theo trường `id`.
 * - Bước 3: Trả về `null` nếu không tìm thấy để Controller chủ động báo lỗi HTTP 404.
 */
export async function findBySlugOrId(Model, rawSlugOrId) {
  // Chuẩn hóa tham số truyền vào thành chuỗi và loại bỏ khoảng trắng hai đầu
  const key = String(rawSlugOrId ?? '').trim();
  if (!key) {
    return null;
  }

  // Ưu tiên tìm theo đường dẫn tĩnh slug (ví dụ: '/api/products/bo-hoa-diu-ngot-pastel-fleure')
  const bySlug = await Model.findOne({ slug: key.toLowerCase() }).lean();
  if (bySlug) {
    return bySlug;
  }

  // Dự phòng tìm theo mã số nguyên dương (ví dụ: '/api/products/12' khi liên kết từ bài viết/video)
  const numId = Number(key);
  if (Number.isInteger(numId) && numId > 0) {
    return Model.findOne({ id: numId }).lean();
  }

  return null;
}
