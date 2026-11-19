import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../../app.routes';
import { flushShopCatalog, PRODUCTS_FIXTURE } from '../../../testing/mock-catalog';
import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    flushShopCatalog(httpTesting);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create and call /api/products?search= on search submit', () => {
    expect(component).toBeTruthy();

    component.shop.searchQuery.set('Tulip');
    component.onSearchSubmit(new Event('submit'));

    const searchReq = httpTesting.expectOne('/api/products?search=Tulip');
    expect(searchReq.request.method).toBe('GET');
    searchReq.flush(PRODUCTS_FIXTURE.filter((p) => p.name.includes('Tulip')));

    expect(component.shop.searchResults()?.length).toBeGreaterThan(0);
  });
});
