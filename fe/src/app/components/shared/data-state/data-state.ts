import { Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/** Unified loading skeleton and MongoDB connection error card across catalog views. */
@Component({
  selector: 'app-data-state',
  imports: [Icon],
  template: `
    @if (loading()) {
      <section class="state-card" role="status" aria-live="polite">
        <span class="state-badge is-loading"><app-icon name="flower-2" [size]="22" /></span>
        <p class="state-title">{{ loadingLabel() }}</p>
        <div class="skeleton-bars" aria-hidden="true">
          <span class="bar w-75"></span>
          <span class="bar w-55"></span>
        </div>
      </section>
    } @else if (error(); as err) {
      <section class="state-card is-error" role="alert">
        <span class="state-badge is-error"><app-icon name="circle-alert" [size]="22" /></span>
        <h2 class="state-heading">Chưa kết nối được MongoDB</h2>
        <p class="state-desc">{{ err }}</p>
        <button type="button" class="retry-btn" (click)="retry.emit()">
          Thử tải lại dữ liệu
        </button>
      </section>
    }
  `,
  styles: `
    .state-card {
      margin: 16px;
      padding: 26px 18px;
      border-radius: 18px;
      background: var(--pastel-surface);
      border: 1px solid var(--ruby-border);
      text-align: center;
      box-shadow: var(--shadow-card);
    }

    .state-card.is-error {
      border-color: var(--danger-border);
    }

    .state-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin: 0 auto 12px;
    }

    .state-badge.is-loading {
      background: var(--ruby-light);
      color: var(--ruby-primary);
    }

    .state-badge.is-error {
      background: var(--danger-bg);
      color: var(--danger);
    }

    .state-heading {
      font-family: var(--font-serif);
      font-size: 18px;
      color: var(--text-title);
      margin: 0 0 6px;
    }

    .state-title,
    .state-desc {
      margin: 0 auto 14px;
      font-size: 13.5px;
      line-height: 1.5;
      color: var(--text-muted);
      max-width: 32ch;
    }

    .state-title {
      color: var(--text-title);
      font-weight: 600;
    }

    .skeleton-bars {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .bar {
      display: block;
      height: 10px;
      border-radius: 999px;
      background: linear-gradient(90deg, #fce7ec 0%, #fff0f4 50%, #fce7ec 100%);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }

    .bar.w-75 {
      width: 72%;
    }

    .bar.w-55 {
      width: 48%;
    }

    @keyframes shimmer {
      0% {
        background-position: 100% 0;
      }
      100% {
        background-position: -100% 0;
      }
    }

    .retry-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 10px 22px;
      border-radius: var(--radius-pill);
      background: var(--ruby-primary);
      color: #ffffff;
      font-size: 13.5px;
      font-weight: 700;
      transition: background-color 0.2s ease;
    }

    .retry-btn:hover {
      background: var(--ruby-hover);
    }

    @media (prefers-reduced-motion: reduce) {
      .bar {
        animation: none;
      }
      .retry-btn {
        transition: none;
      }
    }
  `,
})
export class DataState {
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly loadingLabel = input<string>('Đang tải dữ liệu hoa tươi từ MongoDB...');
  readonly retry = output<void>();
}
