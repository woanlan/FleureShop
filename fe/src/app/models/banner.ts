/**
 * Mô hình dữ liệu Banner quảng cáo đầu trang và gói dữ liệu tổng hợp Trang chủ (`HomePayload`).
 * Đồng bộ trực tiếp với cấu trúc JSON trả về từ API `GET /api/home` trên Backend Express/MongoDB.
 */
import { Category } from './category';
import { Post } from './post';
import { Product } from './product';

/** Cấu trúc một slide Banner hiển thị ở khu vực Hero trên Trang chủ */
export interface Banner {
  id: number;          // Mã định danh duy nhất của banner
  slug: string;        // Chuỗi đường dẫn định danh thân thiện SEO
  badge: string;       // Nhãn nổi bật phía trên tiêu đề (ví dụ: Bộ sưu tập mới)
  title: string;       // Tiêu đề chính của banner
  subtitle: string;    // Mô tả ngắn giới thiệu thông điệp của bộ sưu tập
  ctaLabel: string;    // Nội dung chữ trên nút kêu gọi hành động (CTA)
  ctaRoute: string;    // Đường dẫn điều hướng nội bộ khi bấm nút CTA
  image: string;       // Đường dẫn ảnh nền của banner
  order: number;       // Thứ tự ưu tiên sắp xếp hiển thị
  isActive: boolean;   // Trạng thái bật/tắt hiển thị banner
}

/** Gói dữ liệu tổng hợp cho Trang chủ giúp tải toàn bộ các mục chính chỉ trong 1 lần gọi `/api/home` */
export interface HomePayload {
  banners: Banner[];               // Danh sách banner đang hoạt động
  categories: Category[];          // Danh sách danh mục hoa tươi
  newProducts: Product[];          // Nhóm bó hoa mới ra mắt
  bestSellingProducts: Product[];  // Nhóm bó hoa bán chạy nhất
  saleProducts: Product[];         // Nhóm bó hoa đang giảm giá khuyến mãi
  latestPosts: Post[];             // Danh sách bài viết cẩm nang mới nhất
}
