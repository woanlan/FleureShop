import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { flushShopCatalog } from '../../testing/mock-catalog';
import { Experience } from './experience';

describe('Experience', () => {
  let component: Experience;
  let fixture: ComponentFixture<Experience>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Experience],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Experience);
    component = fixture.componentInstance;
    flushShopCatalog(httpTesting);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create and have active video', () => {
    expect(component).toBeTruthy();
    expect(component.activeVideo()).toBeTruthy();
  });

  it('should switch active video and avoid double counting view boosts when re-clicking active', () => {
    const first = component.activeVideo()!;
    const initialViews = component.getViews(first);

    component.selectVideo(first.id);
    expect(component.getViews(first)).toBe(initialViews);

    const second = component.filteredVideos()[1];
    component.selectVideo(second.id);
    expect(component.activeVideo()?.id).toBe(second.id);
    expect(component.getViews(second)).toBe(second.views + 1);
  });
});
