/**
 * `ShopService` — Dịch vụ trung tâm (Singleton State & API Service) của cửa hàng hoa FLEURÉ.
 * Đảm nhận 3 vai trò cốt lõi bằng cơ chế phản ứng hiện đại Angular Signals + RxJS:
 * 1. Gọi REST API từ Backend Express + MongoDB (`forkJoin`, lọc danh mục, tìm kiếm trực tiếp, gửi đơn hàng).
 * 2. Quản lý trạng thái Giỏ hàng và tự động đồng bộ bền vững vào `localStorage` của trình duyệt.
 * 3. Quản lý thông báo nổi (Toast) kèm tính năng Hoàn tác (`undoRemove`) khi khách lỡ tay xóa sản phẩm.
 */
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Observable, Subscription, forkJoin, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Banner, HomePayload } from '../models/banner';
import { Category } from '../models/category';
import { ExperienceVideo } from '../models/experience';
import { CreateOrderPayload, SavedOrder } from '../models/order';
import { Post } from '../models/post';
import { Product } from '../models/product';

/** Cấu trúc một dòng sản phẩm trong giỏ hàng: gồm thông tin bó hoa và số lượng đặt mua */
export interface CartItem {
  product: Product;
  quantity: number;
}

/** Khóa định danh dùng để lưu và khôi phục giỏ hàng trong `window.localStorage` */
export const CART_STORAGE_KEY = 'fleure_asm_cart_v1';

@Injectable({
  // Đăng ký ở cấp 'root' để toàn ứng dụng dùng chung duy nhất 1 phiên bản (Singleton)
  providedIn: 'root',
})
export class ShopService {
  // Tiêm các dịch vụ nền tảng của Angular thông qua hàm `inject()`
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_BASE_URL);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  // ================= NHÓM SIGNALS LƯU DỮ LIỆU DANH MỤC TỪ MONGODB =================
  readonly banners = signal<Banner[]>([]);                   // Danh sách slide banner trang chủ
  readonly categories = signal<Category[]>([]);              // Danh sách danh mục hoa
  readonly products = signal<Product[]>([]);                 // Toàn bộ danh sách sản phẩm hoa
  readonly homeNewProducts = signal<Product[]>([]);          // Nhóm sản phẩm mới trên Trang chủ
  readonly homeBestSellingProducts = signal<Product[]>([]);  // Nhóm sản phẩm bán chạy trên Trang chủ
  readonly homeSaleProducts = signal<Product[]>([]);         // Nhóm sản phẩm khuyến mãi trên Trang chủ
  readonly posts = signal<Post[]>([]);                       // Toàn bộ bài viết góc cẩm nang
  readonly homeLatestPosts = signal<Post[]>([]);             // Bài viết mới nhất hiển thị ở Trang chủ
  readonly experiences = signal<ExperienceVideo[]>([]);      // Danh sách video trải nghiệm bó hoa

  // ================= NHÓM SIGNALS TRẠNG THÁI TẢI & TÌM KIẾM TRỰC TIẾP =================
  readonly loading = signal<boolean>(true);                  // Cờ báo đang tải dữ liệu từ Backend
  readonly error = signal<string | null>(null);              // Thông báo lỗi khi mất kết nối MongoDB/API
  readonly searchQuery = signal('');                         // Từ khóa người dùng đang gõ trên thanh Header
  readonly searchResults = signal<Product[] | null>(null);   // Kết quả tìm kiếm trả về từ API (`null` khi chưa tìm)
  readonly searching = signal<boolean>(false);               // Cờ báo đang thực hiện truy vấn tìm kiếm lên server

  // ================= NHÓM SIGNALS GIỎ HÀNG & THÔNG BÁO HOÀN TÁC (TOAST) =================
  readonly cartItems = signal<CartItem[]>([]);               // Danh sách các bó hoa hiện có trong giỏ hàng
  private cartTouched = false;                               // Đánh dấu người dùng (hoặc localStorage) đã từng tác động giỏ hàng

  readonly toastMessage = signal<string | null>(null);       // Nội dung thông báo nổi hiển thị cuối màn hình
  readonly lastRemoved = signal<{ item: CartItem; index: number } | null>(null); // Lưu tạm mục vừa xóa và vị trí cũ để hỗ trợ nút "Hoàn tác"
  private toastTimer: ReturnType<typeof setTimeout> | null = null; // Bộ đếm thời gian tự động đóng Toast
  private loadSub: Subscription | null = null;               // Quản lý tiến trình gọi API danh mục để hủy khi cần
  private searchSub: Subscription | null = null;             // Quản lý tiến trình tìm kiếm trực tiếp để tránh chồng chéo kết quả

  constructor() {
    // Tự động hủy các bộ hẹn giờ và hủy đăng ký Observable khi Service bị dọn dẹp (tránh rò rỉ bộ nhớ)
    this.destroyRef.onDestroy(() => {
      this.clearToastTimer();
      this.loadSub?.unsubscribe();
      this.searchSub?.unsubscribe();
    });

    // Bước 1: Khôi phục ngay giỏ hàng đã lưu từ phiên truy cập trước trong localStorage
    this.restoreCartFromStorage();
    // Bước 2: Gọi API tải dữ liệu trang chủ và danh mục sản phẩm từ MongoDB
    this.loadCatalog();
  }

  /** Xóa bộ hẹn giờ ẩn thông báo Toast nếu đang chạy */
  private clearToastTimer(): void {
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  /**
   * Đọc và khôi phục giỏ hàng từ `localStorage` khi tải lại trang:
   * Kiểm tra môi trường trình duyệt (`isPlatformBrowser`) và lọc kỹ cấu trúc từng phần tử
   * để đảm bảo an toàn nếu dữ liệu cũ trong trình duyệt bị hỏng định dạng JSON.
   */
  private restoreCartFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw === null) return;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(
          (entry): entry is CartItem =>
            Boolean(entry) &&
            typeof entry === 'object' &&
            'product' in entry &&
            'quantity' in entry &&
            typeof entry.quantity === 'number' &&
            entry.quantity > 0 &&
            Boolean((entry as CartItem).product?.id)
        );
        this.cartItems.set(valid);
        this.cartTouched = true;
      }
    } catch {
      // Bỏ qua an toàn nếu dữ liệu localStorage bị lỗi cú pháp JSON
    }
  }

  /** Ghi danh sách giỏ hàng hiện tại xuống `localStorage` để giữ nguyên khi F5 tải lại trang */
  private saveCartToStorage(items: CartItem[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Bỏ qua nếu bộ nhớ trình duyệt đầy hoặc đang bật chế độ ẩn danh chặn lưu trữ
    }
  }

  /**
   * Hàm trung gian cập nhật Signal `cartItems` theo nguyên tắc bất biến (Immutable)
   * đồng thời tự động lưu ngay trạng thái mới xuống `localStorage`.
   */
  private commitCart(updater: (items: CartItem[]) => CartItem[]): void {
    this.cartTouched = true;
    this.cartItems.update((items) => {
      const next = updater(items);
      this.saveCartToStorage(next);
      return next;
    });
  }

  /**
   * Tải đồng thời dữ liệu Trang chủ (`/api/home`) cùng toàn bộ Sản phẩm, Bài viết, Trải nghiệm
   * từ MongoDB thông qua toán tử `forkJoin()` của RxJS (chạy song song 4 request cùng lúc để tối ưu tốc độ).
   */
  loadCatalog(): void {
    this.loadSub?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    this.loadSub = forkJoin({
      home: this.http.get<HomePayload>(`${this.apiBase}/home`),
      products: this.http.get<Product[]>(`${this.apiBase}/products`),
      posts: this.http.get<Post[]>(`${this.apiBase}/posts`),
      experiences: this.http.get<ExperienceVideo[]>(`${this.apiBase}/experiences`),
    }).subscribe({
      next: ({ home, products, posts, experiences }) => {
        // Cập nhật các khu vực trên Trang chủ
        this.banners.set(home.banners);
        this.categories.set(home.categories);
        this.homeNewProducts.set(home.newProducts);
        this.homeBestSellingProducts.set(home.bestSellingProducts);
        this.homeSaleProducts.set(home.saleProducts);
        this.homeLatestPosts.set(home.latestPosts);

        // Cập nhật các bộ sưu tập đầy đủ cho những màn hình con
        this.products.set(products);
        this.posts.set(posts);
        this.experiences.set(experiences);

        // Nếu người dùng mở web lần đầu tiên (chưa có dữ liệu giỏ trong localStorage), thêm sẵn 1 bó hoa mẫu
        if (!this.cartTouched && this.cartItems().length === 0 && products.length > 0) {
          this.cartItems.set([{ product: products[0], quantity: 1 }]);
        }
        this.loading.set(false);
      },
      error: () => {
        // Khi Backend tắt hoặc lỗi mạng, tắt trạng thái loading và bật thông báo hướng dẫn thử lại
        this.loading.set(false);
        this.error.set(
          'Không thể tải dữ liệu từ MongoDB. Hãy kiểm tra Backend API đang chạy ở cổng 5000 rồi thử lại.'
        );
      },
    });
  }

  /**
   * Tìm kiếm sản phẩm trực tiếp từ Backend qua `GET /api/products?search=...` khi gõ trên Header:
   * - Hủy ngay request tìm kiếm trước đó (`unsubscribe`) nếu người dùng tiếp tục gõ ký tự mới.
   * - Nếu chuỗi rỗng thì xóa kết quả tìm kiếm để quay lại danh sách mặc định.
   */
  searchProductsFromApi(query: string): void {
    const trimmed = query.trim();
    this.searchSub?.unsubscribe();

    if (!trimmed) {
      this.searching.set(false);
      this.searchResults.set(null);
      return;
    }

    this.searching.set(true);
    const params = new HttpParams().set('search', trimmed);
    this.searchSub = this.http
      .get<Product[]>(`${this.apiBase}/products`, { params })
      .subscribe({
        next: (items) => {
          this.searchResults.set(items);
          this.searching.set(false);
        },
        error: () => {
          // Nếu mạng chập chờn tạm thời, đặt về null để giao diện tự động dùng bộ lọc phía Client làm dự phòng
          this.searching.set(false);
          this.searchResults.set(null);
        },
      });
  }

  /** Truy vấn danh sách sản phẩm theo `categorySlug` hoặc từ khóa `search` cho đường dẫn `/category/:slug` */
  fetchProductsByFilter(opts: { categorySlug?: string; search?: string }): Observable<Product[]> {
    let params = new HttpParams();
    if (opts.categorySlug && opts.categorySlug !== 'tat-ca') {
      params = params.set('categorySlug', opts.categorySlug);
    }
    if (opts.search?.trim()) {
      params = params.set('search', opts.search.trim());
    }
    return this.http.get<Product[]>(`${this.apiBase}/products`, { params });
  }

  /** Truy vấn chi tiết 1 bó hoa từ MongoDB theo `slug` chuẩn SEO hoặc `id` số cho trang `/product/:slug` */
  fetchProductBySlugOrId(slugOrId: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiBase}/products/${encodeURIComponent(slugOrId)}`);
  }

  /** `computed` Signal tự động tính tổng số lượng sản phẩm trong giỏ (hiển thị lên huy hiệu góc phải Header) */
  readonly cartCount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  /** `computed` Signal tự động tính tổng tiền hàng tạm tính (VNĐ) mỗi khi giỏ hàng thay đổi số lượng */
  readonly cartSubtotal = computed(() =>
    this.cartItems().reduce(
      (sum, item) => sum + item.product.priceValue * item.quantity,
      0
    )
  );

  /** Tìm nhanh sản phẩm theo `id` số trong danh sách đã tải sẵn trên bộ nhớ máy khách */
  getProductById(id: number): Product | undefined {
    return this.products().find((p) => p.id === id);
  }

  /** Tìm nhanh sản phẩm theo `slug` hoặc chuỗi `id` không phân biệt chữ hoa/thường */
  getProductBySlugOrId(slugOrId: string): Product | undefined {
    const key = slugOrId.trim().toLowerCase();
    return this.products().find((p) => p.slug === key || String(p.id) === key);
  }

  /** Thêm bó hoa vào giỏ: nếu đã có sẵn thì cộng dồn số lượng, nếu chưa có thì nối thêm vào cuối mảng */
  addToCart(product: Product, quantity = 1): void {
    this.commitCart((items) => {
      const idx = items.findIndex((i) => i.product.id === product.id);
      if (idx > -1) {
        return items.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...items, { product, quantity }];
    });
    this.showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
  }

  /** Tăng hoặc giảm số lượng sản phẩm (`delta` là +1 hoặc -1); nếu giảm về <= 0 thì chuyển sang xóa khỏi giỏ */
  updateQuantity(productId: number, delta: number): void {
    const current = this.cartItems();
    const idx = current.findIndex((i) => i.product.id === productId);
    if (idx === -1) return;

    const target = current[idx];
    if (target.quantity + delta <= 0) {
      this.removeItem(productId);
      return;
    }

    this.commitCart((items) =>
      items.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + delta }
          : item
      )
    );
  }

  /** Xóa một bó hoa khỏi giỏ và chụp lại trạng thái `lastRemoved` để người dùng có thể bấm "Hoàn tác" trong 4.5 giây */
  removeItem(productId: number): void {
    const current = this.cartItems();
    const idx = current.findIndex((i) => i.product.id === productId);
    if (idx === -1) return;

    const removedItem = current[idx];
    this.lastRemoved.set({ item: { ...removedItem }, index: idx });
    this.commitCart((items) => items.filter((item) => item.product.id !== productId));
    this.showToast(`Đã xóa "${removedItem.product.name}" khỏi giỏ`, 4500, true);
  }

  /** Khôi phục lại sản phẩm vừa xóa về đúng vị trí cũ trong giỏ hàng khi bấm nút "Hoàn tác" trên Toast */
  undoRemove(): void {
    const snapshot = this.lastRemoved();
    if (!snapshot) return;

    this.commitCart((items) => {
      const existingIdx = items.findIndex(
        (i) => i.product.id === snapshot.item.product.id
      );
      if (existingIdx > -1) {
        return items.map((item, idx) =>
          idx === existingIdx
            ? { ...item, quantity: item.quantity + snapshot.item.quantity }
            : item
        );
      }
      const next = [...items];
      const insertAt = Math.min(snapshot.index, next.length);
      next.splice(insertAt, 0, snapshot.item);
      return next;
    });
    this.lastRemoved.set(null);
    this.showToast(`Đã khôi phục "${snapshot.item.product.name}"`);
  }

  /**
   * Gửi thông tin đặt hàng lên Backend (`POST /api/orders`) để lưu vào MongoDB.
   * Sử dụng toán tử `tap()` của RxJS để tự động làm sạch giỏ hàng ngay khi API báo lưu đơn thành công.
   */
  placeOrder(payload: CreateOrderPayload): Observable<SavedOrder> {
    return this.http.post<SavedOrder>(`${this.apiBase}/orders`, payload).pipe(
      tap(() => {
        this.clearCart();
      })
    );
  }

  /** Xóa toàn bộ sản phẩm trong giỏ hàng và đồng bộ mảng rỗng xuống `localStorage` */
  clearCart(): void {
    this.dismissToast();
    this.commitCart(() => []);
  }

  /** Đóng ngay thanh thông báo Toast và xóa dữ liệu chờ hoàn tác */
  dismissToast(): void {
    this.clearToastTimer();
    this.toastMessage.set(null);
    this.lastRemoved.set(null);
  }

  /**
   * Hiển thị thanh thông báo Toast với thời gian tự động tắt (`durationMs`, mặc định 2.8 giây).
   * Tham số `keepUndo = true` giúp giữ lại nút "Hoàn tác" khi thông báo đến từ thao tác xóa sản phẩm.
   */
  showToast(message: string, durationMs = 2800, keepUndo = false): void {
    if (!keepUndo) {
      this.lastRemoved.set(null);
    }
    this.toastMessage.set(message);
    this.clearToastTimer();
    this.toastTimer = setTimeout(() => {
      this.toastTimer = null;
      this.toastMessage.set(null);
      this.lastRemoved.set(null);
    }, durationMs);
  }
}
