import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../services/shop.service';
import { DataState } from '../shared/data-state/data-state';
import { Icon } from '../shared/icon/icon';
import { ProductCard } from '../shared/product-card/product-card';

@Component({
  imports: [RouterLink, ProductCard, Icon, DataState],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  readonly shop = inject(ShopService);

  readonly slides = this.shop.banners;
  readonly products = this.shop.products;
  readonly posts = this.shop.posts;

  readonly currentSlideIndex = signal(0);
  readonly activeSlide = computed(() => {
    const list = this.slides();
    if (list.length === 0) return null;
    return list[this.currentSlideIndex()] ?? list[0] ?? null;
  });

  readonly newProducts = computed(() => {
    const fromHomeApi = this.shop.homeNewProducts();
    if (fromHomeApi.length > 0) return fromHomeApi;
    return [...this.products()].sort((a, b) => b.id - a.id).slice(0, 4);
  });

  readonly saleProducts = computed(() => {
    const fromHomeApi = this.shop.homeSaleProducts();
    if (fromHomeApi.length > 0) return fromHomeApi;
    return [...this.products()]
      .filter((p) => p.discount > 0)
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 4);
  });

  readonly bestSellingProducts = computed(() => {
    const fromHomeApi = this.shop.homeBestSellingProducts();
    if (fromHomeApi.length > 0) return fromHomeApi;
    return [...this.products()].sort((a, b) => b.sold - a.sold).slice(0, 4);
  });

  // Load đúng 3 bài viết mới nhất từ API Trang chủ / danh sách > 3 bài viết
  readonly latestPosts = computed(() => {
    const fromHomeApi = this.shop.homeLatestPosts();
    if (fromHomeApi.length > 0) return fromHomeApi;
    return [...this.posts()]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, 3);
  });

  selectSlide(index: number): void {
    this.currentSlideIndex.set(index);
  }
}
