/**
 * Mô hình dữ liệu cho chuyên mục Video Trải nghiệm Atelier FLEURÉ (`ExperienceVideo`).
 * Ánh xạ từ collection `experiences` trong MongoDB qua endpoint `GET /api/experiences`.
 */

/** Danh sách chủ đề lọc trên trang Trải nghiệm (bao gồm tùy chọn `'Tất cả'` ở thanh tab) */
export type ExperienceCategory = 'Tất cả' | 'Kỹ thuật bó hoa' | 'Chăm hoa tại nhà' | 'Atelier FLEURÉ';

/** Thông tin chi tiết một video hướng dẫn bó hoa / chăm sóc hoa */
export interface ExperienceVideo {
  id: number;                                          // Mã định danh video
  title: string;                                       // Tiêu đề video trải nghiệm
  slug: string;                                        // Đường dẫn rút gọn không dấu
  subtitle: string;                                    // Tóm tắt ngắn nội dung video
  category: Exclude<ExperienceCategory, 'Tất cả'>;     // Chủ đề thực tế của video (loại trừ nhãn lọc 'Tất cả')
  duration: string;                                    // Thời lượng phát hiển thị (ví dụ: "03:45")
  views: number;                                       // Số lượt xem video
  posterImage: string;                                 // Ảnh bìa xem trước (thumbnail/poster) của video
  videoUrl: string;                                    // Đường dẫn tệp video phát trực tiếp
  steps: string[];                                     // Danh sách từng bước hướng dẫn thực hành đi kèm
  linkedProductId: number;                             // Mã bó hoa gợi ý liên quan để khách đặt mua nhanh
  publishedAt: string;                                 // Ngày đăng tải video
}
