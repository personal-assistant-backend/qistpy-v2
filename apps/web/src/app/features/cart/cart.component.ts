import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { formatPkr } from '../../core/services/currency';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-qp py-8">
      <h1 class="mb-6">Your Cart</h1>

      @if (loading()) {
        <div class="card p-8 text-center text-muted">Loading cart...</div>
      } @else {
        @if (cartSvc.cart(); as cart) {
          @if (cart.items.length === 0) {
            <div class="card p-12 text-center">
              <div class="icon-chip mx-auto bg-canvas text-muted w-20 h-20 mb-4">
                <app-icon name="cart" [size]="36" />
              </div>
              <h3 class="mb-2">Your cart is empty</h3>
              <p class="text-muted text-sm mb-5">Add products to get started</p>
              <a routerLink="/shop" class="btn-primary">Browse Products</a>
            </div>
          } @else {
            <div class="grid lg:grid-cols-3 gap-6">
              <!-- Items -->
              <div class="lg:col-span-2 space-y-3">
                @for (item of cart.items; track item.id) {
                  <div class="card p-4 flex gap-4">
                    <a [routerLink]="['/product', item.product.slug]" class="shrink-0">
                      @if (item.product.images.length) {
                        <img [src]="item.product.images[0].url" [alt]="item.product.name"
                             class="w-24 h-24 object-contain bg-canvas rounded-lg"/>
                      } @else {
                        <div class="w-24 h-24 bg-canvas rounded-lg grid place-items-center text-muted">
                          <app-icon name="package" [size]="28" />
                        </div>
                      }
                    </a>
                    <div class="flex-1 min-w-0">
                      <a [routerLink]="['/product', item.product.slug]"
                         class="font-heading font-semibold text-ink hover:text-primary block line-clamp-1">
                        {{ item.product.name }}
                      </a>
                      <div class="text-xs text-muted mt-0.5">
                        {{ item.installmentPlan.durationMonths }}-month plan
                      </div>
                      <div class="text-sm tabular-nums mt-2 space-y-0.5">
                        <div><span class="text-muted text-xs">Advance:</span>
                          <span class="font-semibold text-primary ml-1">{{ fmt(item.installmentPlan.advanceAmount) }}</span>
                        </div>
                        <div><span class="text-muted text-xs">Monthly:</span>
                          <span class="font-medium ml-1">{{ fmt(item.installmentPlan.monthlyAmount) }}</span>
                        </div>
                      </div>
                      <!-- Quantity -->
                      <div class="mt-3 flex items-center gap-3">
                        <div class="inline-flex items-center border border-border rounded-lg">
                          <button type="button" (click)="updateQty(item.id, item.quantity - 1)"
                                  [disabled]="item.quantity <= 1"
                                  class="px-3 py-1 text-muted hover:text-primary disabled:opacity-30">−</button>
                          <span class="px-3 font-semibold tabular-nums">{{ item.quantity }}</span>
                          <button type="button" (click)="updateQty(item.id, item.quantity + 1)"
                                  [disabled]="item.quantity >= item.product.stock"
                                  class="px-3 py-1 text-muted hover:text-primary disabled:opacity-30">+</button>
                        </div>
                        <button type="button" (click)="remove(item.id)"
                                class="text-xs text-red-600 hover:text-red-700 font-medium">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                }
                <button type="button" (click)="clear()"
                        class="text-sm text-muted hover:text-red-600">
                  Clear entire cart
                </button>
              </div>

              <!-- Summary -->
              <div class="card p-6 h-fit sticky top-24">
                <h3 class="mb-4 text-lg">Summary</h3>
                <div class="space-y-2 text-sm tabular-nums">
                  <div class="flex justify-between">
                    <span class="text-muted">Items</span>
                    <span class="font-semibold">{{ cart.totals.itemCount }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted">Total Advance</span>
                    <span class="font-semibold text-primary">{{ fmt(cart.totals.totalAdvance) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted">Monthly × duration</span>
                    <span class="font-semibold">{{ fmt(cart.totals.totalMonthly) }}</span>
                  </div>
                  <div class="flex justify-between pt-3 border-t border-border text-base">
                    <span class="font-semibold">Total Payable</span>
                    <span class="font-heading font-bold text-primary">{{ fmt(cart.totals.totalPayable) }}</span>
                  </div>
                </div>
                <a routerLink="/checkout" class="btn-primary w-full btn-lg mt-5">
                  Proceed to Checkout
                  <app-icon name="arrow-right" [size]="16" />
                </a>
                <a routerLink="/shop" class="btn-secondary w-full mt-2">Continue Shopping</a>
              </div>
            </div>
          }
        }
      }
    </div>
  `,
})
export class CartComponent {
  readonly cartSvc = inject(CartService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly fmt = formatPkr;

  constructor() {
    this.cartSvc.refresh().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  updateQty(id: string, qty: number): void {
    if (qty < 1) return;
    this.cartSvc.updateQty(id, qty).subscribe();
  }

  remove(id: string): void {
    this.cartSvc.remove(id).subscribe();
  }

  clear(): void {
    if (!confirm('Clear the entire cart?')) return;
    this.cartSvc.clear().subscribe();
  }
}
