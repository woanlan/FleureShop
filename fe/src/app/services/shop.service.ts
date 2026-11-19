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

export interface CartItem {
  product: Product;
  quantity: number;
}

export const CART_STORAGE_KEY = 'fleure_asm_cart_v1';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_BASE_URL);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly banners = signal<Banner[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly homeNewProducts = signal<Product[]>([]);
  readonly homeBestSellingProducts = signal<Product[]>([]);
  readonly homeSaleProducts = signal<Product[]>([]);
  readonly posts = signal<Post[]>([]);
  readonly homeLatestPosts = signal<Post[]>([]);
  readonly experiences = signal<ExperienceVideo[]>([]);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly searchResults = signal<Product[] | null>(null);
  readonly searching = signal<boolean>(false);

  readonly cartItems = signal<CartItem[]>([]);
  private cartTouched = false;

  readonly toastMessage = signal<string | null>(null);
  readonly lastRemoved = signal<{ item: CartItem; index: number } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private loadSub: Subscription | null = null;
  private searchSub: Subscription | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearToastTimer();
      this.loadSub?.unsubscribe();
      this.searchSub?.unsubscribe();
    });

    this.restoreCartFromStorage();
    this.loadCatalog();
  }

  private clearToastTimer(): void {
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

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
      // Ignore malformed browser storage cleanly
    }
  }

  private saveCartToStorage(items: CartItem[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota or private-mode failures
    }
  }

  private commitCart(updater: (items: CartItem[]) => CartItem[]): void {
    this.cartTouched = true;
    this.cartItems.update((items) => {
      const next = updater(items);
      this.saveCartToStorage(next);
      return next;
    });
  }

  /** Fetches Home API (/api/home) + full collections from MongoDB via Express REST API. */
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
        this.banners.set(home.banners);
        this.categories.set(home.categories);
        this.homeNewProducts.set(home.newProducts);
        this.homeBestSellingProducts.set(home.bestSellingProducts);
        this.homeSaleProducts.set(home.saleProducts);
        this.homeLatestPosts.set(home.latestPosts);

        this.products.set(products);
        this.posts.set(posts);
        this.experiences.set(experiences);

        if (!this.cartTouched && this.cartItems().length === 0 && products.length > 0) {
          this.cartItems.set([{ product: products[0], quantity: 1 }]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(
          'Không thể tải dữ liệu từ MongoDB. Hãy kiểm tra Backend API đang chạy ở cổng 5000 rồi thử lại.'
        );
      },
    });
  }

  /** Executes live backend search via GET /api/products?search=... for Header input. */
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
          // Gracefully fall back to client filter on transient API hiccup
          this.searching.set(false);
          this.searchResults.set(null);
        },
      });
  }

  /** Fetches filtered products from MongoDB for category /:slug routes. */
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

  /** Fetches a single flower product from MongoDB by slug or numeric id. */
  fetchProductBySlugOrId(slugOrId: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiBase}/products/${encodeURIComponent(slugOrId)}`);
  }

  readonly cartCount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly cartSubtotal = computed(() =>
    this.cartItems().reduce(
      (sum, item) => sum + item.product.priceValue * item.quantity,
      0
    )
  );

  getProductById(id: number): Product | undefined {
    return this.products().find((p) => p.id === id);
  }

  getProductBySlugOrId(slugOrId: string): Product | undefined {
    const key = slugOrId.trim().toLowerCase();
    return this.products().find((p) => p.slug === key || String(p.id) === key);
  }

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

  removeItem(productId: number): void {
    const current = this.cartItems();
    const idx = current.findIndex((i) => i.product.id === productId);
    if (idx === -1) return;

    const removedItem = current[idx];
    this.lastRemoved.set({ item: { ...removedItem }, index: idx });
    this.commitCart((items) => items.filter((item) => item.product.id !== productId));
    this.showToast(`Đã xóa "${removedItem.product.name}" khỏi giỏ`, 4500, true);
  }

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

  /** Submits an order to Express + MongoDB and clears the active cart on success. */
  placeOrder(payload: CreateOrderPayload): Observable<SavedOrder> {
    return this.http.post<SavedOrder>(`${this.apiBase}/orders`, payload).pipe(
      tap(() => {
        this.clearCart();
      })
    );
  }

  clearCart(): void {
    this.dismissToast();
    this.commitCart(() => []);
  }

  dismissToast(): void {
    this.clearToastTimer();
    this.toastMessage.set(null);
    this.lastRemoved.set(null);
  }

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
