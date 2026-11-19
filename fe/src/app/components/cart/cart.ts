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
  readonly shop = inject(ShopService);
  private readonly destroyRef = inject(DestroyRef);

  readonly voucherInput = signal('');
  readonly appliedVoucher = signal<string | null>(null);
  private readonly voucherError = signal<string | null>(null);

  readonly customerName = signal('');
  readonly customerPhone = signal('');
  readonly customerAddress = signal('');
  readonly customerNote = signal('');
  readonly checkoutError = signal<string | null>(null);
  readonly submittingOrder = signal(false);
  readonly orderPlaced = signal(false);
  readonly lastOrder = signal<SavedOrder | null>(null);
  private orderSub: Subscription | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.orderSub?.unsubscribe());
  }

  readonly voucherState = computed<{ status: 'success' | 'error'; text: string } | null>(() => {
    const error = this.voucherError();
    if (error) {
      return { status: 'error', text: error };
    }

    const code = this.appliedVoucher();
    if (!code || this.shop.cartItems().length === 0) {
      return null;
    }

    if (code === 'FLEURE20') {
      return this.shop.cartSubtotal() >= 450000
        ? { status: 'success', text: 'Đã áp dụng giảm thêm 20%!' }
        : {
            status: 'error',
            text: 'Mã FLEURE20 tạm ngưng: cần tổng đơn từ 450.000đ trở lên.',
          };
    }

    if (code === 'YEUHOA15') {
      return { status: 'success', text: 'Đã áp dụng giảm 15% thành viên mới!' };
    }

    if (code === 'FREESHIP60') {
      return { status: 'success', text: 'Đã miễn phí vận chuyển hỏa tốc!' };
    }

    return null;
  });

  readonly voucherStatus = computed(() => this.voucherState()?.status ?? null);
  readonly voucherFeedback = computed(() => this.voucherState()?.text ?? null);

  readonly shippingFee = computed(() => {
    if (this.shop.cartItems().length === 0) return 0;
    if (this.appliedVoucher() === 'FREESHIP60') return 0;
    return this.shop.cartSubtotal() >= 399000 ? 0 : 25000;
  });

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

  readonly grandTotal = computed(() =>
    Math.max(0, this.shop.cartSubtotal() - this.voucherDiscount() + this.shippingFee())
  );

  onVoucherInput(event: Event): void {
    this.voucherError.set(null);
    this.voucherInput.set((event.target as HTMLInputElement).value.toUpperCase());
  }

  onCustomerFieldInput(
    field: 'name' | 'phone' | 'address' | 'note',
    event: Event
  ): void {
    this.checkoutError.set(null);
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    if (field === 'name') this.customerName.set(value);
    else if (field === 'phone') this.customerPhone.set(value);
    else if (field === 'address') this.customerAddress.set(value);
    else this.customerNote.set(value);
  }

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

    this.appliedVoucher.set(null);
    this.voucherError.set('Mã không hợp lệ. Thử: FLEURE20, YEUHOA15 hoặc FREESHIP60.');
  }

  checkout(): void {
    const cart = this.shop.cartItems();
    if (cart.length === 0 || this.submittingOrder()) return;

    const fullName = this.customerName().trim();
    const phone = this.customerPhone().trim();
    const address = this.customerAddress().trim();
    const note = this.customerNote().trim();

    if (!fullName) {
      this.checkoutError.set('Vui lòng nhập họ tên người nhận hoa.');
      return;
    }
    if (!/^[0-9+\s.-]{9,15}$/.test(phone)) {
      this.checkoutError.set('Vui lòng nhập số điện thoại liên hệ hợp lệ (9–15 ký tự số).');
      return;
    }
    if (!address) {
      this.checkoutError.set('Vui lòng nhập địa chỉ giao hoa nội thành.');
      return;
    }

    this.checkoutError.set(null);
    this.submittingOrder.set(true);
    this.orderSub?.unsubscribe();

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
          this.submittingOrder.set(false);
          this.lastOrder.set(saved);
          this.orderPlaced.set(true);
          this.appliedVoucher.set(null);
          this.voucherInput.set('');
          this.voucherError.set(null);
          this.customerNote.set('');
        },
        error: (err: { error?: { message?: string } }) => {
          this.submittingOrder.set(false);
          this.checkoutError.set(
            err?.error?.message ||
              'Không thể lưu đơn hàng vào MongoDB. Hãy kiểm tra Backend API đang chạy ở cổng 5000.'
          );
        },
      });
  }

  continueShoppingAfterOrder(): void {
    this.orderPlaced.set(false);
    this.lastOrder.set(null);
  }

  formatVnd(amount: number): string {
    return `${amount.toLocaleString('vi-VN')}đ`;
  }
}
