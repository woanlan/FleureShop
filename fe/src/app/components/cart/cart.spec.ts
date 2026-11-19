import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { CART_STORAGE_KEY, ShopService } from '../../services/shop.service';
import { flushShopCatalog } from '../../testing/mock-catalog';
import { Cart } from './cart';

describe('Cart', () => {
  let component: Cart;
  let fixture: ComponentFixture<Cart>;
  let shop: ShopService;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    await TestBed.configureTestingModule({
      imports: [Cart],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Cart);
    component = fixture.componentInstance;
    shop = TestBed.inject(ShopService);
    flushShopCatalog(httpTesting);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should render an h1 heading landmark and handle invalid voucher state', () => {
    const h1 = (fixture.nativeElement as HTMLElement).querySelector('h1');
    expect(h1?.textContent).toContain('Giỏ hàng FLEURÉ');

    component.voucherInput.set('INVALID');
    component.applyVoucher();
    fixture.detectChanges();

    expect(component.voucherStatus()).toBe('error');
    expect(component.appliedVoucher()).toBeNull();
  });

  it('should clear previous applied voucher on error and invalidate FLEURE20 when subtotal drops below 450k', () => {
    const itemId = shop.cartItems()[0].product.id;
    shop.updateQuantity(itemId, 1);
    component.voucherInput.set('FLEURE20');
    component.applyVoucher();
    expect(component.voucherStatus()).toBe('success');
    expect(component.voucherDiscount()).toBeGreaterThan(0);

    shop.updateQuantity(itemId, -1);
    expect(component.voucherDiscount()).toBe(0);
    expect(component.voucherStatus()).toBe('error');
    expect(component.voucherFeedback()).toContain('450.000đ');

    component.voucherInput.set('YEUHOA15');
    component.applyVoucher();
    expect(component.appliedVoucher()).toBe('YEUHOA15');

    component.voucherInput.set('NOPE');
    component.applyVoucher();
    expect(component.appliedVoucher()).toBeNull();
    expect(component.voucherStatus()).toBe('error');
  });

  it('requires customer info before sending order to MongoDB', () => {
    component.checkout();
    expect(component.checkoutError()).toContain('họ tên');
    expect(component.orderPlaced()).toBe(false);
    httpTesting.expectNone('/api/orders');
  });

  it('submits order to POST /api/orders, resets cart/voucher, and displays saved receipt', () => {
    component.customerName.set('Nguyễn Minh Thư');
    component.customerPhone.set('0909123456');
    component.customerAddress.set('45 Nguyễn Huệ, Quận 1, TP.HCM');
    component.voucherInput.set('YEUHOA15');
    component.applyVoucher();

    component.checkout();
    expect(component.submittingOrder()).toBe(true);

    const req = httpTesting.expectOne('/api/orders');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.voucherCode).toBe('YEUHOA15');
    expect(req.request.body.customer.fullName).toBe('Nguyễn Minh Thư');

    req.flush({
      orderCode: 'FL-246810',
      customer: {
        fullName: 'Nguyễn Minh Thư',
        phone: '0909123456',
        address: '45 Nguyễn Huệ, Quận 1, TP.HCM',
      },
      items: [],
      voucherCode: 'YEUHOA15',
      subtotal: 390000,
      discountAmount: 58500,
      shippingFee: 25000,
      grandTotal: 356500,
      status: 'Đã tiếp nhận',
    });

    expect(component.submittingOrder()).toBe(false);
    expect(component.orderPlaced()).toBe(true);
    expect(component.lastOrder()?.orderCode).toBe('FL-246810');
    expect(shop.cartItems().length).toBe(0);
    expect(component.appliedVoucher()).toBeNull();
  });
});
