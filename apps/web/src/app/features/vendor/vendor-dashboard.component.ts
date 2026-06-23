import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { formatPkr } from '../../core/services/currency';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-qp py-8">
      <div class="flex justify-between items-start flex-wrap gap-3 mb-6">
        <div>
          <h1>Vendor Dashboard</h1>
          <p class="text-muted text-sm mt-1">Welcome back, {{ auth.user()?.name }}</p>
        </div>
        <button type="button" (click)="logout()" class="btn-secondary text-sm">Logout</button>
      </div>

      @if (dashboard(); as d) {
        <!-- KPI tiles -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div class="card p-4">
            <div class="icon-chip bg-primary/10 text-primary mb-2 w-10 h-10">
              <app-icon name="package" [size]="18" />
            </div>
            <div class="text-2xl font-heading font-bold tabular-nums">{{ d.counts.products }}</div>
            <div class="text-xs text-muted">Products</div>
          </div>
          <div class="card p-4">
            <div class="icon-chip bg-accent/10 text-accent-dark mb-2 w-10 h-10">
              <app-icon name="clock" [size]="18" />
            </div>
            <div class="text-2xl font-heading font-bold tabular-nums">{{ d.counts.pendingRequests }}</div>
            <div class="text-xs text-muted">Pending</div>
          </div>
          <div class="card p-4">
            <div class="icon-chip bg-success/10 text-success mb-2 w-10 h-10">
              <app-icon name="check" [size]="18" />
            </div>
            <div class="text-2xl font-heading font-bold tabular-nums">{{ d.counts.activeRequests }}</div>
            <div class="text-xs text-muted">Active</div>
          </div>
          <div class="card p-4">
            <div class="icon-chip bg-primary/10 text-primary mb-2 w-10 h-10">
              <app-icon name="truck" [size]="18" />
            </div>
            <div class="text-2xl font-heading font-bold tabular-nums">{{ d.counts.totalOrders }}</div>
            <div class="text-xs text-muted">Total Orders</div>
          </div>
        </div>

        <!-- Wallet -->
        <div class="card p-6 mb-6 bg-gradient-to-br from-primary to-primary-dark text-white">
          <div class="flex items-start gap-3 mb-4">
            <div class="icon-chip bg-white/20 w-10 h-10">
              <app-icon name="wallet" [size]="20" />
            </div>
            <div>
              <h3 class="text-white">Wallet Balance</h3>
              <p class="text-white/70 text-sm">Available for withdrawal</p>
            </div>
          </div>
          <div class="grid md:grid-cols-3 gap-4 tabular-nums">
            <div>
              <div class="text-white/70 text-xs uppercase tracking-wide">Pending</div>
              <div class="text-xl font-heading font-bold">{{ fmt(d.wallet.pendingBalance) }}</div>
            </div>
            <div>
              <div class="text-white/70 text-xs uppercase tracking-wide">Cleared</div>
              <div class="text-xl font-heading font-bold">{{ fmt(d.wallet.clearedBalance) }}</div>
            </div>
            <div>
              <div class="text-white/70 text-xs uppercase tracking-wide">Withdrawable</div>
              <div class="text-2xl font-heading font-bold text-accent">{{ fmt(d.wallet.withdrawableBalance) }}</div>
            </div>
          </div>
          <button type="button" (click)="requestPayout()" class="mt-5 btn-accent">
            Request Payout
          </button>
        </div>
      }

      <!-- Pending Requests -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg">Pending Installment Requests</h3>
        @if (requestsLoading()) {
          <div class="text-muted text-sm text-center py-4">Loading...</div>
        } @else if (requests().length === 0) {
          <div class="text-muted text-sm text-center py-4">No pending requests right now 👍</div>
        } @else {
          <div class="space-y-2">
            @for (r of requests(); track r.id) {
              <div class="flex justify-between items-center gap-3 py-3 border-b border-border last:border-0 flex-wrap">
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-ink line-clamp-1">{{ r.orderItem?.product?.name }}</div>
                  <div class="text-xs text-muted">
                    {{ r.customer?.name }} — {{ r.installmentPlan?.durationMonths }} months
                  </div>
                </div>
                <div class="flex gap-2">
                  <button type="button" (click)="approve(r.id)" class="btn-primary text-xs px-3 py-1.5">
                    Approve
                  </button>
                  <button type="button" (click)="reject(r.id)" class="btn-secondary text-xs px-3 py-1.5 text-red-600">
                    Reject
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class VendorDashboardComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly dashboard = signal<any | null>(null);
  readonly requests = signal<any[]>([]);
  readonly requestsLoading = signal(true);
  readonly fmt = formatPkr;

  constructor() {
    this.load();
  }

  load(): void {
    forkJoin({
      d: this.http.get('/vendor'),
      r: this.http.get<any[]>('/vendor/installment-requests'),
    }).subscribe({
      next: ({ d, r }) => {
        this.dashboard.set(d);
        this.requests.set(r.filter((x: any) => x.status === 'PENDING'));
        this.requestsLoading.set(false);
      },
      error: () => this.requestsLoading.set(false),
    });
  }

  approve(id: string): void {
    this.http.post(`/vendor/installment-requests/${id}/approve`, {}).subscribe({
      next: () => this.load(),
      error: (e) => alert(e?.error?.message ?? 'Approve failed'),
    });
  }

  reject(id: string): void {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    this.http.post(`/vendor/installment-requests/${id}/reject`, { reason }).subscribe({
      next: () => this.load(),
      error: (e) => alert(e?.error?.message ?? 'Reject failed'),
    });
  }

  requestPayout(): void {
    alert('Use Thunder Client POST /api/vendor/payouts with bank details for now. Full payout UI coming in next release.');
  }

  logout(): void {
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/']),
      error: () => this.router.navigate(['/']),
    });
  }
}
