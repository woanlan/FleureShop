import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { routes } from '../../app.routes';
import { flushShopCatalog, PRODUCTS_FIXTURE } from '../../testing/mock-catalog';
import { Products } from './products';

describe('Products', () => {
  let component: Products;
  let fixture: ComponentFixture<Products>;
  let httpTesting: HttpTestingController;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let queryParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(convertToParamMap({}));
    queryParamMap$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [Products],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
            queryParamMap: queryParamMap$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Products);
    component = fixture.componentInstance;
    flushShopCatalog(httpTesting);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create and paginate products from MongoDB', () => {
    expect(component).toBeTruthy();
    expect(component.pagedProducts().length).toBeGreaterThan(0);
  });

  it('should filter by /category/:slug via route paramMap subscription', async () => {
    paramMap$.next(convertToParamMap({ slug: 'hoa-tinh-yeu' }));

    const catReq = httpTesting.expectOne('/api/products?categorySlug=hoa-tinh-yeu');
    const loveFlowers = PRODUCTS_FIXTURE.filter((p) => p.categorySlug === 'hoa-tinh-yeu');
    catReq.flush(loveFlowers);

    await fixture.whenStable();
    expect(component.selectedCategorySlug()).toBe('hoa-tinh-yeu');
    expect(component.filteredProducts().length).toBe(loveFlowers.length);
  });

  it('should sort products by price ascending and descending', () => {
    component.selectSort('price-asc');
    const asc = component.filteredProducts().map((p) => p.priceValue);
    expect(asc[0] <= asc[asc.length - 1]).toBe(true);

    component.selectSort('price-desc');
    const desc = component.filteredProducts().map((p) => p.priceValue);
    expect(desc[0] >= desc[desc.length - 1]).toBe(true);
  });
});
