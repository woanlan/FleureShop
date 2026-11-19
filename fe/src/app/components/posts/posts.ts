import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Post, PostCategory } from '../../models/post';
import { ShopService } from '../../services/shop.service';
import { createFocusScheduler } from '../../utils/dom-focus';
import { DataState } from '../shared/data-state/data-state';
import { Icon } from '../shared/icon/icon';

@Component({
  selector: 'app-posts',
  imports: [RouterLink, Icon, DataState],
  templateUrl: './posts.html',
  styleUrl: './posts.css',
})
export class Posts {
  readonly shop = inject(ShopService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queryParams = toSignal(this.route.queryParamMap);
  private readonly readerCard = viewChild<ElementRef<HTMLElement>>('readerCard');
  private readonly scheduleFocus = createFocusScheduler(this.destroyRef);

  readonly categories: PostCategory[] = [
    'Tất cả',
    'Chăm sóc hoa',
    'Ý nghĩa hoa',
    'Nghệ thuật gói',
    'Xu hướng',
  ];

  readonly selectedCategory = signal<PostCategory>('Tất cả');
  readonly selectedPostId = signal<number | null>(null);

  readonly sortedPosts = computed(() =>
    [...this.shop.posts()].sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt)
    )
  );

  readonly filteredPosts = computed(() => {
    const cat = this.selectedCategory();
    const list = this.sortedPosts();
    return cat === 'Tất cả' ? list : list.filter((p) => p.category === cat);
  });

  readonly activePost = computed<Post | null>(() => {
    const id = this.selectedPostId();
    if (!id) return null;
    return this.shop.posts().find((p) => p.id === id) ?? null;
  });

  readonly relatedProduct = computed(() => {
    const post = this.activePost();
    return post ? this.shop.getProductById(post.relatedProductId) : undefined;
  });

  constructor() {
    effect(() => {
      const idParam = this.queryParams()?.get('id');
      if (idParam) {
        const parsed = Number(idParam);
        if (!Number.isNaN(parsed)) {
          this.selectedPostId.set(parsed);
        }
      }
    });
  }

  selectCategory(cat: PostCategory): void {
    this.selectedCategory.set(cat);
  }

  openPost(postId: number): void {
    this.selectedPostId.set(postId);
    this.scheduleFocus(() => this.readerCard()?.nativeElement);
  }

  closePost(): void {
    this.selectedPostId.set(null);
  }
}
