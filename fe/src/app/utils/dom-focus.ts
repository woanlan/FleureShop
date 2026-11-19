/**
 * Tiện ích quản lý cuộn trang và điều phối tiêu điểm bàn phím (Focus Management / Accessibility).
 * Dùng khi người dùng bấm mở khung đọc chi tiết bài viết hoặc trình phát video trải nghiệm.
 */
import { DestroyRef } from '@angular/core';

/**
 * Tạo hàm lên lịch cuộn mượt (`scrollIntoView`) và đặt focus vào phần tử mục tiêu vừa hiển thị trên DOM:
 * - Tự động hủy bộ hẹn giờ cũ nếu người dùng bấm chuyển mục liên tục hoặc khi Component bị hủy (`DestroyRef`).
 * - Tôn trọng cài đặt giảm chuyển động (`prefers-reduced-motion: reduce`) của hệ điều hành.
 */
export function createFocusScheduler(
  destroyRef: DestroyRef
): (getTarget: () => HTMLElement | undefined) => void {
  // Lưu ID của setTimeout đang chờ để có thể hủy kịp thời tránh xung đột
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;

  // Hàm dọn dẹp bộ hẹn giờ đang chờ
  const cancelPending = (): void => {
    if (pendingTimer !== null) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
  };

  // Tự động hủy hẹn giờ ngay khi Component gọi hàm này bị đóng/hủy khỏi màn hình
  destroyRef.onDestroy(cancelPending);

  return (getTarget) => {
    cancelPending();
    // Bảo vệ an toàn khi chạy trong môi trường không có DOM thật
    if (typeof document === 'undefined') {
      return;
    }
    // Chờ 1 nhịp macrotask (0ms) để Angular render xong phần tử mới vào DOM rồi mới cuộn và focus
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      const el = getTarget();
      if (!el) {
        return;
      }
      // Kiểm tra xem người dùng có bật chế độ hạn chế hiệu ứng chuyển động hay không
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      // Cuộn khung nhìn tới đầu phần tử mục tiêu, sau đó chuyển focus bàn phím mà không gây giật cuộn lần hai
      el.scrollIntoView?.({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      el.focus?.({ preventScroll: true });
    }, 0);
  };
}
