import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExperienceCategory, ExperienceVideo } from '../../models/experience';
import { ShopService } from '../../services/shop.service';
import { createFocusScheduler } from '../../utils/dom-focus';
import { DataState } from '../shared/data-state/data-state';
import { Icon } from '../shared/icon/icon';

@Component({
  selector: 'app-experience',
  imports: [RouterLink, Icon, DataState],
  templateUrl: './experience.html',
  styleUrl: './experience.css',
})
export class Experience {
  readonly shop = inject(ShopService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly playerCard = viewChild<ElementRef<HTMLElement>>('playerCard');
  private readonly scheduleFocus = createFocusScheduler(this.destroyRef);

  readonly categories: ExperienceCategory[] = [
    'Tất cả',
    'Atelier FLEURÉ',
    'Kỹ thuật bó hoa',
    'Chăm hoa tại nhà',
  ];

  readonly selectedCategory = signal<ExperienceCategory>('Tất cả');
  readonly activeVideoId = signal<number>(1);
  readonly viewBoostMap = signal<Record<number, number>>({});

  readonly filteredVideos = computed(() => {
    const cat = this.selectedCategory();
    const list = this.shop.experiences();
    return cat === 'Tất cả' ? list : list.filter((v) => v.category === cat);
  });

  readonly activeVideo = computed<ExperienceVideo | null>(() => {
    const list = this.shop.experiences();
    if (list.length === 0) return null;
    const id = this.activeVideoId();
    return list.find((v) => v.id === id) ?? list[0] ?? null;
  });

  readonly linkedProduct = computed(() => {
    const video = this.activeVideo();
    return video ? this.shop.getProductById(video.linkedProductId) : undefined;
  });

  getViews(video: ExperienceVideo): number {
    return video.views + (this.viewBoostMap()[video.id] ?? 0);
  }

  selectCategory(cat: ExperienceCategory): void {
    this.selectedCategory.set(cat);
  }

  selectVideo(videoId: number): void {
    const isNewSelection = this.activeVideoId() !== videoId;
    this.activeVideoId.set(videoId);
    if (isNewSelection) {
      this.viewBoostMap.update((map) => ({
        ...map,
        [videoId]: (map[videoId] ?? 0) + 1,
      }));
    }
    this.scheduleFocus(() => this.playerCard()?.nativeElement);
  }

  buyLinkedProduct(): void {
    const product = this.linkedProduct();
    if (product) {
      this.shop.addToCart(product, 1);
    }
  }
}
