import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../services/shop.service';
import { DataState } from '../shared/data-state/data-state';
import { Icon } from '../shared/icon/icon';
import { ProductCard } from '../shared/product-card/product-card';

/**
 * Component Trang chủ (Home - đường dẫn `/`):
 * - Đọc trực tiếp các Signal dữ liệu từ `ShopService` (banners, products, posts).
 * - Quản lý trạng thái chuyển ảnh trên Hero Banner bằng `signal` và `computed`.
 * - Tự động tính toán 4 nhóm nội dung nổi bật (Hoa mới về, Hoa đang giảm giá,
 *   Hoa bán chạy nhất và 3 Bài viết mới nhất) để hiển thị ra giao diện.
 */
@Component({
  imports: [RouterLink, ProductCard, Icon, DataState],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  // Inject ShopService để truy cập kho dữ liệu dùng chung được tải từ Backend MongoDB
  readonly shop = inject(ShopService);

  // Tham chiếu trực tiếp các Signal gốc từ ShopService (tự động cập nhật UI khi API trả về)
  readonly slides = this.shop.banners;
  readonly products = this.shop.products;
  readonly posts = this.shop.posts;

  // Lưu chỉ số (index) của slide đang hiển thị trên Hero Banner (mặc định là slide đầu tiên: 0)
  readonly currentSlideIndex = signal(0);

  // Tự động lấy thông tin chi tiết của banner đang được chọn dựa vào currentSlideIndex
  readonly activeSlide = computed(() => {
    const list = this.slides();
    if (list.length === 0) return null;
    return list[this.currentSlideIndex()] ?? list[0] ?? null;
  });

  // Nhóm 1 - Hoa tươi mới về (tối đa 4 mẫu):
  // Ưu tiên lấy từ dữ liệu API Trang chủ; nếu chưa có thì dự phòng sắp xếp theo id mới nhất giảm dần
  readonly newProducts = computed(() => {
    const fromHomeApi = this.shop.homeNewProducts();
    if (fromHomeApi.length > 0) return fromHomeApi;
    return [...this.products()].sort((a, b) => b.id - a.id).slice(0, 4);
  });

  // Nhóm 2 - Hoa đang giảm giá (tối đa 4 mẫu):
  // Ưu tiên dữ liệu từ API Trang chủ; hoặc lọc sản phẩm có discount > 0 và xếp mức giảm từ cao xuống thấp
  readonly saleProducts = computed(() => {
    const fromHomeApi = this.shop.homeSaleProducts();
    if (fromHomeApi.length > 0) return fromHomeApi;
    return [...this.products()]
      .filter((p) => p.discount > 0)
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 4);
  });

  // Nhóm 3 - Hoa bán chạy nhất (tối đa 4 mẫu):
  // Ưu tiên dữ liệu từ API Trang chủ; hoặc sắp xếp theo số lượng đã bán (sold) giảm dần
  readonly bestSellingProducts = computed(() => {
    const fromHomeApi = this.shop.homeBestSellingProducts();
    if (fromHomeApi.length > 0) return fromHomeApi;
    return [...this.products()].sort((a, b) => b.sold - a.sold).slice(0, 4);
  });

  // Nhóm 4 - Tạp chí FLEURÉ (đúng 3 bài viết mới nhất):
  // Ưu tiên dữ liệu từ API Trang chủ; hoặc sắp xếp theo ngày đăng (publishedAt) mới nhất lên đầu
  readonly latestPosts = computed(() => {
    const fromHomeApi = this.shop.homeLatestPosts();
    if (fromHomeApi.length > 0) return fromHomeApi;
    return [...this.posts()]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, 3);
  });

  // Đổi sang banner tương ứng khi người dùng bấm vào các nút chấm tròn (dots) trên Hero Slider
  selectSlide(index: number): void {
    this.currentSlideIndex.set(index);
  }
}
