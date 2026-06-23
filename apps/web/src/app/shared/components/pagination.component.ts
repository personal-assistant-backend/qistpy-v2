import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PaginationMeta } from '../../core/models/api.models';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (meta && meta.totalPages > 1) {
      <nav class="flex items-center justify-center gap-2 mt-8">
        <button
          type="button"
          (click)="goTo(meta.page - 1)"
          [disabled]="meta.page <= 1"
          class="btn-secondary text-sm px-3 py-2">
          ← Prev
        </button>

        <span class="text-sm text-muted mx-3 tabular-nums">
          Page {{ meta.page }} of {{ meta.totalPages }}
        </span>

        <button
          type="button"
          (click)="goTo(meta.page + 1)"
          [disabled]="meta.page >= meta.totalPages"
          class="btn-secondary text-sm px-3 py-2">
          Next →
        </button>
      </nav>
    }
  `,
})
export class PaginationComponent {
  @Input({ required: true }) meta!: PaginationMeta;
  @Output() pageChange = new EventEmitter<number>();

  goTo(page: number): void {
    if (page < 1 || page > this.meta.totalPages) return;
    this.pageChange.emit(page);
  }
}
