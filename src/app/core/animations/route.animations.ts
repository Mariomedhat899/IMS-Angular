import { animate, style, transition, trigger } from '@angular/animations';

export const fadeInAnimation = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ opacity: 0, transform: 'translateY(4px)' }),
    animate('260ms var(--ease-out)', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);
