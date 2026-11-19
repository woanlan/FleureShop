import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { flushShopCatalog, PRODUCTS_FIXTURE } from '../testing/mock-catalog';
import { CART_STORAGE_KEY, ShopService } from './shop.service';

describe('ShopService', () => {
  let service: ShopService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ShopService);
  });

  afterEach(() => {
    httpTesting.verify();
    window.localStorage.removeItem(CART_STORAGE_KEY);
  });

  it('loads home banners, categories, products, posts, and experiences from MongoDB API', () => {
    expect(service.loading()).toBe(true);
    flushShopCatalog(httpTesting);

    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.banners().length).toBe(3);
    expect(service.categories().length).toBe(5);
    expect(service.products().length).toBe(12);
    expect(service.posts().length).toBe(6);
    expect(service.experiences().length).toBe(4);
    expect(service.cartItems().length).toBe(1);
  });

  it('sets user-friendly error message when MongoDB backend is unreachable', () => {
    httpTesting
      .expectOne('/api/home')
      .flush({ message: 'Unavailable' }, { status: 503, statusText: 'Service Unavailable' });
    httpTesting.match('/api/products');
    httpTesting.match('/api/posts');
    httpTesting.match('/api/experiences');

    expect(service.loading()).toBe(false);
    expect(service.error()).toContain('MongoDB');
  });

  it('calls GET /api/products?search=... when searching via backend API', () => {
    flushShopCatalog(httpTesting);

    service.searchProductsFromApi('Tulip');
    const req = httpTesting.expectOne('/api/products?search=Tulip');
    expect(req.request.method).toBe('GET');

    const tulipItems = PRODUCTS_FIXTURE.filter((p) => p.name.includes('Tulip'));
    req.flush(tulipItems);

    expect(service.searchResults()?.length).toBe(tulipItems.length);
    expect(service.searching()).toBe(false);

    service.searchProductsFromApi('');
    expect(service.searchResults()).toBeNull();
  });

  it('persists cart items into localStorage when buying and clears properly', () => {
    flushShopCatalog(httpTesting);

    const tulip = service.products()[1];
    service.addToCart(tulip, 2);

    const storedRaw = window.localStorage.getItem(CART_STORAGE_KEY);
    expect(storedRaw).toBeTruthy();
    const parsed = JSON.parse(storedRaw!) as { product: { id: number }; quantity: number }[];
    expect(parsed.some((i) => i.product.id === tulip.id && i.quantity === 2)).toBe(true);

    service.clearCart();
    expect(service.cartItems().length).toBe(0);
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe('[]');
  });

  it('should remove an item and restore it at its original index via undoRemove', () => {
    flushShopCatalog(httpTesting);

    const second = service.products()[1];
    service.addToCart(second, 2);
    expect(service.cartItems().length).toBe(2);

    const firstId = service.cartItems()[0].product.id;
    service.removeItem(firstId);

    expect(service.cartItems().length).toBe(1);
    expect(service.lastRemoved()?.item.product.id).toBe(firstId);
    expect(service.toastMessage()).toContain('Đã xóa');

    service.undoRemove();
    expect(service.cartItems().length).toBe(2);
    expect(service.cartItems()[0].product.id).toBe(firstId);
    expect(service.lastRemoved()).toBeNull();
  });
});
