import { Component, ChangeDetectorRef, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Product, Alert } from '../../core/models/ims.models';
import { StaggerService } from '../../core/services/stagger.service';
import { ToastService } from '../../core/services/toast.service';
import { DashboardCacheService } from '../../core/services/dashboard-cache.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  products: Product[] = [];
  categories: any[] = [];
  alerts: Alert[] = [];
  loading = false;
  loadError = '';

  productCount = 0;
  categoryCount = 0;
  lowStockCount = 0;
  stockValue = 0;

  private router = inject(Router);
  private cacheSubs = new Subscription();

  constructor(public api: ApiService, private cdr: ChangeDetectorRef, private stagger: StaggerService, private toast: ToastService, private cache: DashboardCacheService) {}

  ngOnInit() {
    this.cacheSubs.add(
      this.cache.loading$.subscribe(loading => {
        this.loading = loading;
        this.cdr.markForCheck();
      })
    );

    this.cacheSubs.add(
      this.cache.error$.subscribe(err => {
        this.loadError = err ?? '';
        this.cdr.markForCheck();
      })
    );

    this.cacheSubs.add(
      this.cache.products$.subscribe(list => {
        this.products = list ?? [];
        this.productCount = this.products.length;
        this.stockValue = this.products.reduce((s, p) => s + (p.price * p.quantityInStock), 0);
        this.lowStockCount = this.products.filter(p => p.quantityInStock < 10).length;
        this.cdr.markForCheck();
        this.stagger.animate('.stat-card.stagger-item');
        this.stagger.animate('tbody tr.stagger-item');
      })
    );

    this.cacheSubs.add(
      this.cache.categories$.subscribe(list => {
        this.categories = list ?? [];
        this.categoryCount = this.categories.length;
        this.cdr.markForCheck();
      })
    );

    this.cacheSubs.add(
      this.cache.alerts$.subscribe(list => {
        this.alerts = (list ?? []).slice(0, 5);
        this.cdr.markForCheck();
        this.stagger.animate('tbody tr.stagger-item');
      })
    );

    this.cacheSubs.add(
      this.cache.transactions$.subscribe(() => {
        this.cdr.markForCheck();
      })
    );

    this.cacheSubs.add(
      this.cache.payments$.subscribe(() => {
        this.cdr.markForCheck();
      })
    );

    this.cacheSubs.add(
      this.cache.report$.subscribe(() => {
        this.cdr.markForCheck();
      })
    );
  }

  ngAfterViewInit() {
    this.stagger.animate('.stat-card.stagger-item');
    this.stagger.animate('tbody tr.stagger-item');
  }

  ngOnDestroy() {
    this.cacheSubs.unsubscribe();
  }

  gaugePct(value: number): number {
    return Math.min(100, Math.max(0, value));
  }
}
