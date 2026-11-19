import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { flushShopCatalog } from '../../testing/mock-catalog';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    flushShopCatalog(httpTesting);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load 3 newest posts from more than 3 posts', () => {
    expect(component.posts().length).toBeGreaterThan(3);
    expect(component.latestPosts().length).toBe(3);
    const dates = component.latestPosts().map((p) => p.publishedAt);
    expect(dates[0] >= dates[1]).toBe(true);
    expect(dates[1] >= dates[2]).toBe(true);
  });

  it('should render best selling and article sections', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Hoa bán chạy nhất');
    expect(compiled.textContent).toContain('Bài viết mới nhất');
  });
});
