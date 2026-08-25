import { Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { PreloaderComponent } from '../../core/components/preloader.component';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, PreloaderComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent implements AfterViewInit, OnDestroy {
  routeName = '';
  private cleanup?: () => void;
  logoutLoading = false;
  private sub?: Subscription;
  private lastY = 0;
  private ticking = false;

  constructor(public api: ApiService, private router: Router, private cdr: ChangeDetectorRef) {
    const initial = this.router.url || '';
    const parts = initial.split('/').filter(Boolean);
    this.routeName = parts[0] || '';

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = e.urlAfterRedirects || e.url || '';
        const parts = url.split('/').filter(Boolean);
        const next = parts[0] || '';
        if (next !== this.routeName) {
          this.routeName = next;
        }
        this.playRouteTransition();
      });
  }

  ngAfterViewInit() {
    this.playRouteTransition();
    this.initSidebarHover();
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches) {
      window.addEventListener('scroll', this.onScroll, { passive: true });
    }
  }

  ngOnDestroy() {
    this.cleanup?.();
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  private playRouteTransition() {
    const panel = document.querySelector('.page-transition');
    if (!panel) return;
    panel.animate(
      [
        { opacity: '0', transform: 'translateY(8px) scale(0.995)' },
        { opacity: '1', transform: 'translateY(0) scale(1)' }
      ],
      {
        duration: 420,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'backwards'
      }
    );
  }

  private initSidebarHover() {
    const links = document.querySelectorAll('.sidebar a');
    links.forEach(link => {
      const enter = () => {
        const anim = link.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(4px)' }],
          { duration: 250, easing: 'ease-out', fill: 'backwards' }
        );
        this.cleanup = () => anim.cancel();
      };
      const leave = () => {
      const anim = link.animate(
        [{ transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
        { duration: 250, easing: 'ease-out', fill: 'backwards' }
      );
      this.cleanup = () => anim.cancel();
      };
      link.addEventListener('mouseenter', enter);
      link.addEventListener('mouseleave', leave);
    });
  }

  logout() {
    if (this.logoutLoading) return;
    this.logoutLoading = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.api.logout();
    }, 2000);
  }

  routeAnimationName(): string {
    return this.routeName;
  }

  private onScroll = () => {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      const currentY = window.scrollY || window.pageYOffset || 0;
      const nav = document.querySelector('.mobile-nav');
      if (!nav) {
        this.ticking = false;
        return;
      }
      if (currentY > this.lastY && currentY > 60) {
        nav.classList.add('nav-hidden');
      } else {
        nav.classList.remove('nav-hidden');
      }
      this.lastY = currentY;
      this.ticking = false;
    });
  };
}
