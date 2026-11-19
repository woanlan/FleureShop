/**
 * Posts – Trang "Bài Viết" của FLEURÉ.
 *
 * Hiển thị danh sách bài viết từ MongoDB (collection posts), hỗ trợ:
 *   1. Lọc theo danh mục (Tất cả / Chăm sóc hoa / Ý nghĩa hoa / Nghệ thuật gói / Xu hướng)
 *   2. Mở bài viết dạng side-reader (hiển thị nội dung đầy đủ không rời trang)
 *   3. Xem sản phẩm hoa liên quan với bài viết đang đọc
 *   4. Deep-link qua query param `?id=<postId>` (chia sẻ link đến bài viết cụ thể)
 *
 * Kỹ thuật:
 *   - `toSignal(route.queryParamMap)` → đọc query param một cách reactive
 *   - `effect()` → tự động mở bài viết khi URL thay đổi (deep-link)
 *   - `createFocusScheduler` → đặt focus về khung đọc khi mở bài (hỗ trợ bàn phím)
 *   - Bài viết được sắp xếp mới nhất trước (theo publishedAt)
 */
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
  imports: [RouterLink, Icon, DataState], // DataState: loading/lỗi kết nối MongoDB
  templateUrl: './posts.html',
  styleUrl: './posts.css',
})
export class Posts {
  /** ShopService: nguồn dữ liệu bài viết từ MongoDB */
  readonly shop = inject(ShopService);

  /** ActivatedRoute: đọc query params từ URL (?id=...) */
  private readonly route = inject(ActivatedRoute);

  /** DestroyRef: dọn dẹp effect và scheduler khi component bị hủy */
  private readonly destroyRef = inject(DestroyRef);

  /** Signal reactive wrap của queryParamMap — tự cập nhật khi URL thay đổi */
  private readonly queryParams = toSignal(this.route.queryParamMap);

  /** Tham chiếu đến khung đọc bài viết (#readerCard) để đặt focus */
  private readonly readerCard = viewChild<ElementRef<HTMLElement>>('readerCard');

  /** Scheduler đặt focus an toàn sau khi DOM render xong */
  private readonly scheduleFocus = createFocusScheduler(this.destroyRef);

  /** Danh sách danh mục lọc — đồng bộ với field category trong MongoDB */
  readonly categories: PostCategory[] = [
    'Tất cả',
    'Chăm sóc hoa',
    'Ý nghĩa hoa',
    'Nghệ thuật gói',
    'Xu hướng',
  ];

  /** Danh mục đang được chọn (mặc định: Tất cả) */
  readonly selectedCategory = signal<PostCategory>('Tất cả');

  /** ID bài viết đang mở trong side-reader (null = không có bài nào đang mở) */
  readonly selectedPostId = signal<number | null>(null);

  /** Tất cả bài viết sắp xếp mới nhất trước (theo publishedAt ISO string) */
  readonly sortedPosts = computed(() =>
    [...this.shop.posts()].sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt)
    )
  );

  /** Danh sách bài viết sau khi lọc theo danh mục đang chọn */
  readonly filteredPosts = computed(() => {
    const cat = this.selectedCategory();
    const list = this.sortedPosts();
    return cat === 'Tất cả' ? list : list.filter((p) => p.category === cat);
  });

  /**
   * Bài viết đang hiển thị trong side-reader.
   * Trả về null nếu chưa chọn bài nào.
   */
  readonly activePost = computed<Post | null>(() => {
    const id = this.selectedPostId();
    if (!id) return null;
    return this.shop.posts().find((p) => p.id === id) ?? null;
  });

  /**
   * Sản phẩm hoa liên quan đến bài viết đang đọc.
   * Dùng để hiển thị gợi ý mua hoa phù hợp với nội dung bài.
   */
  readonly relatedProduct = computed(() => {
    const post = this.activePost();
    return post ? this.shop.getProductById(post.relatedProductId) : undefined;
  });

  constructor() {
    /**
     * Effect tự động mở bài viết khi URL có query param ?id=<postId>.
     * Hỗ trợ deep-link: share URL dạng /bai_viet?id=3 → tự mở bài số 3.
     */
    effect(() => {
      const idParam = this.queryParams()?.get('id');
      if (idParam) {
        const parsed = Number(idParam);
        if (!Number.isNaN(parsed)) {
          this.selectedPostId.set(parsed); // Mở bài viết tương ứng
        }
      }
    });
  }

  /** Chọn danh mục lọc bài viết */
  selectCategory(cat: PostCategory): void {
    this.selectedCategory.set(cat);
  }

  /**
   * Mở bài viết trong side-reader:
   * - Lưu ID bài viết vào signal
   * - Đặt focus về khung đọc (hỗ trợ bàn phím & screen reader)
   */
  openPost(postId: number): void {
    this.selectedPostId.set(postId);
    this.scheduleFocus(() => this.readerCard()?.nativeElement);
  }

  /** Đóng side-reader, quay về danh sách bài viết */
  closePost(): void {
    this.selectedPostId.set(null);
  }
}
