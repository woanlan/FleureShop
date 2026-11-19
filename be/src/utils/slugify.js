/**
 * ============================================================================
 * FILE: src/utils/slugify.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Hàm Tiện Ích Chuẩn Hóa Chuỗi (`Utils`).
 * Chuyển đổi tiêu đề tiếng Việt có dấu thành đường dẫn tĩnh (URL Slug) chuẩn SEO,
 * ví dụ: "Bó Hoa Dịu Ngọt" -> "bo-hoa-diu-ngot".
 * ============================================================================
 */

/**
 * Chuyển chuỗi tiếng Việt bất kỳ thành chuỗi slug chữ thường, không dấu, ngăn cách bởi dấu gạch ngang `-`.
 */
export function toSlug(input) {
  return String(input ?? '')
    .normalize('NFD') // Tách ký tự chữ cái gốc và dấu thanh tiếng Việt thành các mã Unicode rời nhau
    .replace(/[\u0300-\u036f]/g, '') // Xóa toàn bộ các dấu thanh vừa tách (sắc, huyền, hỏi, ngã, nặng, mũ, móc...)
    .replace(/đ/g, 'd') // Chuyển chữ 'đ' tiếng Việt sang 'd' Latin
    .replace(/Đ/g, 'D') // Chuyển chữ 'Đ' hoa tiếng Việt sang 'D' Latin
    .toLowerCase() // Đưa toàn bộ chuỗi về chữ thường
    .replace(/[^a-z0-9]+/g, '-') // Thay khoảng trắng và mọi ký tự đặc biệt liên tiếp bằng 1 dấu gạch ngang '-'
    .replace(/^-+|-+$/g, ''); // Cắt bỏ dấu gạch ngang thừa ở sát đầu hoặc sát cuối chuỗi
}
