/**
 * Mô hình dữ liệu Bài viết góc cẩm nang hoa (`Post`) tại đường dẫn `/bai_viet`.
 * Đồng bộ với dữ liệu từ endpoint `GET /api/posts` trên Backend Express/MongoDB.
 */

/** Các chủ đề bài viết dùng cho bộ lọc tab trên trang Bài viết */
export type PostCategory =
  | 'Tất cả'
  | 'Chăm sóc hoa'
  | 'Ý nghĩa hoa'
  | 'Nghệ thuật gói'
  | 'Xu hướng';

/** Cấu trúc chi tiết một bài viết cẩm nang về hoa tươi */
export interface Post {
  id: number;                                    // Mã bài viết
  title: string;                                 // Tiêu đề bài viết
  slug: string;                                  // Chuỗi đường dẫn chuẩn SEO không dấu
  excerpt: string;                               // Đoạn trích dẫn ngắn hiển thị ở thẻ tóm tắt
  content: string[];                             // Nội dung bài viết tách thành mảng từng đoạn văn
  careTip: string;                               // Mẹo nhỏ chăm hoa đóng khung nổi bật cuối bài
  image: string;                                 // Ảnh minh họa chính của bài viết
  category: Exclude<PostCategory, 'Tất cả'>;     // Chuyên mục thực tế của bài viết
  author: string;                                // Tên tác giả / nghệ nhân cắm hoa biên soạn
  publishedAt: string;                           // Ngày xuất bản bài viết
  readTimeMinutes: number;                       // Thời gian đọc ước tính (phút)
  relatedProductId: number;                      // Mã sản phẩm hoa liên quan gợi ý ở cuối bài viết
}
