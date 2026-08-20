import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Alert, Product } from '../../core/models/ims.models';
import { StaggerService } from '../../core/services/stagger.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

  constructor(public api: ApiService, private stagger: StaggerService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.load();
  }

  ngAfterViewInit() {
    this.stagger.animate('tbody tr.stagger-item');
  }

  load() {
    this.api.getAlerts().subscribe({ 
      next: list => {
        this.alerts = list ?? [];
        this.cdr.markForCheck();
        this.stagger.animate('tbody tr.stagger-item');
      },
      error: err => {
        this.alerts = [];
        this.cdr.markForCheck();
      }
    });
    this.api.getProducts().subscribe({ 
      next: list => {
        this.products = list ?? [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.products = [];
        this.cdr.markForCheck();
      }
    });
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
        this.load();
      },
      error: (err) => {
        this.toast.showError(err, 'Failed to configure alert.');
      }
    });
  }
}
