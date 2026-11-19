import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../models/product';
import { ShopService } from '../../../services/shop.service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, Icon],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  private readonly shop = inject(ShopService);

  readonly product = input.required<Product>();
  readonly badgeMode = input<'auto' | 'sale' | 'sold' | 'new'>('auto');

  readonly badgeInfo = computed(() => {
    const p = this.product();
    const mode = this.badgeMode();

    if (mode === 'sale' && p.discount > 0) {
      return { text: `-${p.discount}%`, cssClass: 'label-sale' };
    }
    if (mode === 'sold') {
      return { text: `Bán chạy`, cssClass: 'label-hot' };
    }
    if (mode === 'new') {
      return { text: 'NEW', cssClass: 'label-new' };
    }
    if (p.badge) {
      return { text: p.badge, cssClass: p.badgeClass ?? 'label-new' };
    }
    return null;
  });

  onBuy(): void {
    this.shop.addToCart(this.product(), 1);
  }
}
