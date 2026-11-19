/**
 * Bảng định tuyến (Routing) chính của cửa hàng hoa FLEURÉ.
 * - Tất cả màn hình đều dùng `loadComponent` (Lazy Loading / Code-splitting):
 *   tách từng trang thành gói JavaScript riêng, chỉ tải về khi người dùng bấm vào trang đó,
 *   giúp trang chủ khởi động ban đầu nhẹ và nhanh hơn.
 * - Hỗ trợ đầy đủ các đường dẫn thân thiện SEO theo yêu cầu đề bài (`/category/:slug`, `/product/:slug`, `/bai_viet`).
 */
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    // Trang chủ: hiển thị banner, danh mục, hoa mới, hoa bán chạy, khuyến mãi và bài viết mới
    path: '',
    loadComponent: () => import('./components/home/home').then((m) => m.Home),
  },
  {
    // Trang danh sách tất cả sản phẩm (hỗ trợ tìm kiếm qua query param ?search=...)
    path: 'products',
    loadComponent: () => import('./components/products/products').then((m) => m.Products),
  },
  {
    // Đường dẫn SEO lọc sản phẩm theo slug danh mục (ví dụ: /category/hoa-sinh-nhat)
    path: 'category/:slug',
    loadComponent: () => import('./components/products/products').then((m) => m.Products),
  },
  {
    // Đường dẫn SEO xem chi tiết một bó hoa theo slug (ví dụ: /product/bo-hong-pastel-nang-tho)
    path: 'product/:slug',
    loadComponent: () => import('./components/product/product').then((m) => m.Product),
  },
  {
    // Trang tổng hợp chương trình khuyến mãi & sao chép mã voucher giảm giá
    path: 'promotions',
    loadComponent: () => import('./components/promotions/promotions').then((m) => m.Promotions),
  },
  {
    // Đường dẫn SEO tiếng Việt cho trang Góc cẩm nang / Bài viết về hoa
    path: 'bai_viet',
    loadComponent: () => import('./components/posts/posts').then((m) => m.Posts),
  },
  {
    // Chuyển hướng đường dẫn tiếng Anh `/posts` về `/bai_viet` để đồng nhất URL chuẩn SEO
    path: 'posts',
    redirectTo: 'bai_viet',
    pathMatch: 'full',
  },
  {
    // Trang video trải nghiệm nghệ thuật bó hoa & chăm hoa tại Atelier FLEURÉ
    path: 'experience',
    loadComponent: () => import('./components/experience/experience').then((m) => m.Experience),
  },
  {
    // Trang giỏ hàng, áp mã giảm giá và điền thông tin đặt hàng
    path: 'cart',
    loadComponent: () => import('./components/cart/cart').then((m) => m.Cart),
  },
  {
    // Wildcard route: mọi đường dẫn không tồn tại sẽ tự động quay về Trang chủ
    path: '**',
    redirectTo: '',
  },
];
