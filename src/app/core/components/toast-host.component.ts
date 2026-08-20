import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-host">
      <div *ngFor="let t of toasts" class="toast">
        <span class="toast-icon" [innerHTML]="safeIcon(t.iconSvg)" aria-hidden="true"></span>
        <span class="toast-message">{{ t.message }}</span>
      </div>
    </div>
  `
})
export class ToastHostComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sub: Subscription | null = null;

  constructor(private toastService: ToastService, private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.sub = this.toastService.toasts$.subscribe(items => {
      this.toasts = items;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  safeIcon(iconSvg: string): unknown {
    return this.sanitizer.bypassSecurityTrustHtml(iconSvg);
  }
}
