import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { IconComponent } from './icon.component';
import { HttpClient } from '@angular/common/http';
function formatPkr(amount: number | null | undefined): string {
  if (!amount) {
    return 'Rs 0';
  }

  return new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
  }).format(amount);
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hidden md:block bg-ink text-white/90 text-xs">
      <div class="container-qp flex justify-between items-center py-2">
        <div class="flex items-center gap-6">
          <span class="flex items-center gap-1.5">
            <app-icon name="truck" [size]="14" /> Free delivery across Pakistan
          </span>
          <span class="flex items-center gap-1.5">
            <app-icon name="shield" [size]="14" /> 100% original products
          </span>
          <span class="flex items-center gap-1.5">
            <app-icon name="badge-check" [size]="14" /> Official warranty
          </span>
        </div>
        <div class="flex items-center gap-4">
          <a href="tel:+923007244198" class="flex items-center gap-1 hover:text-white">
            <app-icon name="phone" [size]="12" /> +92 300 724 4198
          </a>
          <a routerLink="/about" class="hover:text-white">About</a>
          <a routerLink="/contact" class="hover:text-white">Contact</a>
        </div>
      </div>
    </div>

    <header class="sticky top-0 z-40 bg-white border-b border-border">
      <div class="container-qp">
        <div class="flex items-center gap-3 md:gap-6 py-3 md:py-4">
          <button type="button" class="md:hidden btn-ghost p-2"
                  (click)="mobileOpen.set(!mobileOpen())" aria-label="Menu">
            @if (mobileOpen()) { <app-icon name="x" [size]="22" /> } @else { <app-icon name="menu" [size]="22" /> }
          </button>

          <a routerLink="/" class="flex items-center gap-2.5 shrink-0">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark grid place-items-center shadow-sm">
              <span class="text-white font-heading font-bold text-xl">Q</span>
            </div>
            <div class="hidden sm:block leading-tight">
              <div class="font-heading font-bold text-xl text-ink">QistPY</div>
              <div class="text-[10px] text-muted uppercase tracking-widest font-semibold">
                Easy Installments
              </div>
            </div>
          </a>

          <form class="flex-1 max-w-2xl" (ngSubmit)="onSearch()">
            <div class="relative group">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                <app-icon name="search" [size]="18" />
              </span>
              <input type="search" name="q" [(ngModel)]="query"
                     placeholder="Search mobiles, laptops, bikes, appliances..."
                     (input)="onQueryInput()"
                     (keydown.escape)="hideSuggestions()"
                     (blur)="onSearchBlur()"
                     autocomplete="off"
                     class="w-full pl-11 pr-20 py-2.5 rounded-xl border border-border bg-canvas
                            focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20
                            text-sm placeholder:text-muted transition-all"/>
              <button type="submit"
                      class="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary-dark
                             text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                Search
              </button>
              <!-- Suggestions dropdown -->
              @if (suggestions().length && showSugg()) {
                <div class="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  @for (s of suggestions(); track s.id) {
                    <div class="flex items-center gap-3 px-4 py-2.5 hover:bg-canvas cursor-pointer transition-colors"
                         (mousedown)="pickSuggestion(s)">
                      <div class="w-8 h-8 rounded-lg overflow-hidden bg-canvas shrink-0">
                        @if (s.images?.[0]?.url) {
                          <img [src]="s.images[0].url" [alt]="s.name" width="40" height="40" loading="lazy" class="w-full h-full object-contain p-0.5"/>
                        } @else {
                          <div class="w-full h-full grid place-items-center text-sm">📦</div>
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-semibold text-ink truncate">{{ s.name }}</div>
                        <div class="text-xs text-muted">{{ s.category?.name }} · Adv: {{ formatPkr(s.lowestAdvance) }}</div>
                      </div>
                    </div>
                  }
                  <div class="px-4 py-2 bg-primary-50 border-t border-border">
                    <button type="submit" class="text-xs text-primary font-semibold w-full text-left hover:text-primary-dark">
                      🔍 Search all results for "{{ query }}"
                    </button>
                  </div>
                </div>
              }
            </div>
          </form>

          <div class="flex items-center gap-1 shrink-0">
            <a routerLink="/cart" class="btn-ghost p-2 relative" aria-label="Cart">
              <app-icon name="cart" [size]="22" />
              @if (cartCount() > 0) {
                <span class="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold
                             rounded-full w-4 h-4 grid place-items-center">
                  {{ cartCount() }}
                </span>
              }
            </a>

            @if (auth.isLoggedIn()) {
              <div class="relative">
                <button type="button" (click)="userMenuOpen.set(!userMenuOpen())"
                        class="btn-ghost flex items-center gap-2 pr-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white grid place-items-center font-heading font-bold text-sm">
                    {{ initials() }}
                  </div>
                  <span class="hidden md:inline text-sm font-medium">
                    {{ firstName() }}
                  </span>
                </button>
                @if (userMenuOpen()) {
                  <div class="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg min-w-[200px] py-2 z-50">
                    <a [routerLink]="dashboardRoute()" (click)="userMenuOpen.set(false)"
                       class="block px-4 py-2 text-sm hover:bg-canvas">Dashboard</a>
                    <a routerLink="/account/orders" (click)="userMenuOpen.set(false)"
                       class="block px-4 py-2 text-sm hover:bg-canvas">My Orders</a>
                    <a routerLink="/account/installments" (click)="userMenuOpen.set(false)"
                       class="block px-4 py-2 text-sm hover:bg-canvas">Installments</a>
                    <div class="border-t border-border my-1"></div>
                    <button type="button" (click)="logout()"
                            class="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600">
                      Logout
                    </button>
                  </div>
                }
              </div>
            } @else {
              <a routerLink="/login" class="btn-secondary text-sm hidden md:inline-flex">Login</a>
              <a routerLink="/signup" class="btn-primary text-sm hidden md:inline-flex">Sign Up</a>
            }
          </div>
        </div>

        <nav class="hidden md:flex items-center gap-7 pb-3 text-sm">
          <a routerLink="/" routerLinkActive="text-primary font-semibold"
             [routerLinkActiveOptions]="{ exact: true }"
             class="text-ink hover:text-primary font-medium">Home</a>
          <a routerLink="/shop" routerLinkActive="text-primary font-semibold"
             class="text-ink hover:text-primary font-medium">All Products</a>
          <div class="w-px h-4 bg-border"></div>
          @for (cat of primaryCategories; track cat.slug) {
            <a [routerLink]="['/shop', cat.slug]" routerLinkActive="text-primary"
               class="text-ink/80 hover:text-primary flex items-center gap-1.5">
              <app-icon [name]="cat.icon" [size]="15" />
              {{ cat.name }}
            </a>
          }
          <div class="ml-auto flex items-center gap-4">
            <a routerLink="/how-it-works" class="text-ink/80 hover:text-primary">How it works</a>
            <a routerLink="/blog" class="text-ink/80 hover:text-primary">Blog</a>
            <a routerLink="/faqs" class="text-ink/80 hover:text-primary">FAQs</a>
          </div>
        </nav>

        @if (mobileOpen()) {
          <div class="md:hidden border-t border-border py-3 space-y-1">
            <a routerLink="/" (click)="mobileOpen.set(false)"
               class="block px-3 py-2 rounded-lg hover:bg-canvas text-sm font-medium">Home</a>
            <a routerLink="/shop" (click)="mobileOpen.set(false)"
               class="block px-3 py-2 rounded-lg hover:bg-canvas text-sm font-medium">All Products</a>
            @for (cat of primaryCategories; track cat.slug) {
              <a [routerLink]="['/shop', cat.slug]" (click)="mobileOpen.set(false)"
                 class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-canvas text-sm">
                <app-icon [name]="cat.icon" [size]="16" />
                {{ cat.name }}
              </a>
            }
            @if (!auth.isLoggedIn()) {
              <div class="flex gap-2 pt-2 border-t border-border mt-2">
                <a routerLink="/login" class="btn-secondary flex-1 text-sm">Login</a>
                <a routerLink="/signup" class="btn-primary flex-1 text-sm">Sign Up</a>
              </div>
            } @else {
              <a [routerLink]="dashboardRoute()" (click)="mobileOpen.set(false)"
                 class="block px-3 py-2 rounded-lg hover:bg-canvas text-sm font-medium">Dashboard</a>
              <button type="button" (click)="logout()"
                      class="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 text-sm font-medium">
                Logout
              </button>
            }
          </div>
        }
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);

  query = '';
  readonly suggestions = signal<any[]>([]);
  readonly showSugg    = signal(false);
  readonly formatPkr   = formatPkr;
  private searchTimer: any;
  private readonly http = inject(HttpClient);
  readonly mobileOpen = signal(false);
  readonly userMenuOpen = signal(false);
  readonly cartCount = computed(() => this.cart.cart()?.totals.itemCount ?? 0);

  readonly primaryCategories: Array<{
    name: string; slug: string;
    icon: 'smartphone' | 'laptop' | 'bike' | 'snowflake' | 'refrigerator' | 'tv';
  }> = [
    { name: 'Mobiles', slug: 'mobiles', icon: 'smartphone' },
    { name: 'Laptops', slug: 'laptops', icon: 'laptop' },
    { name: 'Bikes', slug: 'bikes', icon: 'bike' },
    { name: 'ACs', slug: 'acs', icon: 'snowflake' },
    { name: 'Refrigerators', slug: 'refrigerators', icon: 'refrigerator' },
  ];

  constructor() {
    // Refresh cart on login to show badge count
    if (this.auth.isLoggedIn() && this.auth.role() === 'CUSTOMER') {
      this.cart.refresh().subscribe({ error: () => {/* ignore */} });
    }
  }

  initials(): string {
    const n = this.auth.user()?.name ?? 'U';
    return n.split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase();
  }

  firstName(): string {
    return this.auth.user()?.name?.split(' ')[0] ?? 'User';
  }

  dashboardRoute(): string {
    const r = this.auth.role();
    if (r === 'ADMIN') return '/admin';
    if (r === 'VENDOR') return '/vendor';
    return '/account';
  }

  onQueryInput(): void {
    clearTimeout(this.searchTimer);
    const q = this.query.trim();
    if (q.length < 2) { this.suggestions.set([]); this.showSugg.set(false); return; }
    this.searchTimer = setTimeout(() => {
      this.http.get<{ data: any[] }>(
  `/products?q=${encodeURIComponent(q)}&pageSize=5`
).subscribe({
        next: (r: { data: any[] }) => { this.suggestions.set(r.data ?? []); this.showSugg.set(true); },
        error: () => this.suggestions.set([]),
      });
    }, 300);
  }

  onSearchBlur(): void {
    setTimeout(() => this.showSugg.set(false), 200);
  }

  hideSuggestions(): void { this.showSugg.set(false); }

  pickSuggestion(p: any): void {
    this.query = p.name;
    this.showSugg.set(false);
    this.router.navigate(['/product', p.slug]);
  }

  onSearch(): void {
    const q = this.query.trim();
    if (!q) return;
    this.router.navigate(['/shop'], { queryParams: { q } });
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.mobileOpen.set(false);
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/']),
      error: () => this.router.navigate(['/']),
    });
  }
}
