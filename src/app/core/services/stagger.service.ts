import { Injectable, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StaggerService {
  constructor(private zone: NgZone) {}

  animate(selector: string, container?: HTMLElement, delayStep = 60) {
    this.zone.runOutsideAngular(() => {
      const items = (container || document).querySelectorAll<HTMLElement>(selector);
      if (!items.length) return;

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
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'backwards'
          }
        );
      });
    });
  }
}
