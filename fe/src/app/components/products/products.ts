import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of, switchMap, catchError } from 'rxjs';
import { Product } from '../../models/product';
import { ShopService } from '../../services/shop.service';
import { DataState } from '../shared/data-state/data-state';
import { Icon, LucideIconName } from '../shared/icon/icon';
import { ProductCard } from '../shared/product-card/product-card';

type SortOption = 'newest' | 'bestseller' | 'promotion' | 'price-asc' | 'price-desc';

interface CategoryChip {
  label: string;
  slug: string;
  icon: LucideIconName;
}

const VALID_ICON_SET = new Set<string>([
  'layout-grid',
  'cake',
  'heart',
  'party-popper',
  'gem',
  'flower',
]);

@Component({
  imports: [RouterLink, ProductCard, Icon, DataState],
  selector: 'app-products',
  styleUrl: './products.css',
  templateUrl: './products.html',
})
export class Products {
  readonly shop = inject(ShopService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = computed<CategoryChip[]>(() => [
    { label: 'Tất cả', slug: 'tat-ca', icon: 'layout-grid' },
    ...this.shop.categories().map((cat) => ({
      label: cat.name,
      slug: cat.slug,
      icon: (VALID_ICON_SET.has(cat.icon) ? cat.icon : 'flower') as LucideIconName,
    })),
  ]);

  readonly sortOptions: { label: string; icon: LucideIconName; value: SortOption }[] = [
    { label: 'Mới nhất', icon: 'sparkles', value: 'newest' },
    { label: 'Bán chạy', icon: 'flame', value: 'bestseller' },
    { label: 'Giảm giá', icon: 'tag', value: 'promotion' },
    { label: 'Giá thấp → cao', icon: 'arrow-up-narrow-wide', value: 'price-asc' },
    { label: 'Giá cao → thấp', icon: 'arrow-down-wide-narrow', value: 'price-desc' },
  ];

  readonly selectedCategorySlug = signal<string>('tat-ca');
  readonly sortBy = signal<SortOption>('newest');
  readonly currentPage = signal(1);
  readonly pageSize = 6;
  readonly categoryApiProducts = signal<Product[] | null>(null);
  readonly loadingCategory = signal(false);

  readonly activeCategoryLabel = computed(() => {
    const slug = this.selectedCategorySlug();
    if (slug === 'tat-ca') return 'Bộ sưu tập hoa tươi';
    return (
      this.categories().find((c) => c.slug === slug)?.label ?? 'Bộ sưu tập hoa tươi'
    );
  });

  readonly filteredProducts = computed(() => {
    const query = this.shop.searchQuery().trim().toLowerCase();
    const categorySlug = this.selectedCategorySlug();
    const sort = this.sortBy();

    const searchFromApi = query ? this.shop.searchResults() : null;
    const baseSource =
      searchFromApi ??
      (categorySlug !== 'tat-ca' ? this.categoryApiProducts() : null) ??
      this.shop.products();

    const list = baseSource.filter((p) => {
      const matchCategory = categorySlug === 'tat-ca' || p.categorySlug === categorySlug;
      const matchQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query);
      return matchCategory && matchQuery;
    });

    if (sort === 'bestseller') {
      return [...list].sort((a, b) => b.sold - a.sold);
    }
    if (sort === 'promotion') {
      return [...list].sort((a, b) => b.discount - a.discount);
    }
    if (sort === 'price-asc') {
      return [...list].sort((a, b) => a.priceValue - b.priceValue);
    }
    if (sort === 'price-desc') {
      return [...list].sort((a, b) => b.priceValue - a.priceValue);
    }
    return [...list].sort((a, b) => b.id - a.id);
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize))
  );

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, idx) => idx + 1)
  );

  readonly pagedProducts = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

  constructor() {
    // Theo dõi param :slug của /category/:slug để tải lại đúng danh mục từ MongoDB
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        switchMap((params) => {
          const slug = (params.get('slug') || 'tat-ca').trim().toLowerCase();
          this.selectedCategorySlug.set(slug);
          this.currentPage.set(1);

          if (slug === 'tat-ca') {
            this.loadingCategory.set(false);
            return of<Product[] | null>(null);
          }

          this.loadingCategory.set(true);
          return this.shop
            .fetchProductsByFilter({ categorySlug: slug })
            .pipe(catchError(() => of<Product[] | null>(null)));
        })
      )
      .subscribe((items) => {
        this.categoryApiProducts.set(items);
        this.loadingCategory.set(false);
      });

    // Đồng bộ ?search= trên URL nếu reload trực tiếp từ trang kết quả tìm kiếm
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((qParams) => {
      const searchParam = qParams.get('search');
      if (searchParam !== null && searchParam !== this.shop.searchQuery()) {
        this.shop.searchQuery.set(searchParam);
        this.shop.searchProductsFromApi(searchParam);
      }
    });

    effect(() => {
      this.shop.searchQuery();
      this.currentPage.set(1);
    });
  }

  selectSort(sort: SortOption): void {
    this.sortBy.set(sort);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  resetFilters(): void {
    this.sortBy.set('newest');
    this.shop.searchQuery.set('');
    this.shop.searchProductsFromApi('');
    this.currentPage.set(1);
    if (this.selectedCategorySlug() !== 'tat-ca') {
      this.router.navigate(['/products']);
    }
  }
}
