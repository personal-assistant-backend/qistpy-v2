import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { formatPkr } from '../../core/services/currency';
import { PageSeoService } from '../../core/services/seo.service';
import { IconComponent } from '../../shared/components/icon.component';
import { ProductCardComponent } from '../../shared/components/product-card.component';

@Component({
  selector: 'app-brand-page',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="min-h-screen bg-canvas">
  <!-- Brand Hero -->
  @if (brand()) {
    <div class="bg-gradient-to-r from-primary to-primary-dark text-white py-12">
      <div class="container mx-auto px-4 text-center">
        <nav aria-label="Breadcrumb" class="text-xs text-white/70 mb-4 flex gap-1.5 justify-center items-center">
          <a routerLink="/" class="hover:text-white">Home</a>
          <span>/</span>
          <span class="text-white" aria-current="page">{{ brand()!.name }}</span>
        </nav>
        <div class="w-20 h-20 rounded-2xl bg-white mx-auto mb-4 grid place-items-center shadow-lg">
          <span class="text-3xl font-heading font-black text-primary">{{ brand()!.name.charAt(0) }}</span>
        </div>
        <h1 class="text-3xl font-heading font-bold mb-2">{{ brand()!.name }}</h1>
        <p class="text-white/80">{{ total() }} products available on installments</p>
      </div>
    </div>
  }

  <div class="container mx-auto px-4 py-8">
    <!-- All Brands bar -->
    <div class="flex gap-2 overflow-x-auto pb-3 mb-6">
      @for (b of allBrands(); track b.id) {
        <a [routerLink]="['/brand', b.slug]"
           class="shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all"
           [class.border-primary]="b.slug === brandSlug()"
           [class.bg-primary]="b.slug === brandSlug()"
           [class.text-white]="b.slug === brandSlug()"
           [class.border-border]="b.slug !== brandSlug()"
           [class.text-muted]="b.slug !== brandSlug()"
           [class.hover:border-primary]="b.slug !== brandSlug()">
          {{ b.name }}
        </a>
      }
    </div>

    <!-- Products Grid -->
    @if (loading()) {
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        @for (i of [1,2,3,4,5,6,7,8]; track i) {
          <div class="bg-white rounded-2xl h-64 animate-pulse"></div>
        }
      </div>
    } @else if (products().length === 0) {
      <div class="text-center py-16">
        <div class="text-6xl mb-4">📦</div>
        <h3 class="text-xl font-heading font-bold text-ink mb-2">No products found</h3>
        <p class="text-muted">No products available for this brand yet.</p>
        <a routerLink="/shop" class="btn-primary mt-4 inline-block">Browse All Products</a>
      </div>
    } @else {
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        @for (p of products(); track p.id) {
          <app-product-card [product]="p" />
        }
      </div>
    }
  </div>
</div>
  `,
})
export class BrandPageComponent {
  private readonly http   = inject(HttpClient);
  private readonly route  = inject(ActivatedRoute);
  private readonly seo    = inject(PageSeoService);
  readonly router         = inject(Router);
  readonly fmt            = formatPkr;

  readonly brandSlug = signal('');
  readonly brand     = signal<any>(null);
  readonly products  = signal<any[]>([]);
  readonly allBrands = signal<any[]>([]);
  readonly loading   = signal(true);
  readonly total     = signal(0);

  constructor() {
    this.http.get<any[]>('/brands').subscribe(b => this.allBrands.set(b));

    this.route.paramMap.subscribe(p => {
      const slug = p.get('brandSlug') ?? '';
      this.brandSlug.set(slug);
      this.loading.set(true);

      // Get brand info
      this.http.get<any[]>('/brands').subscribe(brands => {
        const b = brands.find(x => x.slug === slug);
        if (b) {
          this.brand.set(b);
          this.seo.set({
            title: `${b.name} Products on Easy Installments`,
            description: `Shop genuine ${b.name} mobiles, laptops, and appliances on easy monthly installments in Pakistan. No credit card needed, free delivery nationwide.`,
            image: b.logoUrl,
            path: `/brand/${slug}`,
          });
          this.seo.setJsonLd('breadcrumb-schema', {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://qistpy.com/' },
              { '@type': 'ListItem', position: 2, name: b.name, item: `https://qistpy.com/brand/${slug}` },
            ],
          });
        }
      });

      // Get products
      this.http.get<any>(`/products?brandSlug=${slug}&pageSize=100`).subscribe({
        next: (r) => {
          this.products.set(r.data ?? []);
          this.total.set(r.meta?.total ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }
}
