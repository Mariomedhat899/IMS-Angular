import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { InventoryReport } from '../../core/models/ims.models';
import { StaggerService } from '../../core/services/stagger.service';
import { DashboardCacheService } from '../../core/services/dashboard-cache.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements AfterViewInit {
  report: InventoryReport | null = null;
  loading = false;
  loadError = '';

  constructor(public api: ApiService, private cdr: ChangeDetectorRef, private stagger: StaggerService, private cache: DashboardCacheService) {}

  ngOnInit(): void {
    this.cache.report$.subscribe({
      next: r => {
        this.report = r ?? null;
        this.loading = false;
        this.cdr.markForCheck();
        this.stagger.animate('.stat-card.stagger-item');
        this.stagger.animate('tbody tr.stagger-item');
      },
      error: () => {
        this.report = null;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });

    this.cache.loading$.subscribe(loading => {
      this.loading = loading;
      this.cdr.markForCheck();
    });

    this.cache.error$.subscribe(err => {
      if (err) {
        this.loadError = err;
        this.cdr.markForCheck();
      }
    });
  }

  ngAfterViewInit() {
    this.stagger.animate('.stat-card.stagger-item');
    this.stagger.animate('tbody tr.stagger-item');
  }
}
