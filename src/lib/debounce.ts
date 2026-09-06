/**
 * debounce.ts — High-Performance Input Debouncing & Throttling
 * Clean Architecture: Shared Utilities
 * Complies with technical.md §11.8 (Frontend Performance: Debounce search inputs)
 */

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number = 250
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limitMs: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}
