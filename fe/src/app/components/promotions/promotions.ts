import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../services/shop.service';
import { DataState } from '../shared/data-state/data-state';
import { Icon } from '../shared/icon/icon';
import { ProductCard } from '../shared/product-card/product-card';

interface Voucher {
  code: string;
  label: string;
  condition: string;
}

@Component({
  selector: 'app-promotions',
  imports: [RouterLink, ProductCard, Icon, DataState],
  templateUrl: './promotions.html',
  styleUrl: './promotions.css',
})
export class Promotions {
  readonly shop = inject(ShopService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

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

  readonly copiedCode = signal<string | null>(null);
  readonly filterMode = signal<'all' | 'deep' | 'under350'>('all');
  readonly secondsRemaining = signal(5 * 3600 + 42 * 60 + 18);

  readonly countdown = computed(() => {
    const total = this.secondsRemaining();
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return { h: pad(h), m: pad(m), s: pad(s) };
  });

  readonly discountedProducts = computed(() => {
    const mode = this.filterMode();
    const base = this.shop
      .products()
      .filter((p) => p.discount > 0)
      .sort((a, b) => b.discount - a.discount);

    if (mode === 'deep') {
      return base.filter((p) => p.discount >= 20);
    }
    if (mode === 'under350') {
      return base.filter((p) => p.priceValue <= 350000);
    }
    return base;
  });

  private copyTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isPlatformBrowser(this.platformId)) {
      timer = setInterval(() => {
        const next = this.secondsRemaining() - 1;
        this.secondsRemaining.set(Math.max(0, next));
        if (next <= 0 && timer !== null) {
          clearInterval(timer);
          timer = null;
        }
      }, 1000);
    }

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

  setFilter(mode: 'all' | 'deep' | 'under350'): void {
    this.filterMode.set(mode);
  }

  copyVoucher(code: string): void {
    this.copiedCode.set(code);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          this.shop.showToast(`Đã sao chép mã ${code}`);
        })
        .catch(() => {
          this.shop.showToast(`Mã ưu đãi: ${code}`);
        });
    } else {
      this.shop.showToast(`Mã ưu đãi: ${code}`);
    }
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }
    this.copyTimeout = setTimeout(() => {
      this.copyTimeout = null;
      if (this.copiedCode() === code) {
        this.copiedCode.set(null);
      }
    }, 2200);
  }
}
