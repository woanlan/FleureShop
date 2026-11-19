/**
 * Footer – Chân trang của toàn bộ website FLEURÉ.
 *
 * Hiển thị thông tin liên hệ cửa hàng (địa chỉ, điện thoại, giờ mở cửa),
 * điều hướng nhanh đến các trang chính và bản quyền.
 * Component này không có logic nghiệp vụ — chỉ dùng RouterLink để điều hướng
 * và Icon để hiển thị icon dòng (Lucide).
 */
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';

@Component({
  imports: [RouterLink, Icon], // Dùng RouterLink cho điều hướng, Icon cho biểu tượng
  selector: 'app-footer',     // Thẻ HTML <app-footer>
  styleUrl: './footer.css',
  templateUrl: './footer.html',
})
export class Footer {} // Không có state hay logic — template tự đủ
