import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { DashboardCacheService } from '../../core/services/dashboard-cache.service';
import { Product, Category } from '../../core/models/ims.models';
import { StaggerService } from '../../core/services/stagger.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EmptyStateComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements AfterViewInit {
  products: Product[] = [];
  categories: Category[] = [];
  editing: Product | null = null;
  name = '';
  price = '';
  quantity = '';
  supplier = '';
  description = '';
  categoryId: number | null = null;
  search = '';
  filtered: Product[] = [];
  loading = false;
  loadError = '';
  showModal = false;
  showDeleteModal = false;
  deleteTargetId: number | null = null;
  deleteTargetName = '';
  private originalPayload: any = null;

  constructor(
    public api: ApiService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private stagger: StaggerService,
    private cache: DashboardCacheService
  ) {}

  ngOnInit(): void {
    this.cache.products$.subscribe({
      next: list => {
        this.products = list ?? [];
        this.applyFilter();
        this.cdr.markForCheck();
        this.stagger.animate('tbody tr.stagger-item');
      },
      error: () => {
        this.products = [];
        this.filtered = [];
        this.cdr.markForCheck();
      }
    });

    this.cache.categories$.subscribe({
      next: cats => {
        this.categories = cats ?? [];
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: () => {
        this.categories = [];
        this.applyFilter();
        this.cdr.markForCheck();
      }
    });

    if (!this.products.length) {
      this.cache.reloadAll(this.api);
    }
  }

  ngAfterViewInit() {
    this.stagger.animate('tbody tr.stagger-item');
  }

  private isDirty(current: any, original: any): boolean {
    if (!original) return true;
    return Object.keys(current).some(key => current[key] !== original[key]);
  }

  applyFilter() {
    const q = this.search.trim().toLowerCase();
    this.filtered = q ? this.products.filter(p => p.name.toLowerCase().includes(q) || (p.supplier || '').toLowerCase().includes(q)) : [...this.products];
  }

  get categoriesMap(): Record<number, string> {
    const map: Record<number, string> = {};
    for (const c of this.categories) map[c.id] = c.name;
    return map;
  }

  onSearch() {
    this.applyFilter();
  }

  stockPct(p: Product): number {
    return Math.min(100, Math.max(0, p.quantityInStock));
  }

  addNew() {
    this.showModal = true;
    this.editing = null;
    this.name = '';
    this.price = '';
    this.quantity = '';
    this.supplier = '';
    this.description = '';
    this.categoryId = null;
    this.originalPayload = null;
  }

  edit(p: Product) {
    this.showModal = true;
    this.editing = p;
    this.name = p.name;
    this.price = String(p.price);
    this.quantity = String(p.quantityInStock);
    this.supplier = p.supplier ?? '';
    this.description = p.description ?? '';
    this.categoryId = p.categoryId;
    this.originalPayload = {
      name: p.name,
      description: p.description ?? '',
      price: p.price,
      quantityInStock: p.quantityInStock,
      supplier: p.supplier ?? '',
      categoryId: p.categoryId
    };
  }

  closeModal() {
    this.showModal = false;
    this.editing = null;
    this.name = '';
    this.price = '';
    this.quantity = '';
    this.supplier = '';
    this.description = '';
    this.categoryId = null;
  }

  save() {
    if (!this.name.trim()) return this.toast.show('Name is required.', 'error');
    const price = parseFloat(this.price);
    const quantity = parseInt(this.quantity, 10);
    const categoryId = this.categoryId ?? 0;
    if (isNaN(price) || price <= 0) return this.toast.show('Price must be a positive number.', 'error');
    if (Number.isNaN(quantity) || quantity < 0) return this.toast.show('Quantity must be non-negative.', 'error');
    if (!categoryId) return this.toast.show('Select a category.', 'error');

    const payload = {
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      price,
      quantityInStock: quantity,
      supplier: this.supplier.trim() || undefined,
      categoryId
    };

    if (this.editing && this.editing.id) {
      if (!this.isDirty(payload, this.originalPayload)) {
        this.toast.show('No changes detected.', 'error');
        return;
      }
      this.api.updateProduct(this.editing.id, payload).subscribe({
        next: () => {
          this.toast.show('Product updated', 'success');
          this.cache.reloadAll(this.api);
          this.closeModal();
        },
        error: (err) => this.toast.showError(err, 'Update failed.')
      });
    } else {
      this.api.createProduct(payload).subscribe({
        next: () => {
          this.toast.show('Product added', 'success');
          this.cache.reloadAll(this.api);
          this.closeModal();
        },
        error: (err) => this.toast.showError(err, 'Create failed.')
      });
    }
  }

  remove(id: number) {
    const product = this.products.find(p => p.id === id);
    this.deleteTargetId = id;
    this.deleteTargetName = product?.name || 'this product';
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
    this.api.deleteProduct(id).subscribe({
      next: () => {
        this.toast.show('Product deleted', 'success');
        this.cache.reloadAll(this.api);
      },
      error: (err: any) => this.toast.showError(err, 'Delete failed.')
    });
  }

  select(p: Product) {
    this.edit(p);
  }

  exportCsv() {
    this.api.exportProductsCsv().subscribe({
      next: (csv) => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.csv';
        a.click();
        URL.revokeObjectURL(url);
        this.toast.show('Export downloaded', 'success');
      },
      error: (err) => this.toast.showError(err, 'Export failed.')
    });
  }

  importCsv() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (ev: any) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const csv = e.target.result;
        this.api.importProductsCsv(csv).subscribe({
          next: () => {
                this.toast.show('CSV import completed.', 'success');
                this.loading = true;
                this.loadError = '';
                this.cache.reloadAll(this.api);
                this.loading = false;
                this.cdr.markForCheck();
              },
              error: (err: any) => this.toast.showError(err, 'Import failed.')
        });
      };
      reader.readAsText(file);
    };
    input.click();
  }

  private parseCsv(csv: string): any[] {
    const lines = csv.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((h, idx) => {
        if (h.includes('name')) row.name = values[idx] || '';
        else if (h.includes('price')) row.price = parseFloat(values[idx]) || 0;
        else if (h.includes('stock') || h.includes('quantity')) row.quantityInStock = parseInt(values[idx], 10) || 0;
        else if (h.includes('supplier')) row.supplier = values[idx] || '';
        else if (h.includes('category')) row.categoryId = parseInt(values[idx], 10) || null;
        else row[h] = values[idx] || '';
      });
      if (row.name) rows.push(row);
    }
    return rows;
  }
}
