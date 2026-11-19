import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { routes } from '../../app.routes';
import { flushShopCatalog, PRODUCTS_FIXTURE } from '../../testing/mock-catalog';
import { Product } from './product';

describe('Product', () => {
  let component: Product;
  let fixture: ComponentFixture<Product>;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(
      convertToParamMap({ slug: 'chau-hong-tinh-nhan-ruc-ro' })
    );

    await TestBed.configureTestingModule({
      imports: [Product],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMap$.asObservable() },
        },
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Product);
    component = fixture.componentInstance;
    flushShopCatalog(httpTesting);
    httpTesting
      .expectOne('/api/products/chau-hong-tinh-nhan-ruc-ro')
      .flush(PRODUCTS_FIXTURE.find((p) => p.slug === 'chau-hong-tinh-nhan-ruc-ro')!);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should reset quantity to 1 when navigating to another product slug', async () => {
    component.changeQty(2);
    expect(component.quantity()).toBe(3);

    paramMap$.next(convertToParamMap({ slug: 'bo-huong-duong-rang-ro-nang' }));
    httpTesting
      .expectOne('/api/products/bo-huong-duong-rang-ro-nang')
      .flush(PRODUCTS_FIXTURE.find((p) => p.slug === 'bo-huong-duong-rang-ro-nang')!);

    await fixture.whenStable();
    expect(component.product()?.id).toBe(2);
    expect(component.quantity()).toBe(1);
  });

  it('should render clean not-found state without role="status" for invalid slugs', async () => {
    paramMap$.next(convertToParamMap({ slug: 'khong-ton-tai-999' }));
    httpTesting
      .expectOne('/api/products/khong-ton-tai-999')
      .flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(component.product()).toBeNull();
    expect(el.querySelector('.not-found-wrap')?.getAttribute('role')).toBeNull();
    expect(el.querySelector('.not-found-card h1')?.textContent).toContain('Không tìm thấy');
  });
});
