import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { formatPkr } from '../../core/services/currency';
import { IconComponent } from '../../shared/components/icon.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-account-installments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-6">
      <h1>My Installments</h1>
      <p class="text-muted text-sm mt-1">Track your active plans and payment schedule</p>
    </div>

    @if (loading()) {
      <div class="space-y-3">
        @for (_ of [1,2]; track $index) {
          <div class="card h-48 shimmer rounded-xl"></div>
        }
      </div>
    } @else if (requests().length === 0) {
      <div class="card p-12 text-center">
        <div class="text-5xl mb-3">📋</div>
        <h3>No installment plans yet</h3>
        <p class="text-muted text-sm mt-2 mb-5">
          Browse products and place an order to get started.
        </p>
        <a routerLink="/shop" class="btn-primary">Browse Products</a>
      </div>
    } @else {
      <div class="space-y-5">
        @for (req of requests(); track req.id) {
          <div class="card overflow-hidden">
            <!-- Card header -->
            <div class="p-5 border-b border-border flex items-start justify-between flex-wrap gap-3">
              <div>
                <span class="badge text-white text-xs font-bold px-2.5 py-1 mr-2"
                      [class.bg-accent]="req.status === 'PENDING'"
                      [class.bg-primary]="req.status === 'APPROVED'"
                      [class.bg-success]="req.status === 'ACTIVE' || req.status === 'COMPLETED'"
                      [class.bg-red-500]="req.status === 'REJECTED'">
                  {{ statusLabel(req.status) }}
                </span>
                <span class="text-xs text-muted">Ordered {{ formatDate(req.createdAt) }}</span>
              </div>
            </div>

            <div class="p-5">
              <!-- Product + Plan summary -->
              <div class="flex gap-4 items-start mb-5">
                <!-- Product image -->
                <div class="w-16 h-16 rounded-xl overflow-hidden bg-canvas shrink-0">
                  @if (req.orderItem?.product?.images?.[0]?.url) {
                    <img [src]="req.orderItem.product.images[0].url"
                         [alt]="req.orderItem.product.name"
                         class="w-full h-full object-contain p-1"/>
                  } @else {
                    <div class="w-full h-full grid place-items-center text-muted">
                      <app-icon name="package" [size]="24"/>
                    </div>
                  }
                </div>
                <div class="flex-1">
                  <h3 class="font-heading font-bold text-ink">
                    {{ req.orderItem?.product?.name }}
                  </h3>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div class="bg-canvas rounded-lg p-2.5 text-center">
                      <div class="text-[10px] text-muted uppercase font-semibold">Advance</div>
                      <div class="font-bold text-primary tabular-nums text-sm mt-0.5">
                        {{ fmt(req.installmentPlan?.advanceAmount) }}
                      </div>
                    </div>
                    <div class="bg-canvas rounded-lg p-2.5 text-center">
                      <div class="text-[10px] text-muted uppercase font-semibold">Monthly</div>
                      <div class="font-bold text-ink tabular-nums text-sm mt-0.5">
                        {{ fmt(req.installmentPlan?.monthlyAmount) }}
                      </div>
                    </div>
                    <div class="bg-canvas rounded-lg p-2.5 text-center">
                      <div class="text-[10px] text-muted uppercase font-semibold">Duration</div>
                      <div class="font-bold text-ink text-sm mt-0.5">
                        {{ req.installmentPlan?.durationMonths }} months
                      </div>
                    </div>
                    <div class="bg-canvas rounded-lg p-2.5 text-center">
                      <div class="text-[10px] text-muted uppercase font-semibold">Total</div>
                      <div class="font-bold text-ink tabular-nums text-sm mt-0.5">
                        {{ fmt(req.installmentPlan?.totalPayable) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Status messages -->
              @if (req.status === 'PENDING') {
                <div class="rounded-xl bg-accent/10 border border-accent/30 p-4 text-sm text-ink/80 mb-4">
                  ⏳ <strong>Waiting for approval.</strong> Our agent will call you shortly to confirm your order.
                </div>
              }
              @if (req.status === 'APPROVED') {
                <div class="rounded-xl bg-primary/10 border border-primary/30 p-4 text-sm mb-4">
                  ✅ <strong>Order Approved!</strong> Please pay the advance of
                  <strong class="text-primary">{{ fmt(req.installmentPlan?.advanceAmount) }}</strong>
                  to activate your installment plan.
                  <div class="mt-3">
                    <a [href]="getWhatsAppLink(req)"
                       target="_blank"
                       class="inline-flex items-center gap-2 bg-success text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-success/90 transition">
                      <app-icon name="whatsapp" [size]="16"/>
                      Get Account Number on WhatsApp
                    </a>
                  </div>
                </div>
              }
              @if (req.status === 'REJECTED') {
                <div class="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-4">
                  ❌ <strong>Order Rejected.</strong> Please contact us for more information.
                </div>
              }

              <!-- Installment Schedule -->
              @if (req.schedules?.length) {
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-heading font-bold text-ink text-sm">Payment Schedule</h4>
                    <div class="text-xs text-muted tabular-nums">
                      Paid: <strong class="text-success">{{ calcPaid(req) }}</strong>
                      / Remaining: <strong class="text-primary">{{ calcRemaining(req) }}</strong>
                    </div>
                  </div>

                  <!-- Progress bar -->
                  <div class="h-2 bg-canvas rounded-full overflow-hidden mb-4">
                    <div class="h-full bg-success rounded-full transition-all"
                         [style.width.%]="calcPaidPct(req)"></div>
                  </div>

                  <div class="space-y-2">
                    @for (s of req.schedules; track s.id) {
                      <div class="flex items-center gap-3 p-3 rounded-xl border"
                           [style.background]="s.status === 'PAID' ? '#16A34A' : s.status === 'OVERDUE' ? '#fef2f2' : '#f8fafc'"
                           [style.border-color]="s.status === 'PAID' ? '#16A34A' : s.status === 'OVERDUE' ? '#fecaca' : '#e2e8f0'">

                        <!-- Icon -->
                        <div class="w-8 h-8 rounded-full grid place-items-center shrink-0"
                             [style.background]="s.status === 'PAID' ? 'rgba(255,255,255,0.25)' : s.status === 'OVERDUE' ? '#fee2e2' : 'white'">
                          @if (s.status === 'PAID') {
                            <span class="text-white text-sm font-bold">✓</span>
                          } @else if (s.status === 'OVERDUE') {
                            <span class="text-red-600 text-sm font-bold">!</span>
                          } @else {
                            <span class="text-muted text-xs font-bold">{{ s.installmentNo }}</span>
                          }
                        </div>

                        <div class="flex-1">
                          <div class="text-sm font-semibold"
                               [style.color]="s.status === 'PAID' ? 'white' : s.status === 'OVERDUE' ? '#b91c1c' : '#1e293b'">
                            Installment {{ s.installmentNo }}
                          </div>
                          <div class="text-xs"
                               [style.color]="s.status === 'PAID' ? 'rgba(255,255,255,0.75)' : s.status === 'OVERDUE' ? '#dc2626' : '#94a3b8'">
                            Due: {{ formatDate(s.dueDate) }}
                            @if (s.paidAt) { · Paid: {{ formatDate(s.paidAt) }} }
                          </div>
                        </div>

                        <div class="text-right tabular-nums">
                          <div class="font-bold text-sm"
                               [style.color]="s.status === 'PAID' ? 'white' : s.status === 'OVERDUE' ? '#b91c1c' : '#1e293b'">
                            {{ fmt(s.paidAmount ?? s.amount) }}
                          </div>
                          <div class="text-xs mt-0.5"
                               [style.color]="s.status === 'PAID' ? 'rgba(255,255,255,0.7)' : '#94a3b8'">
                            {{ s.status }}
                          </div>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Pay button for ACTIVE/APPROVED -->
                  @if (req.status === 'ACTIVE' || req.status === 'APPROVED') {
                    <div class="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <p class="text-sm font-semibold text-ink mb-2">💳 How to Pay</p>
                      <ol class="text-sm text-muted space-y-1.5 list-decimal list-inside">
                        <li>Contact us on WhatsApp to get our bank account number</li>
                        <li>Send payment via JazzCash, EasyPaisa, or Bank Transfer</li>
                        <li>Take a screenshot of your payment</li>
                        <li>Send the screenshot to our WhatsApp</li>
                        <li>Our team will confirm within 24 hours</li>
                      </ol>
                      <a [href]="getWhatsAppLink(req)" target="_blank"
                         class="mt-3 inline-flex items-center gap-2 bg-success text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-success/90 transition">
                        <app-icon name="whatsapp" [size]="16"/>
                        Pay via WhatsApp
                      </a>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class AccountInstallmentsComponent {
  private readonly http  = inject(HttpClient);
  private readonly toast = inject(ToastService);

  readonly requests = signal<any[]>([]);
  readonly loading  = signal(true);
  readonly fmt      = formatPkr;

  constructor() {
    this.http.get<any[]>('/orders/my-installment-requests').subscribe({
      next:  d => { this.requests.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = {
      PENDING:   '⏳ Pending Review',
      APPROVED:  '✅ Approved',
      ACTIVE:    '🔄 Active',
      COMPLETED: '🎉 Completed',
      REJECTED:  '❌ Rejected',
      CANCELLED: '🚫 Cancelled',
    };
    return m[s] ?? s;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-PK', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  calcPaid(req: any): string {
    const total = (req.schedules ?? [])
      .filter((s: any) => s.status === 'PAID')
      .reduce((sum: number, s: any) => sum + Number(s.paidAmount ?? s.amount), 0);
    return formatPkr(total.toFixed(2));
  }

  calcRemaining(req: any): string {
    const total = (req.schedules ?? [])
      .filter((s: any) => s.status !== 'PAID')
      .reduce((sum: number, s: any) => sum + Number(s.amount), 0);
    return formatPkr(total.toFixed(2));
  }

  calcPaidPct(req: any): number {
    const schedules = req.schedules ?? [];
    if (!schedules.length) return 0;
    const paid = schedules.filter((s: any) => s.status === 'PAID').length;
    return Math.round((paid / schedules.length) * 100);
  }

  getWhatsAppLink(req: any): string {
    const product = req.orderItem?.product?.name ?? 'product';
    const plan    = req.installmentPlan;
    const msg     = `Assalam o Alaikum! I want to pay for my installment plan.\n\nProduct: ${product}\nPlan: ${plan?.durationMonths} months\nAdvance: Rs ${plan?.advanceAmount}\nMonthly: Rs ${plan?.monthlyAmount}\n\nPlease share account number.`;
    return `https://wa.me/923007244198?text=${encodeURIComponent(msg)}`;
  }
}
