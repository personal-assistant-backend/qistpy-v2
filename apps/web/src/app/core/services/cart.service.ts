import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    cashPrice: string;
    stock: number;
    images: Array<{ url: string; alt: string | null }>;
  };
  installmentPlan: {
    id: string;
    durationMonths: number;
    advanceAmount: string;
    monthlyAmount: string;
    totalPayable: string;
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  totals: {
    itemCount: number;
    totalAdvance: string;
    totalMonthly: string;
    totalPayable: string;
  };
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly _cart = signal<Cart | null>(null);
  readonly cart = this._cart.asReadonly();

  refresh(): Observable<Cart> {
    return this.http.get<Cart>('/cart').pipe(tap((c) => this._cart.set(c)));
  }

  add(productId: string, installmentPlanId: string, quantity = 1) {
    return this.http
      .post('/cart/items', { productId, installmentPlanId, quantity })
      .pipe(tap(() => this.refresh().subscribe()));
  }

  updateQty(itemId: string, quantity: number) {
    return this.http
      .patch(`/cart/items/${itemId}`, { quantity })
      .pipe(tap(() => this.refresh().subscribe()));
  }

  remove(itemId: string) {
    return this.http
      .delete(`/cart/items/${itemId}`)
      .pipe(tap(() => this.refresh().subscribe()));
  }

  clear() {
    return this.http.delete('/cart').pipe(tap(() => this._cart.set(null)));
  }

  checkout(addressId: string, notes?: string) {
    return this.http
      .post<{ orderId: string; orderNumber: string }>('/account/orders/checkout', {
        addressId, notes,
      })
      .pipe(tap(() => this._cart.set(null)));
  }
}
