import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InstallmentPlan, ProductDetail } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { formatPkr } from '../../core/services/currency';
import { PageSeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon.component';

type ViewState = 'loading' | 'error' | 'ready';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-qp py-6">
      @switch (viewState()) {
        @case ('loading') {
          <div class="grid lg:grid-cols-2 gap-8">
            <div class="aspect-square card shimmer rounded-2xl"></div>
            <div class="space-y-4">
              <div class="h-10 bg-canvas rounded shimmer"></div>
              <div class="h-4 bg-canvas rounded shimmer w-2/3"></div>
              <div class="h-40 bg-canvas rounded shimmer"></div>
            </div>
          </div>
        }

        @case ('error') {
          <div data-http-status="404" style="display:none"></div>
          <div class="card p-12 text-center">
            <div class="text-5xl mb-3">😕</div>
            <h2 class="text-ink mb-2">Product not found</h2>
            <p class="text-muted text-sm mb-5">This product may have been removed.</p>
            <a routerLink="/shop" class="btn-primary">Browse Products</a>
          </div>
        }

        @case ('ready') {
          @if (product(); as p) {
            <!-- Breadcrumbs -->
            <nav aria-label="Breadcrumb" class="text-xs text-muted mb-4 flex gap-1.5 flex-wrap items-center">
              <a routerLink="/" class="hover:text-primary">Home</a>
              <span>/</span>
              <a routerLink="/shop" class="hover:text-primary">Shop</a>
              <span>/</span>
              <a [routerLink]="['/shop', p.category.slug]" class="hover:text-primary">
                {{ p.category.name }}
              </a>
              <span>/</span>
              <span class="text-ink truncate max-w-[200px]" aria-current="page">{{ p.name }}</span>
            </nav>

            <div class="grid lg:grid-cols-2 gap-8 xl:gap-12">
              <!-- ════ LEFT: Gallery ════ -->
              <div>
                <!-- Main image -->
                <div class="card aspect-square overflow-hidden mb-3 bg-canvas rounded-2xl">
                  @if (activeImage(); as img) {
                    <img [src]="img.url" [alt]="img.alt || p.name" width="600" height="600"
                         class="w-full h-full object-contain p-6 transition-all duration-300"/>
                  } @else {
                    <div class="w-full h-full grid place-items-center text-muted">
                      <app-icon name="package" [size]="60"/>
                    </div>
                  }
                </div>

                <!-- Thumbnails -->
                @if (p.images.length > 1) {
                  <div class="grid grid-cols-5 gap-2">
                    @for (img of p.images; track img.id; let idx = $index) {
                      <button type="button" (click)="activeImageIndex.set(idx)"
                              class="aspect-square rounded-xl overflow-hidden border-2 transition-all"
                              [class.border-primary]="idx === activeImageIndex()"
                              [class.border-border]="idx !== activeImageIndex()">
                        <img [src]="img.url" [alt]="img.alt || p.name" width="80" height="80" loading="lazy"
                             class="w-full h-full object-contain bg-canvas p-1"/>
                      </button>
                    }
                  </div>
                }

                <!-- Trust badges -->
                <div class="grid grid-cols-3 gap-2 mt-4">
                  <div class="card p-3 text-center">
                    <app-icon name="truck" [size]="20" class="text-primary mx-auto mb-1"/>
                    <div class="text-[11px] font-semibold text-ink">Free Delivery</div>
                    <div class="text-[10px] text-muted">All Pakistan</div>
                  </div>
                  <div class="card p-3 text-center">
                    <app-icon name="badge-check" [size]="20" class="text-success mx-auto mb-1"/>
                    <div class="text-[11px] font-semibold text-ink">100% Original</div>
                    <div class="text-[10px] text-muted">With warranty</div>
                  </div>
                  <div class="card p-3 text-center">
                    <app-icon name="shield" [size]="20" class="text-primary mx-auto mb-1"/>
                    <div class="text-[11px] font-semibold text-ink">Secure</div>
                    <div class="text-[10px] text-muted">Agent verified</div>
                  </div>
                </div>
              </div>

              <!-- ════ RIGHT: Info + Plan ════ -->
              <div>
                <!-- Brand -->
                @if (p.brand) {
                  <div class="badge-primary mb-2 inline-flex">{{ p.brand.name }}</div>
                }

                <!-- Title -->
                <h1 class="text-2xl md:text-3xl font-heading font-bold text-ink leading-tight mb-2">
                  {{ p.name }}
                </h1>

                @if (p.shortDescription) {
                  <p class="text-muted text-sm mb-4 leading-relaxed">{{ p.shortDescription }}</p>
                }

                <!-- Rating -->
                <div class="flex items-center gap-2 mb-4">
                  <div class="flex text-accent">
                    @for (_ of five; track $index) {
                      <app-icon name="star" [size]="16"/>
                    }
                  </div>
                  <span class="text-sm text-muted">(4.8 · 120+ customers)</span>
                  @if (p.stock > 0) {
                    <span class="ml-auto badge-success flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-success inline-block"></span>
                      In Stock ({{ p.stock }})
                    </span>
                  } @else {
                    <span class="ml-auto badge text-white bg-red-500">Out of Stock</span>
                  }
                </div>

                <!-- Cash Price -->
                <div class="card p-4 mb-5 bg-gradient-to-r from-primary-50 to-white border border-primary-100">
                  <div class="text-xs text-muted uppercase tracking-wide font-semibold mb-1">
                    Cash Price
                  </div>
                  <div class="text-3xl font-heading font-bold text-primary tabular-nums">
                    {{ formatPkr(p.cashPrice) }}
                  </div>
                </div>

                <!-- Plan selector -->
                @if (p.plans.length) {
                  <div class="mb-5">
                    <div class="flex items-center gap-2 mb-3">
                      <app-icon name="credit-card" [size]="18" class="text-primary"/>
                      <h3 class="font-heading font-bold text-ink text-base">
                        SELECT YOUR PLAN
                      </h3>
                    </div>

                    <!-- Duration dropdown -->
                    <div class="mb-4">
                      <label class="block text-xs font-semibold text-muted mb-1.5">
                        Choose Payment Duration
                      </label>
                      <select [value]="selectedPlanId()"
                              (change)="selectedPlanId.set($any($event.target).value)"
                              name="plan"
                              class="w-full px-4 py-3 rounded-xl border-2 border-border bg-white
                                     focus:outline-none focus:border-primary text-sm font-medium">
                        @for (plan of p.plans; track plan.id) {
                          <option [value]="plan.id">
                            {{ plan.durationMonths }} Months Plan
                          </option>
                        }
                      </select>
                    </div>

                    <!-- Plan details card -->
                    @if (activePlan(); as plan) {
                      <div class="card p-5 border-2 border-primary-100 bg-primary-50/30">
                        <div class="flex items-center gap-2 mb-4">
                          <app-icon name="credit-card" [size]="18" class="text-accent"/>
                          <span class="font-heading font-bold text-ink">Payment Plan Details</span>
                        </div>
                        <div class="space-y-2.5 tabular-nums">
                          <div class="flex justify-between items-center py-1.5 border-b border-border">
                            <span class="text-muted text-sm">Plan Title</span>
                            <span class="font-semibold text-ink">
                              Installment Plan {{ plan.durationMonths }}M
                            </span>
                          </div>
                          <div class="flex justify-between items-center py-1.5 border-b border-border">
                            <span class="text-muted text-sm">Advance Payment</span>
                            <span class="font-bold text-primary text-base">
                              {{ formatPkr(plan.advanceAmount) }}
                            </span>
                          </div>
                          <div class="flex justify-between items-center py-1.5 border-b border-border">
                            <span class="text-muted text-sm">Monthly Payment</span>
                            <span class="font-semibold text-ink">
                              {{ formatPkr(plan.monthlyAmount) }} × {{ plan.durationMonths }} months
                            </span>
                          </div>
                          <div class="flex justify-between items-center pt-2">
                            <span class="font-bold text-ink">Total Amount</span>
                            <span class="font-heading font-bold text-primary text-xl">
                              {{ formatPkr(plan.totalPayable) }}
                            </span>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- CTA Buttons -->
                <div class="space-y-3">
                  <button type="button" (click)="proceedNow()"
                          [disabled]="!activePlan() || addingToCart() || p.stock === 0"
                          class="btn-primary w-full btn-lg text-base">
                    @if (addingToCart()) {
                      <app-icon name="clock" [size]="18"/> Processing...
                    } @else if (!auth.isLoggedIn()) {
                      <app-icon name="user" [size]="18"/> Login to Proceed
                    } @else {
                      <app-icon name="cart" [size]="18"/> Proceed — Agent will Call You
                    }
                  </button>

                  <div class="text-center text-xs text-muted flex items-center justify-center gap-1.5">
                    <app-icon name="phone" [size]="12"/>
                    No payment needed — our agent will call you to confirm
                  </div>

                  <a href="https://wa.me/923007244198?text=I'm interested in {{ p.name }}"
                     target="_blank"
                     class="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                            bg-success/10 text-success border border-success/30
                            hover:bg-success/20 transition font-semibold text-sm">
                    <app-icon name="whatsapp" [size]="20"/>
                    Inquire on WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <!-- ════ DESCRIPTION + SPECS ════ -->
            <div class="mt-10 grid lg:grid-cols-3 gap-6">
              <!-- Description -->
              <div class="lg:col-span-2 card p-6">
                <h3 class="font-heading font-bold text-ink mb-4 flex items-center gap-2">
                  📋 Detailed Description
                </h3>
                <div class="text-ink/80 text-sm leading-relaxed whitespace-pre-line">
                  {{ p.description }}
                </div>
              </div>

              <!-- Specs -->
              @if (p.specs && p.specs.length) {
                <aside class="card p-6">
                  <h3 class="font-heading font-bold text-ink mb-4">Specifications</h3>
                  <dl class="space-y-2">
                    @for (spec of p.specs; track spec.id) {
                      <div class="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                        <dt class="text-muted">{{ spec.label }}</dt>
                        <dd class="font-semibold text-ink text-right">{{ spec.value }}</dd>
                      </div>
                    }
                  </dl>
                </aside>
              }
            </div>
          }
        }
      }
    </div>
  `,
})
export class ProductDetailComponent {
  private readonly catalog = inject(CatalogService);
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly seo     = inject(PageSeoService);
  readonly auth            = inject(AuthService);
  private readonly cartSvc = inject(CartService);
  private readonly toast   = inject(ToastService);

  readonly product          = signal<ProductDetail | null>(null);
  readonly loading          = signal(true);
  readonly error            = signal(false);
  readonly activeImageIndex = signal(0);
  readonly addingToCart     = signal(false);
  readonly formatPkr        = formatPkr;
  readonly five             = Array.from({ length: 5 });

  readonly selectedPlanId = signal<string>('');

  readonly viewState = computed<ViewState>(() => {
    if (this.loading()) return 'loading';
    if (this.error())   return 'error';
    return 'ready';
  });

  readonly activeImage = computed(() => {
    const p = this.product();
    if (!p?.images.length) return null;
    return p.images[this.activeImageIndex()] ?? p.images[0];
  });

  readonly activePlan = computed<InstallmentPlan | null>(() => {
    const p = this.product();
    if (!p) return null;
    return p.plans.find(x => x.id === this.selectedPlanId()) ?? null;
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (!slug) return;
      this.loading.set(true);
      this.error.set(false);

      this.catalog.getProduct(slug).subscribe({
        next: (product) => {
          this.product.set(product);
          // Default: 6-month plan or first available
          const def = product.plans.find(p => p.durationMonths === 6) ?? product.plans[0];
          if (def) this.selectedPlanId.set(def.id);
          this.activeImageIndex.set(0);
          this.loading.set(false);
          this.applySeo(product, slug);
        },
        error: () => { this.loading.set(false); this.error.set(true); },
      });
    });
  }

  private applySeo(p: ProductDetail, slug: string): void {
    const description =
      p.shortDescription ||
      `Buy ${p.name} on easy monthly installments in Pakistan. No credit card needed — buy now, pay later. Our agent calls to confirm your order, with free nationwide delivery.`;

    this.seo.set({
      title: `${p.name} on Easy Installments`,
      description,
      image: p.images[0]?.url,
      path: `/product/${slug}`,
    });

    this.seo.setJsonLd('product-schema', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      image: p.images.map((i) => i.url),
      description,
      brand: p.brand ? { '@type': 'Brand', name: p.brand.name } : undefined,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'PKR',
        price: p.cashPrice,
        availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: `https://qistpy.com/product/${slug}`,
      },
    });

    this.seo.setJsonLd('breadcrumb-schema', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://qistpy.com/' },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://qistpy.com/shop' },
        {
          '@type': 'ListItem',
          position: 3,
          name: p.category.name,
          item: `https://qistpy.com/shop/${p.category.slug}`,
        },
        { '@type': 'ListItem', position: 4, name: p.name, item: `https://qistpy.com/product/${slug}` },
      ],
    });
  }

  proceedNow(): void {
    const plan    = this.activePlan();
    const product = this.product();
    if (!plan || !product) {
      this.toast.error('Please select a plan first');
      return;
    }

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.addingToCart.set(true);
    this.cartSvc.add(product.id, plan.id, 1).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.toast.success(
          'Added to cart! 🎉',
          `${product.name} — ${plan.durationMonths} month plan`
        );
        this.router.navigate(['/cart']);
      },
      error: (e) => {
        this.addingToCart.set(false);
        const status = e?.status;
        const msg    = e?.error?.message ?? 'Please try again';
        if (status === 401) {
          // Token expired — re-login
          this.toast.error('Session expired. Please login again.');
          this.router.navigate(['/login']);
        } else {
          this.toast.error('Could not add to cart', Array.isArray(msg) ? msg.join(', ') : msg);
        }
      },
    });
  }
}
