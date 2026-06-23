import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { formatPkr } from '../../core/services/currency';
import { IconComponent } from '../../shared/components/icon.component';

interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  city: { id: string; name: string };
  phone?: string | null;
  isDefault: boolean;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-qp py-8">
      <h1 class="mb-6">Checkout</h1>

      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-5">
          <!-- Address selector -->
          <div class="card p-6">
            <h3 class="mb-4 text-lg flex items-center gap-2">
              <app-icon name="map-pin" [size]="18" /> Delivery Address
            </h3>
            @if (addresses().length === 0) {
              <div class="text-center py-6">
                <p class="text-muted text-sm mb-3">No addresses yet.</p>
                <a routerLink="/account/addresses" class="btn-primary">
                  Add Address
                </a>
              </div>
            } @else {
              <div class="space-y-2">
                @for (a of addresses(); track a.id) {
                  <label [class.border-primary]="selectedAddressId() === a.id"
                         [class.bg-primary-50]="selectedAddressId() === a.id"
                         class="flex gap-3 p-3 border-2 border-border rounded-xl cursor-pointer hover:border-primary-200 transition">
                    <input type="radio" name="addr" [value]="a.id"
                           [checked]="selectedAddressId() === a.id"
                           (change)="selectedAddressId.set(a.id)"
                           class="mt-1 accent-primary"/>
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-ink">{{ a.label }}</span>
                        @if (a.isDefault) {
                          <span class="badge-primary">Default</span>
                        }
                      </div>
                      <div class="text-sm text-muted mt-1">
                        {{ a.line1 }}@if (a.line2) { , {{ a.line2 }} }, {{ a.city.name }}
                        @if (a.phone) { · {{ a.phone }} }
                      </div>
                    </div>
                  </label>
                }
                <a routerLink="/account/addresses" class="text-sm text-primary hover:underline inline-block mt-2">
                  + Add new address
                </a>
              </div>
            }
          </div>

          <!-- Notes -->
          <div class="card p-6">
            <h3 class="mb-3 text-lg">Order Notes (Optional)</h3>
            <textarea [(ngModel)]="notes" rows="3"
              placeholder="E.g., Please call before delivery"
              class="w-full px-4 py-2.5 rounded-xl border border-border bg-canvas focus:outline-none focus:border-primary focus:bg-white text-sm"></textarea>
          </div>
        </div>

        <!-- Order summary -->
        <div class="card p-6 h-fit sticky top-24">
          <h3 class="mb-4 text-lg">Order Summary</h3>
          @if (cartSvc.cart(); as cart) {
            <div class="space-y-2 text-sm">
              @for (item of cart.items; track item.id) {
                <div class="flex gap-2 pb-2 border-b border-border last:border-0">
                  <span class="flex-1 line-clamp-1">{{ item.product.name }}</span>
                  <span class="tabular-nums text-muted">×{{ item.quantity }}</span>
                </div>
              }
            </div>
            <div class="mt-4 space-y-2 text-sm tabular-nums">
              <div class="flex justify-between">
                <span class="text-muted">Advance</span>
                <span class="font-semibold text-primary">{{ fmt(cart.totals.totalAdvance) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Monthly</span>
                <span class="font-semibold">{{ fmt(cart.totals.totalMonthly) }}</span>
              </div>
              <div class="flex justify-between pt-3 border-t border-border text-base">
                <span class="font-semibold">Total</span>
                <span class="font-heading font-bold text-primary">{{ fmt(cart.totals.totalPayable) }}</span>
              </div>
            </div>

            @if (error()) {
              <div class="mt-4 rounded-xl bg-red-50 text-red-700 text-sm p-3 border border-red-200">
                {{ error() }}
              </div>
            }

            <button type="button" (click)="placeOrder()"
                    [disabled]="!selectedAddressId() || loading() || !cart.items.length"
                    class="btn-primary w-full btn-lg mt-5">
              @if (loading()) { Placing order... }
              @else { Place Order <app-icon name="check" [size]="16" /> }
            </button>

            <p class="text-xs text-muted mt-3 text-center">
              After placing, your request goes to the vendor for approval.
            </p>
          } @else {
            <p class="text-muted text-sm">Loading cart...</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class CheckoutComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly cartSvc = inject(CartService);

  readonly addresses = signal<Address[]>([]);
  readonly selectedAddressId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  notes = '';
  readonly fmt = formatPkr;

  constructor() {
    this.cartSvc.refresh().subscribe();
    this.http.get<Address[]>('/users/me/addresses').subscribe((list) => {
      this.addresses.set(list);
      const def = list.find((a) => a.isDefault) ?? list[0];
      if (def) this.selectedAddressId.set(def.id);
    });
  }

  placeOrder(): void {
    const addr = this.selectedAddressId();
    if (!addr) return;
    this.loading.set(true);
    this.error.set(null);
    this.cartSvc.checkout(addr, this.notes.trim() || undefined).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.router.navigate(['/account/orders', res.orderId], {
          queryParams: { placed: '1' },
        });
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Checkout failed');
      },
    });
  }
}
