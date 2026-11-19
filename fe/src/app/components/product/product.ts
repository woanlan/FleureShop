import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Product as ProductModel } from '../../models/product';
import { ShopService } from '../../services/shop.service';
import { DataState } from '../shared/data-state/data-state';
import { Icon } from '../shared/icon/icon';
import { ProductCard } from '../shared/product-card/product-card';

/**
 * Component Chi tiết sản phẩm (Product - hỗ trợ đường dẫn `/product/:slug` hoặc `/product/:id`):
 * - Lắng nghe tham số `:slug` / `:id` bằng `route.paramMap` + `switchMap` để tải chi tiết hoa từ MongoDB.
 * - Ứng dụng `linkedSignal` của Angular hiện đại cho `quantity` để tự động reset số lượng về `1`
 *   mỗi khi người dùng chuyển sang xem một mẫu hoa gợi ý khác ngay trên cùng trang.
 * - Hiển thị sản phẩm liên quan (`relatedProducts`) và xử lý 2 luồng mua hàng: `addToCart()` và `buyNow()`.
 */
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

  // Chuyển Observable paramMap của Router thành Signal để tính toán đồng bộ trong computed / linkedSignal
  private readonly params = toSignal(this.route.paramMap);
  // Lưu dữ liệu chi tiết mẫu hoa tải trực tiếp từ API GET /api/products/:slugOrId
  private readonly apiProduct = signal<ProductModel | null>(null);
  // Ghi nhận khóa (slug/id) đã hoàn tất gọi API để phân biệt giữa "đang tải" và "không tồn tại"
  private readonly apiDoneForKey = signal<string | null>(null);

  // Lý do dùng linkedSignal thay vì signal(1) thông thường:
  // - Người dùng vẫn có thể bấm +/- để cập nhật số lượng tùy ý thông qua quantity.update(...).
  // - Nhưng khi bấm vào một mẫu hoa khác ở mục "Có thể bạn cũng thích" làm this.params() thay đổi,
  //   linkedSignal sẽ TỰ ĐỘNG đặt lại số lượng về 1 mà không cần viết thêm code reset thủ công!
  readonly quantity = linkedSignal(() => {
    this.params();
    return 1;
  });

  // Xác định mẫu hoa đang xem dựa theo :slug hoặc :id trên URL:
  // Ưu tiên bản ghi mới nhất từ API chi tiết (apiProduct), hoặc tra cứu nhanh từ danh sách trong ShopService
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

  // Kiểm tra trạng thái đang chờ phản hồi từ MongoDB trước khi kết luận không tìm thấy sản phẩm
  readonly loadingDetail = computed(() => {
    const slugOrId = (this.params()?.get('slug') ?? this.params()?.get('id'))?.trim();
    if (!slugOrId) return this.shop.loading();
    if (this.product()) return false;
    return this.apiDoneForKey() !== slugOrId;
  });

  // Danh sách "Có thể bạn cũng thích": lọc bỏ mẫu hoa đang xem hiện tại và lấy ra 2 mẫu gợi ý
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
    // Đọc :slug hoặc :id từ route.paramMap kết hợp switchMap:
    // Nếu người dùng bấm chuyển nhanh qua lại giữa các sản phẩm gợi ý, switchMap sẽ tự hủy request cũ
    // và chỉ giữ kết quả trả về của sản phẩm mới nhất từ Backend MongoDB
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

  // Tăng hoặc giảm số lượng đặt mua, đảm bảo số lượng luôn lớn hơn hoặc bằng 1
  changeQty(delta: number): void {
    this.quantity.update((q) => Math.max(1, q + delta));
  }

  // Thêm vào giỏ: lưu sản phẩm kèm số lượng vào ShopService (hiện toast) và ở lại trang chi tiết để xem tiếp
  addToCart(): void {
    const current = this.product();
    if (!current) return;
    this.shop.addToCart(current, this.quantity());
  }

  // Mua ngay: vừa thêm sản phẩm với số lượng đã chọn vào giỏ, vừa chuyển thẳng sang trang /cart để thanh toán
  buyNow(): void {
    const current = this.product();
    if (!current) return;
    this.shop.addToCart(current, this.quantity());
    this.router.navigate(['/cart']);
  }
}
