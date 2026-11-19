# FLEURÉ – Flower Boutique (Lab 3 — WEB2081)

- **Sinh viên:** Nguyễn Hoàng Lân
- **MSSV:** PS47290
- **Môn học / Lớp:** WEB2081 — Angular
- **Giảng viên hướng dẫn:** Thầy Trần Bá Hộ
- **Nền tảng:** Angular 22.2 (`Standalone Components`, `Signals`, `@for` / `@if` / `@empty`, Lazy Routes)
- **Theme:** `02 • HỒNG PASTEL` (`FLEURÉ — Gói chút hoa, gửi chút thương.`)

## Chức năng bổ sung & Sáng tạo trong Lab 3
1. **Trang chủ (`/`):**
   - Hero Carousel 3 banner phong cách Hồng Pastel & Ruby.
   - **Hoa tươi mới về**, **Hoa đang giảm giá**, **Hoa bán chạy nhất** (`bestSellingProducts`).
   - **Section Bài viết mới nhất (`latestPosts`):** Load tự động **3 bài viết mới nhất** từ mảng dữ liệu `POSTS_DATA` gồm **6 bài viết**.
   - Banner dẫn sang góc Trải nghiệm Atelier.
2. **Các trang sáng tạo với Lazy Routing:**
   - **Bài viết (`/posts`):** Lọc theo chủ đề, hỗ trợ mở đọc chi tiết qua `?id=...` & gợi ý bó hoa trong bài.
   - **Trải nghiệm Video (`/experience`):** Trình phát `<video>` (`assets/hero.mp4`) kèm quy trình bó hoa từng bước và playlist 4 video.
   - **Khuyến mãi (`/promotions`):** Flash Sale đếm ngược thời gian thực, sao chép mã ưu đãi (`FLEURE20`, `FREESHIP60`, `YEUHOA15`), lọc mức giảm.
3. **Nâng cấp trải nghiệm mua sắm:** Kết nối `ShopService` bằng Angular Signals đồng bộ số lượng giỏ hàng trên Header, chi tiết sản phẩm động `/product/:id` và giỏ hàng tính mã ưu đãi + freeship `/cart`.

## Chạy dự án
```bash
ng serve
```
Mở trình duyệt tại `http://localhost:4200/` (tối ưu giao diện di động 375px–430px).

## Build & Kiểm thử
```bash
ng build
ng test
```
