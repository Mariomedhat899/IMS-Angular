import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Category } from '../../core/models/ims.models';
import { StaggerService } from '../../core/services/stagger.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(public api: ApiService, private cdr: ChangeDetectorRef, private toast: ToastService, private stagger: StaggerService) {}

  ngOnInit() {
    this.load();
  }

  ngAfterViewInit() {
    this.stagger.animate('tbody tr.stagger-item');
  }

  private isDirty(current: any, original: any): boolean {
    if (!original) return true;
    return Object.keys(current).some(key => current[key] !== original[key]);
  }

  load() {
    this.loading = true;
    this.loadError = '';
    this.api.getCategories().subscribe({
      next: list => {
        this.categories = list ?? [];
        this.loading = false;
        this.cdr.markForCheck();
        this.stagger.animate('tbody tr.stagger-item');
      },
      error: err => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Failed to load categories.';
        this.categories = [];
        this.cdr.markForCheck();
      }
    });
  }

  addNew() {
    this.showModal = true;
    this.editing = null;
    this.name = '';
    this.description = '';
    this.originalCategory = null;
  }

  edit(c: Category) {
    this.showModal = true;
    this.editing = c;
    this.name = c.name;
    this.description = c.description ?? '';
    this.originalCategory = { ...c };
  }

  closeModal() {
    this.showModal = false;
    this.editing = null;
    this.name = '';
    this.description = '';
  }

  save() {
    if (!this.name.trim()) return this.toast.show('Name is required.', 'error');
    const payload = { name: this.name.trim(), description: this.description.trim() || undefined };
    if (this.editing && this.editing.id) {
      if (!this.isDirty(payload, this.originalCategory)) {
        this.toast.show('No changes detected.', 'error');
        return;
      }
      this.api.updateCategory(this.editing.id, payload).subscribe({
        next: () => { this.toast.show('Category updated', 'success'); this.load(); this.closeModal(); },
        error: (err) => this.toast.showError(err, 'Update failed.')
      });
    } else {
      this.api.createCategory(payload).subscribe({
        next: () => { this.toast.show('Category added', 'success'); this.load(); this.closeModal(); },
        error: (err) => this.toast.showError(err, 'Create failed.')
      });
    }
  }

  remove(id: number) {
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
      next: () => { this.toast.show('Category deleted', 'success'); this.load(); },
      error: (err: any) => this.toast.showError(err, 'Delete failed.')
    });
  }
}
