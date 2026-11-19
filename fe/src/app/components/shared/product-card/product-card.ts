/**
 * ProductCard – Thẻ sản phẩm dùng chung trên toàn bộ website.
 *
 * Nhận vào một đối tượng Product qua input, tự tính nhãn badge (Giảm giá /
 * Bán chạy / NEW / badge riêng từ dữ liệu) và xử lý nút "Mua" thêm vào giỏ.
 * Dùng signal computed để tái tính badge khi input thay đổi mà không cần CD thủ công.
 */
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../models/product';
import { ShopService } from '../../../services/shop.service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, Icon], // RouterLink → điều hướng đến trang chi tiết; Icon → icon giỏ hàng
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  /** Inject ShopService để gọi addToCart khi nhấn nút Mua */
  private readonly shop = inject(ShopService);

  /** Sản phẩm cần hiển thị — bắt buộc truyền vào từ component cha */
  readonly product = input.required<Product>();

  /**
   * Chế độ badge:
   * - 'auto'  → tự động lấy badge từ dữ liệu sản phẩm (mặc định)
   * - 'sale'  → luôn hiện badge giảm giá (nếu discount > 0)
   * - 'sold'  → luôn hiện badge "Bán chạy"
   * - 'new'   → luôn hiện badge "NEW"
   */
  readonly badgeMode = input<'auto' | 'sale' | 'sold' | 'new'>('auto');

  /**
   * Signal computed — tính toán nội dung và lớp CSS của badge.
   * Trả về null nếu không có badge nào cần hiển thị.
   */
  readonly badgeInfo = computed(() => {
    const p = this.product();
    const mode = this.badgeMode();

    // Badge giảm giá: chỉ hiện khi có discount
    if (mode === 'sale' && p.discount > 0) {
      return { text: `-${p.discount}%`, cssClass: 'label-sale' };
    }
    // Badge bán chạy
    if (mode === 'sold') {
      return { text: `Bán chạy`, cssClass: 'label-hot' };
    }
    // Badge sản phẩm mới
    if (mode === 'new') {
      return { text: 'NEW', cssClass: 'label-new' };
    }
    // Badge tự động lấy từ trường badge trong MongoDB
    if (p.badge) {
      return { text: p.badge, cssClass: p.badgeClass ?? 'label-new' };
    }
    return null; // Không có badge
  });

  /** Thêm 1 sản phẩm vào giỏ hàng khi người dùng nhấn nút "Mua" */
  onBuy(): void {
    this.shop.addToCart(this.product(), 1);
  }
}
