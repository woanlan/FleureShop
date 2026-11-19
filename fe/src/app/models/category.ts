/**
 * Mô hình dữ liệu Danh mục sản phẩm hoa tươi (`Category`).
 * Phục vụ hiển thị thanh lọc danh mục và điều hướng URL chuẩn SEO `/category/:slug`.
 */
export interface Category {
  id: number;            // Mã số danh mục
  name: string;          // Tên danh mục hiển thị (ví dụ: "Hoa sinh nhật", "Hoa tình yêu")
  slug: string;          // Chuỗi không dấu dùng trên URL (ví dụ: "hoa-sinh-nhat")
  order: number;         // Thứ tự sắp xếp danh mục trên giao diện
  icon: string;          // Tên biểu tượng Lucide hiển thị kèm danh mục
  description?: string;  // Mô tả ngắn tùy chọn giới thiệu về nhóm hoa
}
