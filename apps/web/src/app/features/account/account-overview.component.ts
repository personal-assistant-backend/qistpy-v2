import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-account-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="mb-2">Hello, {{ auth.user()?.name || 'there' }} 👋</h1>
    <p class="text-muted text-sm mb-6">Here's a quick look at your account</p>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="card p-4">
        <div class="icon-chip bg-primary/10 text-primary mb-2 w-10 h-10">
          <app-icon name="package" [size]="18" />
        </div>
        <div class="text-2xl font-heading font-bold tabular-nums">{{ orderCount() }}</div>
        <div class="text-xs text-muted">Total Orders</div>
      </div>
      <div class="card p-4">
        <div class="icon-chip bg-accent/10 text-accent-dark mb-2 w-10 h-10">
          <app-icon name="credit-card" [size]="18" />
        </div>
        <div class="text-2xl font-heading font-bold tabular-nums">{{ installmentCount() }}</div>
        <div class="text-xs text-muted">Active Installments</div>
      </div>
      <div class="card p-4">
        <div class="icon-chip bg-success/10 text-success mb-2 w-10 h-10">
          <app-icon name="map-pin" [size]="18" />
        </div>
        <div class="text-2xl font-heading font-bold tabular-nums">{{ addressCount() }}</div>
        <div class="text-xs text-muted">Saved Addresses</div>
      </div>
      <div class="card p-4">
        <div class="icon-chip bg-primary/10 text-primary mb-2 w-10 h-10">
          <app-icon name="badge-check" [size]="18" />
        </div>
        <div class="text-sm font-heading font-bold">{{ kycLabel() }}</div>
        <div class="text-xs text-muted">KYC Status</div>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-3">
      <a routerLink="/shop" class="card-hover p-6 flex items-center gap-4">
        <div class="icon-chip bg-primary text-white w-12 h-12">
          <app-icon name="tag" [size]="22" />
        </div>
        <div class="flex-1">
          <div class="font-heading font-bold text-ink">Browse Products</div>
          <div class="text-xs text-muted">Start shopping on installments</div>
        </div>
        <app-icon name="arrow-right" [size]="18" />
      </a>
      <a routerLink="/account/orders" class="card-hover p-6 flex items-center gap-4">
        <div class="icon-chip bg-accent text-white w-12 h-12">
          <app-icon name="package" [size]="22" />
        </div>
        <div class="flex-1">
          <div class="font-heading font-bold text-ink">View Orders</div>
          <div class="text-xs text-muted">Track your deliveries</div>
        </div>
        <app-icon name="arrow-right" [size]="18" />
      </a>
    </div>
  `,
})
export class AccountOverviewComponent {
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);

  readonly orderCount = signal(0);
  readonly installmentCount = signal(0);
  readonly addressCount = signal(0);

  constructor() {
    forkJoin({
      orders: this.http.get<Array<unknown>>('/account/orders'),
      installments: this.http.get<Array<unknown>>('/account/installments'),
      addresses: this.http.get<Array<unknown>>('/users/me/addresses'),
    }).subscribe({
      next: ({ orders, installments, addresses }) => {
        this.orderCount.set(orders.length);
        this.installmentCount.set(installments.length);
        this.addressCount.set(addresses.length);
      },
    });
  }

  kycLabel(): string {
    const status = this.auth.user()?.kycStatus;
    const labels: Record<string, string> = {
      NOT_SUBMITTED: 'Not Submitted',
      PENDING:       'Under Review',
      APPROVED:      'Verified ✓',
      REJECTED:      'Rejected',
    };
    return labels[status ?? 'NOT_SUBMITTED'] ?? 'Not Submitted';
  }
}
