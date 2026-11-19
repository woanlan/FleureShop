import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Product as ProductModel } from '../../models/product';
import { ShopService } from '../../services/shop.service';
import { DataState } from '../shared/data-state/data-state';
import { Icon } from '../shared/icon/icon';
import { ProductCard } from '../shared/product-card/product-card';

@Component({
  imports: [RouterLink, ProductCard, Icon, DataState],
  selector: 'app-product',
  styleUrl: './product.css',
  templateUrl: './product.html',
})
export class Product {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly shop = inject(ShopService);

  private readonly params = toSignal(this.route.paramMap);
  private readonly apiProduct = signal<ProductModel | null>(null);
  private readonly apiDoneForKey = signal<string | null>(null);

  readonly quantity = linkedSignal(() => {
    this.params();
    return 1;
  });

  readonly product = computed(() => {
    const slugOrId = (this.params()?.get('slug') ?? this.params()?.get('id'))?.trim();
    if (!slugOrId) {
      return this.shop.products()[0] ?? null;
    }

    const fromApi = this.apiProduct();
    if (fromApi && (fromApi.slug === slugOrId.toLowerCase() || String(fromApi.id) === slugOrId)) {
      return fromApi;
    }
    return this.shop.getProductBySlugOrId(slugOrId) ?? null;
  });

  readonly loadingDetail = computed(() => {
    const slugOrId = (this.params()?.get('slug') ?? this.params()?.get('id'))?.trim();
    if (!slugOrId) return this.shop.loading();
    if (this.product()) return false;
    return this.apiDoneForKey() !== slugOrId;
  });

  readonly relatedProducts = computed(() => {
    const current = this.product();
    if (!current) {
      return [];
    }
    return this.shop
      .products()
      .filter((p) => p.id !== current.id)
      .slice(0, 2);
  });

  constructor() {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        switchMap((params) => {
          const slugOrId = (params.get('slug') ?? params.get('id'))?.trim() ?? '';
          if (!slugOrId) {
            this.apiProduct.set(null);
            this.apiDoneForKey.set(null);
            return of<ProductModel | null>(null);
          }

          return this.shop.fetchProductBySlugOrId(slugOrId).pipe(
            catchError(() => of<ProductModel | null>(null))
          );
        })
      )
      .subscribe((fetched) => {
        const slugOrId = (this.params()?.get('slug') ?? this.params()?.get('id'))?.trim() ?? '';
        this.apiProduct.set(fetched);
        this.apiDoneForKey.set(slugOrId || null);
      });
  }

  changeQty(delta: number): void {
    this.quantity.update((q) => Math.max(1, q + delta));
  }

  addToCart(): void {
    const current = this.product();
    if (!current) return;
    this.shop.addToCart(current, this.quantity());
  }

  buyNow(): void {
    const current = this.product();
    if (!current) return;
    this.shop.addToCart(current, this.quantity());
    this.router.navigate(['/cart']);
  }
}
