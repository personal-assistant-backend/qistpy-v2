import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Paginated, ProductListItem } from '../../core/models/api.models';
import { CatalogService, ProductListFilters } from '../../core/services/catalog.service';
import { formatPkr } from '../../core/services/currency';
import { PageSeoService } from '../../core/services/seo.service';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ProductCardComponent } from '../../shared/components/product-card.component';
import { IconComponent } from '../../shared/components/icon.component';

type SortOption = NonNullable<ProductListFilters['sort']>;

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProductCardComponent, PaginationComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-qp py-6 md:py-8">
      <!-- Breadcrumbs -->
      <nav aria-label="Breadcrumb" class="text-xs text-muted mb-3 flex gap-1.5 flex-wrap items-center">
        <a routerLink="/" class="hover:text-primary">Home</a>
        <span>/</span>
        @if (categorySlug()) {
          <a routerLink="/shop" class="hover:text-primary">Shop</a>
          <span>/</span>
          <span class="text-ink" aria-current="page">{{ displayTitle() }}</span>
        } @else {
          <span class="text-ink" aria-current="page">Shop</span>
        }
      </nav>
      <!-- Header -->
      <div class="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-4">
        <div>
          <h1 class="text-ink">
            @if (categorySlug()) { {{ displayTitle() }} } @else { All Products }
          </h1>
          @if (result(); as r) {
            <p class="text-sm text-muted mt-0.5 tabular-nums">
              {{ r.meta.total }} product{{ r.meta.total === 1 ? '' : 's' }} found
              @if (query()) { for "{{ query() }}" }
            </p>
          }
        </div>
        <!-- Sort -->
        <div class="flex items-center gap-2 shrink-0">
          <label class="text-sm text-muted">Sort by:</label>
          <select [ngModel]="sort()" (ngModelChange)="onSortChange($event)"
            class="border border-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary">
            <option value="latest">Latest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      <div class="grid md:grid-cols-4 gap-5">
        <!-- ── FILTER SIDEBAR ── -->
        <aside class="md:col-span-1">
          <div class="card p-4 sticky top-24">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-heading font-bold">Filters</h3>
              @if (hasActiveFilters()) {
                <button type="button" (click)="clearFilters()"
                        class="text-xs text-primary hover:underline font-semibold">
                  Clear all
                </button>
              }
            </div>

            <!-- Price Range -->
            <div class="mb-4">
              <h4 class="text-xs font-bold text-muted uppercase tracking-wide mb-3">Price Range</h4>

              <!-- Quick ranges -->
              <div class="space-y-1.5 mb-3">
                @for (r of priceRanges; track r.label) {
                  <button type="button" (click)="selectPriceRange(r.min, r.max)"
                          class="w-full text-left text-sm px-3 py-1.5 rounded-lg transition"
                          [class.bg-primary]="activePriceRange() === r.label"
                          [class.text-white]="activePriceRange() === r.label"
                          [class.hover:bg-canvas]="activePriceRange() !== r.label"
                          [class.text-ink]="activePriceRange() !== r.label">
                    {{ r.label }}
                  </button>
                }
              </div>

              <!-- Custom range inputs -->
              <div class="border-t border-border pt-3">
                <p class="text-xs text-muted mb-2">Custom range:</p>
                <div class="flex gap-2 items-center">
                  <input type="number" placeholder="Min" [(ngModel)]="customMin"
                    class="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:border-primary tabular-nums"
                    min="0"/>
                  <span class="text-muted text-xs shrink-0">to</span>
                  <input type="number" placeholder="Max" [(ngModel)]="customMax"
                    class="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:border-primary tabular-nums"
                    min="0"/>
                </div>
                <button type="button" (click)="applyCustomRange()"
                        class="w-full mt-2 btn-primary text-xs py-1.5">
                  Apply
                </button>
              </div>

              <!-- Active range display -->
              @if (minPrice() || maxPrice()) {
                <div class="mt-2 flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-1.5">
                  <app-icon name="tag" [size]="12" class="text-primary"/>
                  <span class="text-xs text-primary font-semibold tabular-nums">
                    {{ fmt(minPrice() || 0) }} — {{ maxPrice() ? fmt(maxPrice()!) : 'Any' }}
                  </span>
                  <button type="button" (click)="clearPrice()" class="ml-auto text-primary">
                    <app-icon name="x" [size]="12"/>
                  </button>
                </div>
              }
            </div>

            <!-- In-Stock toggle -->
            <div class="border-t border-border pt-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="inStockOnly" (ngModelChange)="fetch()"
                       class="accent-primary w-4 h-4"/>
                <span class="text-sm text-ink">In Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        <!-- ── PRODUCT GRID ── -->
        <div class="md:col-span-3">
          @if (loading()) {
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              @for (_ of skeletonSlots; track $index) {
                <div class="card h-96 shimmer rounded-xl"></div>
              }
            </div>
          } @else if (error()) {
            <div class="card p-8 text-center text-muted">
              Could not load products. Please check the API server.
            </div>
          } @else {
            @if (result(); as r) {
              @if (r.data.length === 0) {
                <div class="card p-12 text-center">
                  <div class="text-5xl mb-3">🔍</div>
                  <h3 class="text-ink mb-1">No products found</h3>
                  <p class="text-muted text-sm">Try changing filters or search term.</p>
                  <button type="button" (click)="clearFilters()" class="btn-primary mt-4">
                    Clear Filters
                  </button>
                </div>
              } @else {
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  @for (product of r.data; track product.id) {
                    <app-product-card [product]="product"/>
                  }
                </div>
                <app-pagination [meta]="r.meta" (pageChange)="onPageChange($event)"/>
              }
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class ProductsListComponent {
  private readonly catalog = inject(CatalogService);
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly seo     = inject(PageSeoService);

  readonly result       = signal<Paginated<ProductListItem> | null>(null);
  readonly loading      = signal(true);
  readonly error        = signal(false);
  readonly categorySlug = signal<string | null>(null);
  readonly query        = signal<string | null>(null);
  readonly sort         = signal<SortOption>('latest');
  readonly page         = signal(1);
  readonly minPrice     = signal<number | null>(null);
  readonly maxPrice     = signal<number | null>(null);
  readonly activePriceRange = signal<string | null>(null);

  customMin = '';
  customMax = '';
  inStockOnly = false;
  readonly fmt = formatPkr;
  readonly skeletonSlots = Array.from({ length: 6 });

  readonly priceRanges = [
    { label: 'Under Rs 10,000',       min: 0,      max: 10000   },
    { label: 'Rs 10,000 – 50,000',    min: 10000,  max: 50000   },
    { label: 'Rs 50,000 – 1,50,000',  min: 50000,  max: 150000  },
    { label: 'Rs 1,50,000 – 3,00,000',min: 150000, max: 300000  },
    { label: 'Above Rs 3,00,000',      min: 300000, max: 0       },
  ];

  hasActiveFilters(): boolean {
    return !!(this.minPrice() || this.maxPrice() || this.query() || this.inStockOnly);
  }

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.categorySlug.set(params.get('categorySlug'));
      this.page.set(1);
      this.fetch();
      this.applySeo();
    });
    this.route.queryParamMap.subscribe(params => {
      this.query.set(params.get('q'));
      const sortParam = params.get('sort') as SortOption | null;
      if (sortParam) this.sort.set(sortParam);
      const pageParam = params.get('page');
      if (pageParam) this.page.set(parseInt(pageParam, 10) || 1);
      this.fetch();
    });
  }

  private readonly categorySeoMap: Record<string, { title: string; description: string }> = {
    mobiles: {
      title: 'Mobile on Installment in Pakistan',
      description: 'Buy mobile phones on easy monthly installments in Pakistan. No credit card needed — buy now, pay later with agent-confirmed orders and free delivery nationwide.',
    },
    laptops: {
      title: 'Laptop on Installment Pakistan',
      description: 'Buy laptops on easy monthly installments across Pakistan. No credit card required, simple approval, free delivery nationwide.',
    },
    bikes: {
      title: 'Bike on Installment Pakistan',
      description: 'Buy your dream bike on easy monthly installments in Pakistan. No bank credit card needed, low advance, flexible monthly plans.',
    },
    leds: {
      title: 'LED & Smart TV on Installment Pakistan',
      description: 'Buy LED and Smart TVs on easy monthly installments in Pakistan, part of our home appliances on installment range. No credit card needed, free delivery nationwide.',
    },
    refrigerators: {
      title: 'Refrigerator on Installment Pakistan',
      description: 'Buy refrigerators on easy monthly installments across Pakistan, part of our home appliances on installment range. No credit card required, agent-confirmed orders.',
    },
    acs: {
      title: 'AC on Installment Pakistan',
      description: 'Buy air conditioners on easy monthly installments in Pakistan, part of our home appliances on installment range. No credit card needed, free nationwide delivery.',
    },
    'washing-machines': {
      title: 'Washing Machine on Installment Pakistan',
      description: 'Buy washing machines on easy monthly installments across Pakistan, part of our home appliances on installment range. No credit card required.',
    },
    microwaves: {
      title: 'Microwave Oven on Installment Pakistan',
      description: 'Buy microwave ovens on easy monthly installments in Pakistan, part of our home appliances on installment range. No credit card needed, simple approval.',
    },
  };

  private applySeo(): void {
    const slug = this.categorySlug();
    const name = this.displayTitle();
    const path = slug ? `/shop/${slug}` : '/shop';
    const mapped = slug ? this.categorySeoMap[slug] : undefined;

    this.seo.set({
      title: mapped?.title ?? (slug ? `${name} on Installment Pakistan` : 'Shop on Easy Monthly Installments — No Credit Card'),
      description: mapped?.description ?? (slug
        ? `Browse ${name} on easy monthly installments in Pakistan. No credit card needed, free delivery nationwide, agent confirms your order.`
        : 'Browse mobiles, laptops, bikes, and home appliances on easy monthly installment plans. No credit card needed, buy now pay later, free delivery across Pakistan.'),
      path,
    });

    const items: Array<{ '@type': string; position: number; name: string; item: string }> = [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://qistpy.com/' },
    ];
    if (slug) {
      items.push({ '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://qistpy.com/shop' });
      items.push({ '@type': 'ListItem', position: 3, name, item: `https://qistpy.com${path}` });
    } else {
      items.push({ '@type': 'ListItem', position: 2, name: 'Shop', item: `https://qistpy.com${path}` });
    }
    this.seo.setJsonLd('breadcrumb-schema', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items,
    });
  }

  displayTitle(): string {
    const slug = this.categorySlug();
    if (!slug) return 'All Products';
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  selectPriceRange(min: number, max: number): void {
    const range = this.priceRanges.find(r => r.min === min && r.max === max);
    this.activePriceRange.set(range?.label ?? null);
    this.minPrice.set(min > 0 ? min : null);
    this.maxPrice.set(max > 0 ? max : null);
    this.page.set(1);
    this.fetch();
  }

  applyCustomRange(): void {
    this.activePriceRange.set(null);
    this.minPrice.set(this.customMin ? parseInt(this.customMin) : null);
    this.maxPrice.set(this.customMax ? parseInt(this.customMax) : null);
    this.page.set(1);
    this.fetch();
  }

  clearPrice(): void {
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.activePriceRange.set(null);
    this.customMin = '';
    this.customMax = '';
    this.page.set(1);
    this.fetch();
  }

  clearFilters(): void {
    this.clearPrice();
    this.inStockOnly = false;
  }

  onSortChange(sort: SortOption): void {
    this.sort.set(sort);
    this.fetch();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.fetch();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(false);

    const filters: ProductListFilters = {
      page:     this.page(),
      pageSize: 12,
      sort:     this.sort(),
    };
    const slug = this.categorySlug();
    if (slug) filters.categorySlug = slug;
    const q = this.query();
    if (q) filters.q = q;
    if (this.minPrice()) filters.minPrice = this.minPrice()!;
    if (this.maxPrice()) filters.maxPrice = this.maxPrice()!;

    this.catalog.listProducts(filters).subscribe({
      next: result => { this.result.set(result); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set(true); },
    });
  }
}
