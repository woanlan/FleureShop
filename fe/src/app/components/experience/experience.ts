/**
 * Experience – Trang "Trải Nghiệm" của FLEURÉ.
 *
 * Hiển thị thư viện video YouTube được lưu trong MongoDB (collection experiences).
 * Người dùng có thể:
 *   1. Lọc video theo danh mục (Tất cả / Atelier FLEURÉ / Kỹ thuật bó hoa / Chăm hoa tại nhà)
 *   2. Chọn video để xem trình phát nhúng YouTube bên trái
 *   3. Mua sản phẩm liên kết với video đang xem (linkedProduct)
 *
 * Kỹ thuật:
 *   - Signal computed để lọc/tìm video mà không cần subscription thủ công
 *   - viewBoostMap: cộng thêm lượt xem cục bộ khi người dùng click (không ghi về DB)
 *   - createFocusScheduler: đặt focus về khung player sau khi chọn video (hỗ trợ bàn phím/screen reader)
 */
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
  imports: [RouterLink, Icon, DataState], // DataState: hiển thị trạng thái loading/lỗi MongoDB
  templateUrl: './experience.html',
  styleUrl: './experience.css',
})
export class Experience {
  /** ShopService: lấy dữ liệu video từ MongoDB và thêm sản phẩm vào giỏ */
  readonly shop = inject(ShopService);

  /** DestroyRef: dọn dẹp scheduler khi component unmount */
  private readonly destroyRef = inject(DestroyRef);

  /** Tham chiếu đến khung player (#playerCard) để đặt focus sau khi chọn video */
  private readonly playerCard = viewChild<ElementRef<HTMLElement>>('playerCard');

  /** Scheduler đặt focus an toàn, tránh lỗi khi DOM chưa kịp render */
  private readonly scheduleFocus = createFocusScheduler(this.destroyRef);

  /** Danh sách các danh mục video có thể lọc — đồng bộ với dữ liệu trong MongoDB */
  readonly categories: ExperienceCategory[] = [
    'Tất cả',
    'Atelier FLEURÉ',
    'Kỹ thuật bó hoa',
    'Chăm hoa tại nhà',
  ];

  /** Danh mục đang được chọn để lọc (mặc định: Tất cả) */
  readonly selectedCategory = signal<ExperienceCategory>('Tất cả');

  /** ID của video đang phát (mặc định: video đầu tiên có id=1) */
  readonly activeVideoId = signal<number>(1);

  /**
   * Bản đồ lượt xem ảo: { videoId → số lần người dùng click trong phiên này }.
   * Cộng thêm vào views thực từ DB khi hiển thị (không ghi ngược về server).
   */
  readonly viewBoostMap = signal<Record<number, number>>({});

  /** Danh sách video sau khi lọc theo danh mục đang chọn */
  readonly filteredVideos = computed(() => {
    const cat = this.selectedCategory();
    const list = this.shop.experiences();
    return cat === 'Tất cả' ? list : list.filter((v) => v.category === cat);
  });

  /**
   * Video đang được phát — tìm theo activeVideoId.
   * Nếu không tìm thấy (ví dụ sau khi lọc danh mục), tự động fallback về video đầu tiên.
   */
  readonly activeVideo = computed<ExperienceVideo | null>(() => {
    const list = this.shop.experiences();
    if (list.length === 0) return null;
    const id = this.activeVideoId();
    return list.find((v) => v.id === id) ?? list[0] ?? null;
  });

  /** Sản phẩm hoa liên kết với video đang phát (dùng để hiển thị nút mua nhanh) */
  readonly linkedProduct = computed(() => {
    const video = this.activeVideo();
    return video ? this.shop.getProductById(video.linkedProductId) : undefined;
  });

  /**
   * Tổng lượt xem = lượt xem từ DB + lượt xem ảo trong phiên.
   * Cho cảm giác trang web "sống động" khi người dùng tương tác.
   */
  getViews(video: ExperienceVideo): number {
    return video.views + (this.viewBoostMap()[video.id] ?? 0);
  }

  /** Chọn danh mục lọc video */
  selectCategory(cat: ExperienceCategory): void {
    this.selectedCategory.set(cat);
  }

  /**
   * Chọn video để phát:
   * - Cộng 1 vào viewBoostMap nếu là video mới (không phải video đang xem)
   * - Đặt focus về khung player để hỗ trợ điều hướng bàn phím
   */
  selectVideo(videoId: number): void {
    const isNewSelection = this.activeVideoId() !== videoId;
    this.activeVideoId.set(videoId);
    if (isNewSelection) {
      // Cộng lượt xem ảo cho video vừa chọn
      this.viewBoostMap.update((map) => ({
        ...map,
        [videoId]: (map[videoId] ?? 0) + 1,
      }));
    }
    // Đặt focus về khung player (hỗ trợ bàn phím & screen reader)
    this.scheduleFocus(() => this.playerCard()?.nativeElement);
  }

  /** Thêm sản phẩm liên kết của video đang xem vào giỏ hàng */
  buyLinkedProduct(): void {
    const product = this.linkedProduct();
    if (product) {
      this.shop.addToCart(product, 1);
    }
  }
}
