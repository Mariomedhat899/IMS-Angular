import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Product, Alert } from '../../core/models/ims.models';
import { StaggerService } from '../../core/services/stagger.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements AfterViewInit {
  products: Product[] = [];
  categories: any[] = [];
  alerts: Alert[] = [];
  loading = false;
  loadError = '';

  productCount = 0;
  categoryCount = 0;
  lowStockCount = 0;
  stockValue = 0;

  constructor(public api: ApiService, private cdr: ChangeDetectorRef, private stagger: StaggerService) {}

  ngOnInit() {
    this.load();
  }

  ngAfterViewInit() {
    this.stagger.animate('.stat-card.stagger-item');
    this.stagger.animate('tbody tr.stagger-item');
  }

  load() {
    this.loading = true;
    this.loadError = '';
    this.api.getProducts().subscribe({
      next: list => {
        this.products = list ?? [];
        this.productCount = this.products.length;
        this.stockValue = this.products.reduce((s, p) => s + (p.price * p.quantityInStock), 0);
        this.lowStockCount = this.products.filter(p => p.quantityInStock < 10).length;
        this.loading = false;
        this.cdr.markForCheck();
        this.stagger.animate('.stat-card.stagger-item');
        this.stagger.animate('tbody tr.stagger-item');
      },
      error: err => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Failed to load dashboard data.';
        this.cdr.markForCheck();
      }
    });
    this.api.getCategories().subscribe({
      next: list => {
        this.categories = list ?? [];
        this.categoryCount = this.categories.length;
        this.cdr.markForCheck();
      },
      error: err => {
        this.categoryCount = 0;
        this.cdr.markForCheck();
      }
    });
    this.api.getAlerts().subscribe({
      next: list => {
        this.alerts = (list ?? []).slice(0, 5);
        this.cdr.markForCheck();
        this.stagger.animate('tbody tr.stagger-item');
      },
      error: () => {
        this.alerts = [];
        this.cdr.markForCheck();
      }
    });
  }

  gaugePct(value: number): number {
    return Math.min(100, Math.max(0, value));
  }
}
