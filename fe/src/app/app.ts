/**
 * Component gốc (`App` / `<app-root>`) đóng vai trò khung giao diện chính (App Shell).
 * Giữ cố định Header ở đầu trang, Footer ở cuối trang, vùng `<router-outlet>` ở giữa
 * và hiển thị thanh thông báo Toast giỏ hàng dùng chung trên mọi màn hình.
 */
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Header } from './components/layout/header/header';
import { Footer } from './components/layout/footer/footer';
import { Icon } from './components/shared/icon/icon';
import { ShopService } from './services/shop.service';

@Component({
  imports: [RouterOutlet, RouterLink, Header, Footer, Icon],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  // Tiêu đề ứng dụng lưu bằng Angular Signal
  protected readonly title = signal('FLEURÉ – Flower Boutique');

  // Tiêm (inject) ShopService để đọc trạng thái thông báo Toast và xử lý nút Hoàn tác khi xóa sản phẩm
  readonly shop = inject(ShopService);
}
