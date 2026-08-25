import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  icon: 'check' | 'alert';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly subject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this.subject.asObservable();

  show(message: string, type: ToastType = 'success'): void {
    const current = this.subject.value;
    const toast: Toast = {
      id: this.nextId++,
      message,
      type,
      icon: type === 'error' ? 'alert' : 'check'
    };
    this.subject.next([...current, toast]);

    setTimeout(() => {
      const updated = this.subject.value.filter(t => t.id !== toast.id);
      this.subject.next(updated);
    }, 4200);
  }

  showError(err: any, fallback = 'Something went wrong. Please try again.'): void {
    const status = err?.status;
    let message = fallback;
    if (status && status >= 400 && status < 500) {
      message = 'Please check your information and try again.';
    } else if (status && status >= 500) {
      message = 'Our servers are having trouble right now. Please try again in a moment.';
    } else if (!status) {
      message = 'Unable to reach the server. Please check your connection and try again.';
    }
    this.show(message, 'error');
  }
}
