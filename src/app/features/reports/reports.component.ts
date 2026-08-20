import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { InventoryReport } from '../../core/models/ims.models';
import { StaggerService } from '../../core/services/stagger.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements AfterViewInit {
  report: InventoryReport | null = null;
  loading = false;
  loadError = '';

  constructor(public api: ApiService, private cdr: ChangeDetectorRef, private stagger: StaggerService) {}

  ngOnInit() {
    this.loading = true;
    this.loadError = '';
    this.api.getReport().subscribe({
      next: r => {
        this.report = r ?? null;
        this.loading = false;
        this.cdr.markForCheck();
        this.stagger.animate('.stat-card.stagger-item');
        this.stagger.animate('tbody tr.stagger-item');
      },
      error: err => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Failed to load report.';
        this.report = null;
        this.cdr.markForCheck();
      }
    });
  }

  ngAfterViewInit() {
    this.stagger.animate('.stat-card.stagger-item');
    this.stagger.animate('tbody tr.stagger-item');
  }
}
