import { DestroyRef } from '@angular/core';

/**
 * Schedules focus + scroll to a newly revealed target panel, cancelling stale
 * timers on rapid clicks or component teardown and respecting reduced motion.
 */
export function createFocusScheduler(
  destroyRef: DestroyRef
): (getTarget: () => HTMLElement | undefined) => void {
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelPending = (): void => {
    if (pendingTimer !== null) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
  };

  destroyRef.onDestroy(cancelPending);

  return (getTarget) => {
    cancelPending();
    if (typeof document === 'undefined') {
      return;
    }
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      const el = getTarget();
      if (!el) {
        return;
      }
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      el.scrollIntoView?.({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      el.focus?.({ preventScroll: true });
    }, 0);
  };
}
