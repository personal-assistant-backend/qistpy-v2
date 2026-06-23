import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed top-5 right-5 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
      @for (t of svc.toasts(); track t.id) {
        <div class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl
                    border animate-[fadeIn_0.3s_ease]"
             [class.bg-white]="t.type !== 'success'"
             [class.bg-success]="t.type === 'success'"
             [class.border-success]="t.type === 'success'"
             [class.border-red-200]="t.type === 'error'"
             [class.border-primary-100]="t.type === 'info'"
             [class.border-yellow-200]="t.type === 'warning'">

          <!-- Icon -->
          <div class="shrink-0 mt-0.5"
               [class.text-success]="t.type === 'success' ? false : true"
               [class.text-white]="t.type === 'success'"
               [class.text-red-600]="t.type === 'error'"
               [class.text-primary]="t.type === 'info'"
               [class.text-yellow-600]="t.type === 'warning'">
            @if (t.type === 'success') {
              <app-icon name="check-circle" [size]="20"/>
            } @else if (t.type === 'error') {
              <app-icon name="x" [size]="20"/>
            } @else {
              <app-icon name="phone" [size]="20"/>
            }
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0"
               [class.text-white]="t.type === 'success'"
               [class.text-ink]="t.type !== 'success'">
            <div class="font-semibold text-sm">{{ t.title }}</div>
            @if (t.message) {
              <div class="text-xs mt-0.5 opacity-80">{{ t.message }}</div>
            }
          </div>

          <!-- Close -->
          <button type="button" (click)="svc.remove(t.id)"
                  class="shrink-0 opacity-60 hover:opacity-100"
                  [class.text-white]="t.type === 'success'"
                  [class.text-ink]="t.type !== 'success'">
            <app-icon name="x" [size]="16"/>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly svc = inject(ToastService);
}
