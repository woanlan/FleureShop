/**
 * Cart – Trang "Giỏ Hàng" của FLEURÉ.
 *
 * Chức năng chính:
 *   1. Hiển thị danh sách sản phẩm trong giỏ (từ ShopService.cartItems)
 *   2. Tính toán phí ship, giảm giá voucher và tổng tiền cuối (computed signals)
 *   3. Nhập và kiểm tra mã voucher (FLEURE20 / YEUHOA15 / FREESHIP60)
 *   4. Thu thập thông tin giao hàng (họ tên, SĐT, địa chỉ, ghi chú)
 *   5. Đặt hàng qua API POST /api/orders → lưu vào MongoDB → hiển thị xác nhận
 *
 * Mã voucher hợp lệ:
 *   - FLEURE20   → giảm 20% cho đơn từ 450.000đ
 *   - YEUHOA15   → giảm 15% (thành viên mới, không giới hạn)
 *   - FREESHIP60 → miễn phí vận chuyển
 *
 * Phí ship:
 *   - FREESHIP60 được áp dụng → 0đ
 *   - Đơn >= 399.000đ          → 0đ (miễn ship)
 *   - Còn lại                  → 25.000đ
 *
 * Kỹ thuật:
 *   - Signal/computed cho toàn bộ state UI (không dùng BehaviorSubject)
 *   - `DestroyRef` + `.unsubscribe()` để tránh memory leak từ Subscription đặt hàng
 *   - `formatVnd` định dạng số tiền theo chuẩn Việt Nam (1.200.000đ)
 */
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SavedOrder } from '../../models/order';
import { ShopService } from '../../services/shop.service';
import { DataState } from '../shared/data-state/data-state';
import { Icon } from '../shared/icon/icon';

@Component({
  imports: [RouterLink, Icon, DataState],
  selector: 'app-cart',
  styleUrl: './cart.css',
  templateUrl: './cart.html',
})
export class Cart {
  /** ShopService: nguồn dữ liệu giỏ hàng và API đặt hàng */
  readonly shop = inject(ShopService);

  /** DestroyRef: hủy subscription khi component bị destroy */
  private readonly destroyRef = inject(DestroyRef);

  // --- State nhập mã voucher ---
  /** Giá trị đang nhập vào ô mã voucher (luôn in hoa) */
  readonly voucherInput = signal('');
  /** Mã voucher đã được áp dụng thành công (null = chưa áp) */
  readonly appliedVoucher = signal<string | null>(null);
  /** Thông báo lỗi khi nhập sai mã voucher */
  private readonly voucherError = signal<string | null>(null);

  // --- State thông tin giao hàng ---
  readonly customerName = signal('');
  readonly customerPhone = signal('');
  readonly customerAddress = signal('');
  readonly customerNote = signal('');

  // --- State quá trình đặt hàng ---
  /** Thông báo lỗi khi checkout thất bại (ví dụ: thiếu địa chỉ, API lỗi) */
  readonly checkoutError = signal<string | null>(null);
  /** true khi đang chờ API phản hồi (disable nút đặt hàng) */
  readonly submittingOrder = signal(false);
  /** true sau khi đặt hàng thành công (hiển thị màn hình xác nhận) */
  readonly orderPlaced = signal(false);
  /** Dữ liệu đơn hàng vừa được lưu (hiển thị mã đơn, tổng tiền) */
  readonly lastOrder = signal<SavedOrder | null>(null);
  /** Subscription đặt hàng — cần hủy khi component bị destroy */
  private orderSub: Subscription | null = null;

  constructor() {
    // Hủy subscription đặt hàng khi component unmount (tránh memory leak)
    this.destroyRef.onDestroy(() => this.orderSub?.unsubscribe());
  }

  /**
   * Trạng thái tổng hợp của voucher đang áp dụng:
   * - null           → chưa áp dụng voucher
   * - { status: 'success', text } → voucher hợp lệ
   * - { status: 'error', text }   → voucher không thỏa điều kiện
   */
  readonly voucherState = computed<{ status: 'success' | 'error'; text: string } | null>(() => {
    const error = this.voucherError();
    if (error) {
      return { status: 'error', text: error };
    }

    const code = this.appliedVoucher();
    if (!code || this.shop.cartItems().length === 0) {
      return null; // Chưa nhập hoặc giỏ trống
    }

    // FLEURE20: giảm 20% — yêu cầu đơn >= 450.000đ
    if (code === 'FLEURE20') {
      return this.shop.cartSubtotal() >= 450000
        ? { status: 'success', text: 'Đã áp dụng giảm thêm 20%!' }
        : {
            status: 'error',
            text: 'Mã FLEURE20 tạm ngưng: cần tổng đơn từ 450.000đ trở lên.',
          };
    }

    // YEUHOA15: giảm 15% thành viên mới — không giới hạn đơn tối thiểu
    if (code === 'YEUHOA15') {
      return { status: 'success', text: 'Đã áp dụng giảm 15% thành viên mới!' };
    }

    // FREESHIP60: miễn phí vận chuyển hỏa tốc
    if (code === 'FREESHIP60') {
      return { status: 'success', text: 'Đã miễn phí vận chuyển hỏa tốc!' };
    }

    return null;
  });

  /** Trạng thái ngắn gọn của voucher ('success' | 'error' | null) */
  readonly voucherStatus = computed(() => this.voucherState()?.status ?? null);

  /** Nội dung thông báo voucher hiển thị dưới ô nhập */
  readonly voucherFeedback = computed(() => this.voucherState()?.text ?? null);

  /**
   * Phí vận chuyển:
   * - Giỏ trống → 0đ
   * - FREESHIP60 được áp dụng thành công → 0đ
   * - Đơn >= 399.000đ → miễn ship
   * - Còn lại → 25.000đ
   */
  readonly shippingFee = computed(() => {
    if (this.shop.cartItems().length === 0) return 0;
    if (this.appliedVoucher() === 'FREESHIP60') return 0;
    return this.shop.cartSubtotal() >= 399000 ? 0 : 25000;
  });

  /**
   * Số tiền được giảm từ voucher:
   * - FLEURE20 (đơn >= 450k): giảm 20% subtotal
   * - YEUHOA15: giảm 15% subtotal
   * - Các mã khác: 0đ
   */
  readonly voucherDiscount = computed(() => {
    const subtotal = this.shop.cartSubtotal();
    const code = this.appliedVoucher();
    if (code === 'FLEURE20' && subtotal >= 450000) {
      return Math.round(subtotal * 0.2);
    }
    if (code === 'YEUHOA15') {
      return Math.round(subtotal * 0.15);
    }
    return 0;
  });

  /**
   * Tổng tiền cuối cùng khách phải trả:
   * grandTotal = subtotal - voucherDiscount + shippingFee
   * Luôn >= 0 (dùng Math.max để tránh số âm)
   */
  readonly grandTotal = computed(() =>
    Math.max(0, this.shop.cartSubtotal() - this.voucherDiscount() + this.shippingFee())
  );

  /** Cập nhật signal voucherInput khi người dùng gõ (tự động in hoa) */
  onVoucherInput(event: Event): void {
    this.voucherError.set(null); // Xóa lỗi cũ khi bắt đầu gõ lại
    this.voucherInput.set((event.target as HTMLInputElement).value.toUpperCase());
  }

  /**
   * Cập nhật signal thông tin giao hàng khi người dùng nhập.
   * Dùng một hàm chung cho cả 4 field để tránh lặp code.
   */
  onCustomerFieldInput(
    field: 'name' | 'phone' | 'address' | 'note',
    event: Event
  ): void {
    this.checkoutError.set(null); // Xóa lỗi khi bắt đầu sửa
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    if (field === 'name') this.customerName.set(value);
    else if (field === 'phone') this.customerPhone.set(value);
    else if (field === 'address') this.customerAddress.set(value);
    else this.customerNote.set(value);
  }

  /**
   * Kiểm tra và áp dụng mã voucher.
   * Logic kiểm tra điều kiện đơn hàng tối thiểu ngay tại đây.
   */
  applyVoucher(): void {
    const code = this.voucherInput().trim().toUpperCase();
    if (!code) {
      this.appliedVoucher.set(null);
      this.voucherError.set(
        'Vui lòng nhập mã giảm giá (gợi ý: FLEURE20, YEUHOA15, FREESHIP60)'
      );
      return;
    }

    if (code === 'FLEURE20') {
      if (this.shop.cartSubtotal() < 450000) {
        this.appliedVoucher.set(null);
        this.voucherError.set('Mã FLEURE20 áp dụng cho đơn từ 450.000đ trở lên.');
        return;
      }
      this.voucherError.set(null);
      this.appliedVoucher.set(code);
      return;
    }

    if (code === 'YEUHOA15' || code === 'FREESHIP60') {
      this.voucherError.set(null);
      this.appliedVoucher.set(code);
      return;
    }

    // Mã không hợp lệ
    this.appliedVoucher.set(null);
    this.voucherError.set('Mã không hợp lệ. Thử: FLEURE20, YEUHOA15 hoặc FREESHIP60.');
  }

  /**
   * Xử lý đặt hàng:
   * 1. Validate thông tin giao hàng (họ tên, SĐT, địa chỉ)
   * 2. Gọi API POST /api/orders qua ShopService
   * 3. Nếu thành công: hiển thị xác nhận đơn hàng và làm trống giỏ
   * 4. Nếu thất bại: hiển thị thông báo lỗi từ API
   */
  checkout(): void {
    const cart = this.shop.cartItems();
    if (cart.length === 0 || this.submittingOrder()) return; // Không xử lý nếu giỏ trống hoặc đang gửi

    // Lấy và chuẩn hóa thông tin giao hàng
    const fullName = this.customerName().trim();
    const phone = this.customerPhone().trim();
    const address = this.customerAddress().trim();
    const note = this.customerNote().trim();

    // Validate họ tên
    if (!fullName) {
      this.checkoutError.set('Vui lòng nhập họ tên người nhận hoa.');
      return;
    }
    // Validate SĐT (9-15 ký tự số)
    if (!/^[0-9+\s.-]{9,15}$/.test(phone)) {
      this.checkoutError.set('Vui lòng nhập số điện thoại liên hệ hợp lệ (9–15 ký tự số).');
      return;
    }
    // Validate địa chỉ giao hàng
    if (!address) {
      this.checkoutError.set('Vui lòng nhập địa chỉ giao hoa nội thành.');
      return;
    }

    this.checkoutError.set(null);
    this.submittingOrder.set(true); // Hiển thị loading, disable nút đặt hàng
    this.orderSub?.unsubscribe(); // Hủy request đặt hàng cũ nếu có

    // Chỉ gửi voucherCode nếu voucher thực sự hợp lệ (status === 'success')
    const activeVoucher =
      this.voucherStatus() === 'success' ? this.appliedVoucher() : null;

    this.orderSub = this.shop
      .placeOrder({
        customer: { fullName, phone, address, note },
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        voucherCode: activeVoucher,
      })
      .subscribe({
        next: (saved) => {
          // Đặt hàng thành công: hiển thị xác nhận
          this.submittingOrder.set(false);
          this.lastOrder.set(saved);    // Lưu thông tin đơn hàng để hiển thị
          this.orderPlaced.set(true);  // Chuyển sang màn hình xác nhận
          // Reset voucher và ô nhập
          this.appliedVoucher.set(null);
          this.voucherInput.set('');
          this.voucherError.set(null);
          this.customerNote.set('');
        },
        error: (err: { error?: { message?: string } }) => {
          // Đặt hàng thất bại: hiển thị lỗi từ API hoặc lỗi chung
          this.submittingOrder.set(false);
          this.checkoutError.set(
            err?.error?.message ||
              'Không thể lưu đơn hàng vào MongoDB. Hãy kiểm tra Backend API đang chạy ở cổng 5000.'
          );
        },
      });
  }

  /** Quay lại trang mua sắm sau khi đặt hàng thành công */
  continueShoppingAfterOrder(): void {
    this.orderPlaced.set(false);
    this.lastOrder.set(null);
  }

  /** Định dạng số tiền theo chuẩn Việt Nam: 1200000 → "1.200.000đ" */
  formatVnd(amount: number): string {
    return `${amount.toLocaleString('vi-VN')}đ`;
  }
}
