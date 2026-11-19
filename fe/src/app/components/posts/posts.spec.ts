import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { flushShopCatalog } from '../../testing/mock-catalog';
import { Posts } from './posts';

describe('Posts', () => {
  let component: Posts;
  let fixture: ComponentFixture<Posts>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Posts],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Posts);
    component = fixture.componentInstance;
    flushShopCatalog(httpTesting);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create with more than 3 articles', () => {
    expect(component).toBeTruthy();
    expect(component.sortedPosts().length).toBeGreaterThan(3);
  });

  it('should open and close an article cleanly', () => {
    const firstId = component.sortedPosts()[0].id;
    component.openPost(firstId);
    fixture.detectChanges();
    expect(component.activePost()?.id).toBe(firstId);

    component.closePost();
    fixture.detectChanges();
    expect(component.activePost()).toBeNull();
  });
});
