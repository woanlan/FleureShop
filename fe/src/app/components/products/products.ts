import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of, switchMap, catchError } from 'rxjs';
import { Product } from '../../models/product';
import { ShopService } from '../../services/shop.service';
import { DataState } from '../shared/data-state/data-state';
import { Icon, LucideIconName } from '../shared/icon/icon';
import { ProductCard } from '../shared/product-card/product-card';

// 5 chế độ sắp xếp sản phẩm: Mới nhất, Bán chạy, Giảm giá, Giá tăng dần, Giá giảm dần
type SortOption = 'newest' | 'bestseller' | 'promotion' | 'price-asc' | 'price-desc';

// Cấu trúc dữ liệu cho từng nút chọn (chip) danh mục trên thanh lọc ngang
interface CategoryChip {
  label: string;
  slug: string;
  icon: LucideIconName;
}

// Tập hợp các tên icon hợp lệ để kiểm tra an toàn dữ liệu icon trả về từ MongoDB
const VALID_ICON_SET = new Set<string>([
  'layout-grid',
  'cake',
  'heart',
  'party-popper',
  'gem',
  'flower',
]);

/**
 * Component Danh sách sản phẩm (Products - dùng cho cả `/products` và `/category/:slug`):
 * - Hiển thị thanh chip danh mục động lấy từ collection `categories` trong MongoDB.
 * - Lắng nghe `:slug` bằng `route.paramMap` + `switchMap` để gọi `GET /api/products?categorySlug=:slug`
 *   ngay tức thì mà không cần tải lại trang (chuẩn Single Page Application).
 * - Đồng bộ từ khóa tìm kiếm `?search=` từ URL và thanh tìm kiếm trên Header.
 * - Hỗ trợ 5 kiểu sắp xếp và phân trang phía Client (`pageSize = 6` sản phẩm/trang).
 */
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

  // Tạo danh sách chip danh mục động: ghép nút mặc định "Tất cả" ở đầu với các danh mục từ MongoDB
  readonly categories = computed<CategoryChip[]>(() => [
    { label: 'Tất cả', slug: 'tat-ca', icon: 'layout-grid' },
    ...this.shop.categories().map((cat) => ({
      label: cat.name,
      slug: cat.slug,
      icon: (VALID_ICON_SET.has(cat.icon) ? cat.icon : 'flower') as LucideIconName,
    })),
  ]);

  // Danh sách 5 tùy chọn sắp xếp để hiển thị ra nhóm nút radio trên giao diện
  readonly sortOptions: { label: string; icon: LucideIconName; value: SortOption }[] = [
    { label: 'Mới nhất', icon: 'sparkles', value: 'newest' },
    { label: 'Bán chạy', icon: 'flame', value: 'bestseller' },
    { label: 'Giảm giá', icon: 'tag', value: 'promotion' },
    { label: 'Giá thấp → cao', icon: 'arrow-up-narrow-wide', value: 'price-asc' },
    { label: 'Giá cao → thấp', icon: 'arrow-down-wide-narrow', value: 'price-desc' },
  ];

  // Các Signal lưu trạng thái bộ lọc, sắp xếp và phân trang hiện tại
  readonly selectedCategorySlug = signal<string>('tat-ca');
  readonly sortBy = signal<SortOption>('newest');
  readonly currentPage = signal(1);
  readonly pageSize = 6; // Quy định mỗi trang hiển thị tối đa 6 mẫu hoa
  readonly categoryApiProducts = signal<Product[] | null>(null);
  readonly loadingCategory = signal(false);

  // Tự động suy ra tiêu đề danh mục đang chọn để hiển thị ở Breadcrumb và đầu lưới sản phẩm
  readonly activeCategoryLabel = computed(() => {
    const slug = this.selectedCategorySlug();
    if (slug === 'tat-ca') return 'Bộ sưu tập hoa tươi';
    return (
      this.categories().find((c) => c.slug === slug)?.label ?? 'Bộ sưu tập hoa tươi'
    );
  });

  // Lọc kết hợp (theo danh mục + từ khóa tìm kiếm) và sắp xếp theo 1 trong 5 tiêu chí đã chọn
  readonly filteredProducts = computed(() => {
    const query = this.shop.searchQuery().trim().toLowerCase();
    const categorySlug = this.selectedCategorySlug();
    const sort = this.sortBy();

    // Ưu tiên nguồn dữ liệu: kết quả tìm kiếm API -> sản phẩm theo danh mục API -> toàn bộ danh mục trong bộ nhớ
    const searchFromApi = query ? this.shop.searchResults() : null;
    const baseSource =
      searchFromApi ??
      (categorySlug !== 'tat-ca' ? this.categoryApiProducts() : null) ??
      this.shop.products();

    // Lọc khớp slug danh mục và từ khóa (tìm trong tên hoa, tên danh mục hoặc mô tả)
    const list = baseSource.filter((p) => {
      const matchCategory = categorySlug === 'tat-ca' || p.categorySlug === categorySlug;
      const matchQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query);
      return matchCategory && matchQuery;
    });

    // Sắp xếp trên bản sao mảng ([...list]) để không làm thay đổi mảng dữ liệu gốc
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

  // Tính tổng số trang dựa trên số lượng sản phẩm sau khi lọc và pageSize = 6 (ít nhất là 1 trang)
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize))
  );

  // Tạo mảng số thứ tự trang [1, 2, ..., totalPages] để dùng vòng lặp @for vẽ các nút phân trang
  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, idx) => idx + 1)
  );

  // Cắt đúng 6 sản phẩm thuộc trang hiện tại (currentPage) để hiển thị ra lưới
  readonly pagedProducts = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

  constructor() {
    // Theo dõi tham số :slug trên URL (/category/:slug) kết hợp switchMap:
    // Khi người dùng bấm đổi danh mục, switchMap tự hủy request cũ và gọi GET /api/products?categorySlug=:slug
    // giúp cập nhật danh sách hoa từ MongoDB mượt mà, không cần reload lại trang trình duyệt
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

    // Đồng bộ tham số ?search= trên thanh địa chỉ URL (hỗ trợ khi người dùng chia sẻ link hoặc bấm F5 reload)
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((qParams) => {
      const searchParam = qParams.get('search');
      if (searchParam !== null && searchParam !== this.shop.searchQuery()) {
        this.shop.searchQuery.set(searchParam);
        this.shop.searchProductsFromApi(searchParam);
      }
    });

    // Tự động quay về trang 1 mỗi khi từ khóa tìm kiếm trên Header thay đổi
    effect(() => {
      this.shop.searchQuery();
      this.currentPage.set(1);
    });
  }

  // Đổi tiêu chí sắp xếp và đưa danh sách quay lại trang 1
  selectSort(sort: SortOption): void {
    this.sortBy.set(sort);
    this.currentPage.set(1);
  }

  // Chuyển đến trang chỉ định nếu số trang nằm trong khoảng hợp lệ [1 .. totalPages]
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  // Xóa toàn bộ bộ lọc, từ khóa tìm kiếm và đưa người dùng về danh sách tất cả hoa ban đầu
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
