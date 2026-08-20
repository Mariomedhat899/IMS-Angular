import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Payment } from '../../core/models/ims.models';
import { StaggerService } from '../../core/services/stagger.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements AfterViewInit {
  payments: Payment[] = [];
  amount = '';
  paymentMethod = '';
  transactionReference = '';
  status = 'pending';
  message = '';
  messageColor = 'var(--brick)';
  okColor = 'var(--teal)';
  errColor = 'var(--brick)';
  showModal = false;
  editingId: number | null = null;
  private originalPayment: Payment | null = null;

  constructor(public api: ApiService, private stagger: StaggerService, private cdr: ChangeDetectorRef, private toast: ToastService) {}

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
    this.api.getPayments().subscribe({ 
      next: list => {
        this.payments = list;
        this.cdr.markForCheck();
        this.stagger.animate('tbody tr.stagger-item');
      } 
    });
  }

  save() {
    this.message = '';
    if (!this.amount || parseFloat(this.amount) <= 0) return this.setMessage('Amount must be greater than 0.', this.errColor);
    if (!this.paymentMethod.trim()) return this.setMessage('PaymentMethod is required.', this.errColor);
    if (!this.transactionReference.trim()) return this.setMessage('TransactionReference is required.', this.errColor);

    const payload = {
      amount: parseFloat(this.amount || '0'),
      paymentMethod: this.paymentMethod.trim(),
      transactionReference: this.transactionReference.trim(),
      status: this.status
    };

    if (this.editingId) {
      if (!this.isDirty(payload, this.originalPayment)) {
        this.setMessage('No changes detected.', this.errColor);
        return;
      }
      this.api.updatePayment(this.editingId, payload).subscribe({
        next: () => { this.toast.show('Payment updated.', 'success'); this.closeModal(); this.load(); },
        error: (err) => { this.toast.showError(err, 'Update failed.'); }
      });
    } else {
      this.api.createPayment({ amount: parseFloat(this.amount), paymentMethod: this.paymentMethod.trim(), transactionReference: this.transactionReference.trim() }).subscribe({
        next: () => { this.toast.show('Payment created.', 'success'); this.closeModal(); this.load(); },
        error: (err) => { this.toast.showError(err, 'Create failed.'); }
      });
    }
  }

  addNew() {
    this.showModal = true;
    this.editingId = null;
    this.amount = '';
    this.paymentMethod = '';
    this.transactionReference = '';
    this.status = 'pending';
    this.message = '';
    this.originalPayment = null;
  }

  edit(p: Payment) {
    this.showModal = true;
    this.editingId = p.id;
    this.amount = String(p.amount);
    this.paymentMethod = p.paymentMethod;
    this.transactionReference = p.transactionReference;
    this.status = (p.status || 'pending').toLowerCase();
    this.message = '';
    this.originalPayment = { ...p };
  }

  closeModal() {
    this.showModal = false;
    this.editingId = null;
    this.amount = '';
    this.paymentMethod = '';
    this.transactionReference = '';
    this.status = 'pending';
    this.message = '';
  }

  setMessage(text: string, color = this.errColor) {
    this.message = text;
    this.messageColor = color;
  }
}
