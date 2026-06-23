import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatPkr } from '../../core/services/currency';
import { IconComponent } from '../../shared/components/icon.component';

// ========================================================
// Orders list
// ========================================================
@Component({
  selector: 'app-account-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="mb-6">My Orders</h1>
    @if (loading()) {
      <div class="card p-8 text-muted text-center">Loading...</div>
    } @else if (orders().length === 0) {
      <div class="card p-12 text-center">
        <div class="icon-chip mx-auto bg-canvas text-muted w-16 h-16 mb-3">
          <app-icon name="package" [size]="28" />
        </div>
        <h3>No orders yet</h3>
        <p class="text-muted text-sm mb-4">Your order history will appear here</p>
        <a routerLink="/shop" class="btn-primary">Start Shopping</a>
      </div>
    } @else {
      <div class="space-y-3">
        @for (order of orders(); track order.id) {
          <a [routerLink]="[order.id]" class="card-hover block p-5">
            <div class="flex justify-between items-start gap-3 flex-wrap">
              <div>
                <div class="text-xs text-muted uppercase tracking-wide font-semibold">Order #{{ order.orderNumber }}</div>
                <div class="text-sm text-ink mt-0.5">
                  {{ order.items.length }} item{{ order.items.length > 1 ? 's' : '' }}
                </div>
                <div class="text-xs text-muted mt-0.5">
                  Placed {{ formatDate(order.createdAt) }}
                </div>
              </div>
              <div class="text-right tabular-nums">
                <div class="font-heading font-bold text-primary">{{ fmt(order.totalPayable) }}</div>
                <div class="text-xs text-muted">Total</div>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-border flex gap-2 flex-wrap">
              @for (item of order.items.slice(0, 3); track item.id) {
                <span class="text-xs bg-canvas px-2 py-1 rounded line-clamp-1">
                  {{ item.product.name }}
                </span>
              }
              @if (order.items.length > 3) {
                <span class="text-xs text-muted px-2 py-1">+{{ order.items.length - 3 }} more</span>
              }
            </div>
          </a>
        }
      </div>
    }
  `,
})
export class AccountOrdersComponent {
  private readonly http = inject(HttpClient);
  readonly orders = signal<any[]>([]);
  readonly loading = signal(true);
  readonly fmt = formatPkr;

  constructor() {
    this.http.get<any[]>('/account/orders').subscribe({
      next: (o) => { this.orders.set(o); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

// ========================================================
// Order detail — uses @switch to avoid 'as' in @else if
// ========================================================
type OrderState = 'loading' | 'empty' | 'ready';

@Component({
  selector: 'app-account-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/account/orders" class="text-sm text-muted hover:text-primary inline-flex items-center gap-1 mb-4">
      ← Back to orders
    </a>

    @if (justPlaced()) {
      <div class="card p-5 mb-4 bg-success/5 border border-success/30">
        <div class="flex items-center gap-3">
          <div class="icon-chip bg-success/10 text-success w-10 h-10">
            <app-icon name="check-circle" [size]="22" />
          </div>
          <div>
            <div class="font-heading font-bold text-ink">Order placed successfully!</div>
            <div class="text-sm text-muted">Your request has been sent to the vendor for approval.</div>
          </div>
        </div>
      </div>
    }

    @if (loading()) {
      <div class="card p-8 text-muted text-center">Loading...</div>
    } @else {
      @if (order(); as o) {
        <div class="card p-6">
          <div class="flex justify-between flex-wrap gap-3 mb-5 pb-5 border-b border-border">
            <div>
              <div class="text-xs text-muted uppercase tracking-wide font-semibold">Order Number</div>
              <div class="font-heading font-bold text-lg">{{ o.orderNumber }}</div>
              <div class="text-xs text-muted mt-0.5">Placed {{ formatDate(o.createdAt) }}</div>
            </div>
            <div class="text-right tabular-nums">
              <div class="text-xs text-muted">Total Payable</div>
              <div class="font-heading font-bold text-2xl text-primary">{{ fmt(o.totalPayable) }}</div>
            </div>
          </div>

          <div class="space-y-3">
            @for (item of o.items; track item.id) {
              <div class="flex gap-4 py-3 border-b border-border last:border-0">
                @if (item.product.images[0]) {
                  <img [src]="item.product.images[0].url" [alt]="item.product.name"
                       class="w-20 h-20 object-contain bg-canvas rounded-lg shrink-0"/>
                }
                <div class="flex-1">
                  <div class="font-semibold text-ink">{{ item.product.name }}</div>
                  <div class="text-xs text-muted mt-0.5">
                    {{ item.durationMonths }} months × {{ fmt(item.monthlyAmount) }} + Advance {{ fmt(item.advanceAmount) }}
                  </div>
                  @if (item.request) {
                    <div class="mt-2">
                      <span class="badge"
                            [class.bg-accent]="item.request.status === 'PENDING'"
                            [class.text-white]="item.request.status === 'PENDING' || item.request.status === 'ACTIVE'"
                            [class.bg-success]="item.request.status === 'ACTIVE' || item.request.status === 'COMPLETED'">
                        {{ item.request.status }}
                      </span>
                    </div>
                  }
                </div>
                <div class="text-sm tabular-nums text-right">
                  <div class="text-muted">Qty {{ item.quantity }}</div>
                  <div class="font-semibold">{{ fmt(item.totalPayable) }}</div>
                </div>
              </div>
            }
          </div>

          @if (o.address) {
            <div class="mt-5 pt-5 border-t border-border">
              <div class="text-xs text-muted uppercase tracking-wide font-semibold mb-1">Delivery Address</div>
              <div class="text-sm">
                {{ o.address.line1 }}@if (o.address.line2) { , {{ o.address.line2 }} }, {{ o.address.city.name }}
              </div>
            </div>
          }
        </div>
      }
    }
  `,
})
export class AccountOrderDetailComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  readonly order = signal<any | null>(null);
  readonly loading = signal(true);
  readonly justPlaced = signal(false);
  readonly fmt = formatPkr;

  constructor() {
    this.route.queryParamMap.subscribe((q) => this.justPlaced.set(q.get('placed') === '1'));
    this.route.paramMap.subscribe((p) => {
      const id = p.get('id');
      if (!id) return;
      this.http.get(`/account/orders/${id}`).subscribe({
        next: (o) => { this.order.set(o); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
