import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { StaggerService } from '../../core/services/stagger.service';
import { DashboardCacheService } from '../../core/services/dashboard-cache.service';
import { Category } from '../../core/models/ims.models';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements AfterViewInit {
  categories: Category[] = [];
  editing: Category | null = null;
  name = '';
  description = '';
  loading = false;
  loadError = '';
  showModal = false;
  showDeleteModal = false;
  deleteTargetId: number | null = null;
  deleteTargetName = '';
  private originalCategory: Category | null = null;

  constructor(public api: ApiService, private cdr: ChangeDetectorRef, private toast: ToastService, private stagger: StaggerService, private cache: DashboardCacheService) {}

  ngOnInit(): void {
    this.cache.categories$.subscribe({
      next: list => {
        this.categories = list ?? [];
        this.loading = false;
        this.cdr.markForCheck();
        this.stagger.animate('tbody tr.stagger-item');
      },
      error: () => {
        this.categories = [];
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
    this.stagger.animate('tbody tr.stagger-item');
  }

  private isDirty(current: any, original: any): boolean {
    if (!original) return true;
    return Object.keys(current).some(key => current[key] !== original[key]);
  }

  addNew(): void {
    this.showModal = true;
    this.editing = null;
    this.name = '';
    this.description = '';
    this.originalCategory = null;
  }

  edit(c: Category): void {
    this.showModal = true;
    this.editing = c;
    this.name = c.name;
    this.description = c.description ?? '';
    this.originalCategory = { ...c };
  }

  closeModal(): void {
    this.showModal = false;
    this.editing = null;
    this.name = '';
    this.description = '';
  }

  save(): void {
    if (!this.name.trim()) return this.toast.show('Name is required.', 'error');
    const payload = { name: this.name.trim(), description: this.description.trim() || undefined };
    if (this.editing && this.editing.id) {
      if (!this.isDirty(payload, this.originalCategory)) {
        this.toast.show('No changes detected.', 'error');
        return;
      }
      this.api.updateCategory(this.editing.id, payload).subscribe({
        next: () => {
          this.toast.show('Category updated', 'success');
          this.cache.reloadAll(this.api);
          this.closeModal();
        },
        error: (err) => this.toast.showError(err, 'Update failed.')
      });
    } else {
      this.api.createCategory(payload).subscribe({
        next: () => {
          this.toast.show('Category added', 'success');
          this.cache.reloadAll(this.api);
          this.closeModal();
        },
        error: (err) => this.toast.showError(err, 'Create failed.')
      });
    }
  }

  remove(id: number): void {
    const category = this.categories.find(c => c.id === id);
    this.deleteTargetId = id;
    this.deleteTargetName = category?.name || 'this category';
    this.showDeleteModal = true;
  }

  closeDelete(): void {
    this.showDeleteModal = false;
    this.deleteTargetId = null;
    this.deleteTargetName = '';
  }

  confirmDelete(): void {
    if (this.deleteTargetId == null) return;
    const id = this.deleteTargetId;
    this.closeDelete();
    this.api.deleteCategory(id).subscribe({
      next: () => {
        this.toast.show('Category deleted', 'success');
        this.cache.reloadAll(this.api);
      },
      error: (err: any) => this.toast.showError(err, 'Delete failed.')
    });
  }
}
