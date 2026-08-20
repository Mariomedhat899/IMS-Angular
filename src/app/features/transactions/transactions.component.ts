import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Transaction, Product } from '../../core/models/ims.models';
import { StaggerService } from '../../core/services/stagger.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(public api: ApiService, private stagger: StaggerService, private cdr: ChangeDetectorRef, private toast: ToastService) {}

  ngOnInit() {
    this.load();
  }

  ngAfterViewInit() {
    this.stagger.animate('tbody tr.stagger-item');
  }

  load() {
    this.loading = true;
    this.message = '';
    this.api.getProducts().subscribe({ 
      next: list => { this.products = list; }, 
      error: err => console.error('[TX] products error', err) 
    });
    this.api.getTransactions().subscribe({ 
      next: list => { 
        this.transactions = list || [];
        this.loading = false;
        this.cdr.markForCheck();
        this.message = '';
        this.stagger.animate('tbody tr.stagger-item');
      },
      error: (err) => {
        console.error('[TX] transactions error', err);
        this.loading = false;
        this.transactions = [];
        const endpoint = 'GET /api/Transactions';
        const status = err?.status ?? 'ERR';
        this.message = `[${status}] ${endpoint} — ${err?.error?.message || err?.message || 'Failed to load transactions.'}`;
        this.messageColor = 'var(--brick)';
      }
    });
    setTimeout(() => {
      if (this.loading) {
        console.warn('[TX] load() timeout — still loading after 8s');
        this.loading = false;
        this.message = 'Loading timed out. Check network tab.';
      }
    }, 8000);
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

    const totalAmount = product.price * this.quantity;
    this.api.createTransaction({ productId: this.selectedProductId, quantity: this.quantity, type: this.type.toLowerCase() }).subscribe({
      next: () => { this.toast.show('Transaction added.', 'success'); this.quantity = 1; this.load(); this.closeModal(); },
      error: (err) => { this.toast.showError(err, 'Server rejected transaction.'); }
    });
  }

  setMessage(text: string, color = 'var(--brick)') {
    this.message = text;
    this.messageColor = color;
  }
}
