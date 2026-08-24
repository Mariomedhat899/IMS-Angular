import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  iconSvg: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly subject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this.subject.asObservable();

  private static readonly ICONS = {
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="16 10 11 15 8 12"></polyline></svg>`,
    alert: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
  } as const;

  show(message: string, type: ToastType = 'success'): void {
    const current = this.subject.value;
    const toast: Toast = {
      id: this.nextId++,
      message,
      type,
      iconSvg: type === 'error' ? ToastService.ICONS.alert : ToastService.ICONS.check
    };
    this.subject.next([...current, toast]);

    setTimeout(() => {
      const updated = this.subject.value.filter(t => t.id !== toast.id);
      this.subject.next(updated);
    }, 4200);
  }

  showError(err: any, fallback = 'Something went wrong. Please try again.'): void {
    const status = err?.status;
    const backendMsg = typeof err?.error === 'string' ? err.error : err?.error?.message;
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
