import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Alert, Product } from '../../core/models/ims.models';
import { StaggerService } from '../../core/services/stagger.service';
import { ToastService } from '../../core/services/toast.service';
import { DashboardCacheService } from '../../core/services/dashboard-cache.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EmptyStateComponent],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements AfterViewInit {
  alerts: Alert[] = [];
  products: Product[] = [];
  selectedProductId: number | null = null;
  threshold: number | null = null;
  message = '';
  messageColor = 'var(--brick)';
  okColor = 'var(--teal)';
  errColor = 'var(--brick)';
  loadError = '';

  constructor(public api: ApiService, private stagger: StaggerService, private toast: ToastService, private cdr: ChangeDetectorRef, private cache: DashboardCacheService) {}

  ngOnInit(): void {
    this.cache.alerts$.subscribe({
      next: list => {
        this.alerts = list ?? [];
        this.cdr.markForCheck();
        this.stagger.animate('tbody tr.stagger-item');
      },
      error: () => {
        this.alerts = [];
        this.cdr.markForCheck();
      }
    });

    this.cache.products$.subscribe({
      next: list => {
        this.products = list ?? [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.products = [];
        this.cdr.markForCheck();
      }
    });

    this.cache.error$.subscribe(err => {
      if (err) {
        this.loadError = err;
        this.cdr.markForCheck();
      }
    });

    if (!this.alerts.length) {
      this.cache.reloadAll(this.api).subscribe({
        error: () => this.toast.show('We couldn’t refresh alerts. The list may appear empty until you navigate back.', 'error')
      });
    }
  }

  ngAfterViewInit() {
    this.stagger.animate('tbody tr.stagger-item');
  }

  set() {
    this.message = '';
    if (!this.selectedProductId || this.threshold == null) {
      this.message = 'Select a product and threshold.';
      this.messageColor = this.errColor;
      return;
    }
    this.api.setAlert({ productId: this.selectedProductId, threshold: this.threshold }).subscribe({
      next: () => {
        this.toast.show('Alert configured.', 'success');
        this.cache.reloadAll(this.api);
      },
      error: (err) => {
        this.toast.showError(err, 'Failed to configure alert.');
      }
    });
  }
}
