/**
 * Promotions – Trang "Khuyến Mãi" của FLEURÉ.
 *
 * Hiển thị:
 *   1. Đồng hồ đếm ngược Flash Sale (cập nhật mỗi giây bằng setInterval)
 *   2. Danh sách mã voucher có thể sao chép vào clipboard
 *   3. Danh sách sản phẩm đang giảm giá lọc từ MongoDB (collection products)
 *
 * Lọc sản phẩm theo 3 chế độ:
 *   - 'all'      → tất cả sản phẩm có discount > 0, sắp xếp giảm dần
 *   - 'deep'     → chỉ sản phẩm giảm >= 20%
 *   - 'under350' → chỉ sản phẩm giá <= 350.000đ
 *
 * Kỹ thuật:
 *   - `isPlatformBrowser` → chỉ chạy setInterval trên browser (không chạy khi SSR/server render)
 *   - `DestroyRef.onDestroy` → dọn sạch interval và timeout khi component bị hủy
 *   - `navigator.clipboard.writeText` → sao chép mã voucher với fallback khi không hỗ trợ
 */
import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../services/shop.service';
import { DataState } from '../shared/data-state/data-state';
import { Icon } from '../shared/icon/icon';
import { ProductCard } from '../shared/product-card/product-card';

/** Cấu trúc dữ liệu một mã voucher khuyến mãi */
interface Voucher {
  code: string;      // Mã nhập vào ô voucher ở trang Giỏ hàng
  label: string;     // Tiêu đề ngắn hiển thị trên thẻ
  condition: string; // Điều kiện áp dụng
}

@Component({
  selector: 'app-promotions',
  imports: [RouterLink, ProductCard, Icon, DataState],
  templateUrl: './promotions.html',
  styleUrl: './promotions.css',
})
export class Promotions {
  /** ShopService: lấy danh sách sản phẩm giảm giá từ MongoDB và hiển thị toast */
  readonly shop = inject(ShopService);

  /** DestroyRef: hook dọn dẹp interval/timeout khi component unmount */
  private readonly destroyRef = inject(DestroyRef);

  /** PLATFORM_ID: phân biệt môi trường browser vs server (SSR) */
  private readonly platformId = inject(PLATFORM_ID);

  /** Danh sách mã voucher cứng — logic kiểm tra và áp dụng nằm ở Cart component */
  readonly vouchers: Voucher[] = [
    {
      code: 'FLEURE20',
      label: 'Giảm thêm 20% đơn từ 450k',
      condition: 'Áp dụng tất cả bó hoa pastel & tulip',
    },
    {
      code: 'FREESHIP60',
      label: 'Freeship hỏa tốc 60 phút',
      condition: 'Cho mọi đơn hàng nội thành TP.HCM',
    },
    {
      code: 'YEUHOA15',
      label: 'Giảm 15% cho thành viên mới',
      condition: 'Nhập tại trang Giỏ hàng trước khi thanh toán',
    },
  ];

  /** Mã voucher vừa được copy (hiển thị hiệu ứng "Đã sao chép" trong 2.2 giây) */
  readonly copiedCode = signal<string | null>(null);

  /** Chế độ lọc sản phẩm giảm giá (all / deep / under350) */
  readonly filterMode = signal<'all' | 'deep' | 'under350'>('all');

  /** Số giây còn lại của Flash Sale (khởi tạo: 5h 42m 18s) */
  readonly secondsRemaining = signal(5 * 3600 + 42 * 60 + 18);

  /**
   * Signal computed — định dạng đồng hồ đếm ngược thành { h, m, s }
   * với mỗi phần luôn có đủ 2 chữ số (ví dụ: "05:07:03")
   */
  readonly countdown = computed(() => {
    const total = this.secondsRemaining();
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return { h: pad(h), m: pad(m), s: pad(s) };
  });

  /**
   * Danh sách sản phẩm đang giảm giá sau khi lọc và sắp xếp.
   * Tự động tái tính khi filterMode hoặc dữ liệu sản phẩm thay đổi.
   */
  readonly discountedProducts = computed(() => {
    const mode = this.filterMode();
    const base = this.shop
      .products()
      .filter((p) => p.discount > 0)         // Chỉ lấy sản phẩm đang giảm giá
      .sort((a, b) => b.discount - a.discount); // Giảm nhiều nhất lên đầu

    if (mode === 'deep') {
      return base.filter((p) => p.discount >= 20); // Lọc giảm >= 20%
    }
    if (mode === 'under350') {
      return base.filter((p) => p.priceValue <= 350000); // Lọc giá <= 350k
    }
    return base; // Trả về tất cả nếu mode === 'all'
  });

  /** ID của setTimeout dùng để xóa trạng thái "Đã sao chép" sau 2.2 giây */
  private copyTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    let timer: ReturnType<typeof setInterval> | null = null;

    // Chỉ chạy đồng hồ đếm ngược khi ở môi trường browser (không phải server SSR)
    if (isPlatformBrowser(this.platformId)) {
      timer = setInterval(() => {
        const next = this.secondsRemaining() - 1;
        this.secondsRemaining.set(Math.max(0, next)); // Không để về số âm
        if (next <= 0 && timer !== null) {
          clearInterval(timer); // Dừng khi đếm xong
          timer = null;
        }
      }, 1000); // Mỗi 1 giây giảm đi 1
    }

    // Dọn dẹp interval và timeout khi component bị hủy
    this.destroyRef.onDestroy(() => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      if (this.copyTimeout) {
        clearTimeout(this.copyTimeout);
        this.copyTimeout = null;
      }
    });
  }

  /** Đặt chế độ lọc sản phẩm giảm giá */
  setFilter(mode: 'all' | 'deep' | 'under350'): void {
    this.filterMode.set(mode);
  }

  /**
   * Sao chép mã voucher vào clipboard và hiển thị toast thông báo.
   * - Thử dùng Clipboard API (hỗ trợ HTTPS)
   * - Fallback: hiển thị toast với nội dung mã để người dùng sao chép thủ công
   * - Sau 2.2 giây tự reset trạng thái "Đã sao chép"
   */
  copyVoucher(code: string): void {
    this.copiedCode.set(code); // Hiển thị trạng thái "Đã sao chép" ngay lập tức

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          this.shop.showToast(`Đã sao chép mã ${code}`); // Toast thành công
        })
        .catch(() => {
          this.shop.showToast(`Mã ưu đãi: ${code}`); // Fallback khi clipboard bị từ chối
        });
    } else {
      this.shop.showToast(`Mã ưu đãi: ${code}`); // Fallback khi không có Clipboard API
    }

    // Hủy timeout cũ nếu copy liên tiếp nhiều mã
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }
    // Reset trạng thái sau 2.2 giây
    this.copyTimeout = setTimeout(() => {
      this.copyTimeout = null;
      if (this.copiedCode() === code) {
        this.copiedCode.set(null);
      }
    }, 2200);
  }
}
