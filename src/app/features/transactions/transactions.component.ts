import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Transaction, Product } from '../../core/models/ims.models';
import { StaggerService } from '../../core/services/stagger.service';
import { ToastService } from '../../core/services/toast.service';
import { DashboardCacheService } from '../../core/services/dashboard-cache.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements AfterViewInit {
  products: Product[] = [];
  transactions: Transaction[] = [];
  selectedProductId: number | null = null;
  quantity = 1;
  type: 'payment' | 'receipt' = 'payment';
  message = '';
  messageColor = 'var(--brick)';
  okColor = 'var(--teal)';
  errColor = 'var(--brick)';
  showModal = false;
  loading = false;
  loadError = '';

  constructor(public api: ApiService, private stagger: StaggerService, private cdr: ChangeDetectorRef, private toast: ToastService, private cache: DashboardCacheService) {}

  ngOnInit(): void {
    this.cache.transactions$.subscribe({
      next: list => {
        this.transactions = list ?? [];
        this.cdr.markForCheck();
        this.stagger.animate('tbody tr.stagger-item');
      },
      error: () => {
        this.transactions = [];
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

    if (!this.transactions.length) {
      this.cache.reloadAll(this.api);
    }
  }

  ngAfterViewInit() {
    this.stagger.animate('tbody tr.stagger-item');
  }

  openModal() {
    this.showModal = true;
    this.selectedProductId = null;
    this.quantity = 1;
    this.type = 'payment';
    this.message = '';
  }

  closeModal() {
    this.showModal = false;
    this.message = '';
  }

  add() {
    this.message = '';
    if (!this.selectedProductId) return this.toast.show('Select a product.', 'error');
    const product = this.products.find(p => p.id === this.selectedProductId);
    if (!product) return this.toast.show('Selected product not found.', 'error');
    if (!this.quantity || this.quantity < 1) return this.setMessage('Quantity must be at least 1.');

    this.api.createTransaction({ productId: this.selectedProductId, quantity: this.quantity, type: this.type.toLowerCase() }).subscribe({
      next: () => {
        this.toast.show('Transaction added.', 'success');
        this.quantity = 1;
        this.closeModal();
        this.cache.reloadAll(this.api);
      },
      error: (err) => { this.toast.showError(err, 'Server rejected transaction.'); }
    });
  }

  setMessage(text: string, color = 'var(--brick)') {
    this.message = text;
    this.messageColor = color;
  }
}
