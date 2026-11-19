/**
 * Header – Thanh tiêu đề & thanh điều hướng chính của website FLEURÉ.
 *
 * Bao gồm:
 *   - Logo thương hiệu (icon hoa + tên) → điều hướng về Trang chủ
 *   - Nút giỏ hàng với số lượng sản phẩm realtime từ ShopService
 *   - Form tìm kiếm sản phẩm với debounce 250ms (tránh gọi API liên tục)
 *   - Thanh điều hướng (nav) chứa các trang chính của ứng dụng
 *
 * Sử dụng:
 *   - `DestroyRef` để tự dọn dẹp timeout khi component bị hủy (tránh memory leak)
 *   - `viewChild` để truy cập trực tiếp phần tử input tìm kiếm trong DOM
 *   - `ShopService.searchQuery` (Writable Signal) và `searchProductsFromApi` để đồng bộ
 */
import { Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ShopService } from '../../../services/shop.service';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Icon], // RouterLinkActive tô sáng trang đang xem
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  /** ShopService: lấy số lượng giỏ hàng & gọi API tìm kiếm */
  readonly shop = inject(ShopService);

  /** Router: điều hướng đến /products khi submit form tìm kiếm */
  private readonly router = inject(Router);

  /** DestroyRef: hook dọn dẹp khi component unmount */
  private readonly destroyRef = inject(DestroyRef);

  /** Tham chiếu đến input tìm kiếm trong template (dùng #searchInput) */
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  /** ID của setTimeout dùng debounce — null khi không có timer đang chạy */
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Dọn dẹp timeout khi component bị hủy để tránh memory leak
    this.destroyRef.onDestroy(() => this.clearSearchTimer());
  }

  /** Hủy bỏ debounce timer đang chạy (nếu có) */
  private clearSearchTimer(): void {
    if (this.searchTimer !== null) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }

  /**
   * Xử lý sự kiện gõ phím trong input tìm kiếm.
   * Cập nhật signal searchQuery ngay lập tức (để ô input đồng bộ)
   * và debounce 250ms trước khi gọi API (tránh spam request).
   */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.shop.searchQuery.set(value); // Cập nhật signal ngay
    this.clearSearchTimer();

    // Nếu xóa hết từ khóa → gọi API ngay để load lại toàn bộ sản phẩm
    if (!value.trim()) {
      this.shop.searchProductsFromApi('');
      return;
    }

    // Debounce: đợi 250ms sau lần gõ cuối mới gọi API
    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      this.shop.searchProductsFromApi(value);
    }, 250);
  }

  /**
   * Xử lý submit form tìm kiếm (nhấn Enter hoặc bấm icon kính lúp).
   * Hủy debounce, gọi API ngay và điều hướng đến /products?search=...
   */
  onSearchSubmit(event: Event): void {
    event.preventDefault(); // Ngăn form reload trang
    this.clearSearchTimer();
    const trimmed = this.shop.searchQuery().trim();
    this.shop.searchProductsFromApi(trimmed);
    this.router.navigate(['/products'], {
      queryParams: trimmed ? { search: trimmed } : {}, // Thêm query param nếu có từ khóa
    });
  }

  /**
   * Xóa từ khóa tìm kiếm và trả focus về input.
   * Được gọi khi nhấn nút × bên trong ô tìm kiếm.
   */
  clearSearch(): void {
    this.clearSearchTimer();
    this.shop.searchQuery.set('');           // Xóa signal
    this.shop.searchProductsFromApi('');     // Load lại toàn bộ sản phẩm
    this.searchInput()?.nativeElement?.focus(); // Trả focus về input
  }
}
