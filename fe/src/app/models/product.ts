/**
 * Mô hình dữ liệu Sản phẩm hoa tươi (`Product`) — thực thể trung tâm của cửa hàng FLEURÉ.
 * Dùng xuyên suốt ở Trang chủ, Danh sách sản phẩm, Khuyến mãi, Chi tiết sản phẩm và Giỏ hàng.
 */

/** Các tên danh mục hoa hỗ trợ lọc nhanh trên giao diện */
export type ProductCategory =
  | 'Tất cả'
  | 'Hoa sinh nhật'
  | 'Hoa tình yêu'
  | 'Hoa chúc mừng'
  | 'Hoa cưới'
  | 'Lan hồ điệp';

/** Cấu trúc chi tiết một bó hoa lấy từ collection `products` trong MongoDB */
export interface Product {
  id: number;                                       // Mã số định danh sản phẩm
  name: string;                                     // Tên bó hoa
  slug: string;                                     // Đường dẫn SEO dùng cho `/product/:slug`
  categoryId: number;                               // Mã danh mục liên kết
  category: Exclude<ProductCategory, 'Tất cả'>;     // Tên danh mục hiển thị
  categorySlug: string;                             // Slug danh mục dùng cho `/category/:slug`
  price: string;                                    // Chuỗi giá bán đã định dạng tiền Việt (ví dụ: "490.000đ")
  oldPrice: string;                                 // Chuỗi giá gốc gạch ngang khi có khuyến mãi (rỗng nếu không giảm)
  priceValue: number;                               // Giá bán dạng số nguyên (VNĐ) dùng để tính tiền giỏ hàng & sắp xếp giá
  oldPriceValue: number;                            // Giá gốc dạng số nguyên (VNĐ)
  image: string;                                    // Đường dẫn hình ảnh bó hoa
  description: string;                              // Mô tả chi tiết thành phần hoa và phong cách gói
  meaning: string;                                  // Thông điệp / ý nghĩa gửi gắm của bó hoa
  discount: number;                                 // Phần trăm giảm giá (ví dụ: 15 tương ứng -15%)
  sold: number;                                     // Tổng số lượng bó hoa đã bán (dùng xếp hạng Bán chạy)
  createdAt: string;                                // Ngày tạo sản phẩm
  badge?: string;                                   // Nhãn nổi bật gắn trên ảnh (ví dụ: "NEW", "HOT", "-15%")
  badgeClass?: string;                              // Tên lớp CSS tô màu tương ứng cho nhãn (`label-new`, `label-sale`, `label-hot`)
}
