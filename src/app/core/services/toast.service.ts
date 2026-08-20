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
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="16 10 11 15 8 12"></polyline></svg>`
  } as const;

  show(message: string, type: ToastType = 'success'): void {
    const current = this.subject.value;
    const toast: Toast = {
      id: this.nextId++,
      message,
      type,
      iconSvg: ToastService.ICONS.check
    };
    this.subject.next([...current, toast]);

    setTimeout(() => {
      const updated = this.subject.value.filter(t => t.id !== toast.id);
      this.subject.next(updated);
    }, 4200);
  }

  showError(err: any, fallback = 'Request failed.'): void {
    const status = err?.status;
    const url = typeof err?.url === 'string' ? err.url.split('/').pop() : '';
    const backendMsg = typeof err?.error === 'string' ? err.error : err?.error?.message;
    const detail = backendMsg || err?.message || fallback;
    const prefix = status ? `[${status}]` : '';
    const endpoint = url ? ` ${url}` : '';
    const message = `${prefix}${detail}${endpoint}`;
    this.show(message, 'error');
  }
}
