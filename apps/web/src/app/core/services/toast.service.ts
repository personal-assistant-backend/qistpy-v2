import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(toast: Omit<Toast, 'id'>): void {
    const id = Math.random().toString(36).slice(2);
    this.toasts.update(list => [...list, { ...toast, id }]);
    setTimeout(() => this.remove(id), toast.duration ?? 5000);
  }

  success(title: string, message?: string): void {
    this.show({ type: 'success', title, message });
  }

  error(title: string, message?: string): void {
    this.show({ type: 'error', title, message, duration: 8000 });
  }

  info(title: string, message?: string): void {
    this.show({ type: 'info', title, message });
  }

  remove(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
