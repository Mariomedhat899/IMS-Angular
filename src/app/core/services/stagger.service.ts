import { Injectable, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StaggerService {
  constructor(private zone: NgZone) {}

  animate(selector: string, container?: HTMLElement, delayStep = 60) {
    this.zone.runOutsideAngular(() => {
      const items = (container || document).querySelectorAll<HTMLElement>(selector);
      if (!items.length) return;

      const resolvedEasing = this.resolveEasing();
      const now = performance.now();
      items.forEach((el, idx) => {
        const delay = idx * delayStep;
        el.animate(
          [
            { opacity: '0', transform: 'translateY(14px) scale(0.98)' },
            { opacity: '1', transform: 'translateY(0) scale(1)' }
          ],
          {
            duration: 450,
            delay,
            easing: resolvedEasing,
            fill: 'backwards'
          }
        );
      });
    });
  }

  private resolveEasing(): string {
    if (typeof document === 'undefined') {
      return 'cubic-bezier(0.23, 1, 0.32, 1)';
    }
    const value = getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim();
    return value || 'cubic-bezier(0.23, 1, 0.32, 1)';
  }
}
