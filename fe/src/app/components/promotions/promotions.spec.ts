import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { flushShopCatalog } from '../../testing/mock-catalog';
import { Promotions } from './promotions';

describe('Promotions', () => {
  let component: Promotions;
  let fixture: ComponentFixture<Promotions>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Promotions],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Promotions);
    component = fixture.componentInstance;
    flushShopCatalog(httpTesting);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create and display discounted items', () => {
    expect(component).toBeTruthy();
    expect(component.discountedProducts().length).toBeGreaterThan(0);
  });

  it('should mark voucher copied and clean up timers on destroy', () => {
    component.copyVoucher('FLEURE20');
    expect(component.copiedCode()).toBe('FLEURE20');
    expect(() => fixture.destroy()).not.toThrow();
  });
});
