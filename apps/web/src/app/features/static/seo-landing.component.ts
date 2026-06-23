import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductListItem } from '../../core/models/api.models';
import { CatalogService } from '../../core/services/catalog.service';
import { PageSeoService } from '../../core/services/seo.service';
import { ProductCardComponent } from '../../shared/components/product-card.component';
import { NotFoundComponent } from './not-found.component';

interface SeoPageData {
  path: string;
  title: string;
  metaDescription: string;
  introHtml: string;
  category: { id: string; name: string; slug: string };
  city: { id: string; name: string; slug: string };
}

/**
 * Catch-all route handler. Tries to match the current path against an
 * admin-managed SeoPage (city × category longtail landing page, e.g.
 * "/mobile-on-installment-in-faisalabad"). If found, renders a real,
 * crawlable landing page with live product results. If not found,
 * falls through to the standard 404 page.
 */
@Component({
  selector: 'app-seo-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, NotFoundComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (loading()) {
    <div class="container-qp py-10">
      <div class="h-8 w-64 bg-canvas rounded shimmer mb-3"></div>
      <div class="h-4 w-96 bg-canvas rounded shimmer"></div>
    </div>
  } @else {
    @if (page(); as p) {

      <section class="gradient-hero py-10 md:py-14">
        <div class="container-qp">
          <nav aria-label="Breadcrumb" class="text-xs text-muted mb-3 flex gap-1.5 items-center">
            <a routerLink="/" class="hover:text-primary">
              Home
            </a>

            <span>/</span>

            <a 
              [routerLink]="['/shop', p.category.slug]" 
              class="hover:text-primary">
              {{ p.category.name }}
            </a>

            <span>/</span>

            <span class="text-ink" aria-current="page">
              {{ p.city.name }}
            </span>
          </nav>

          <h1 class="mb-3">
            {{ p.category.name }} on Installment in {{ p.city.name }}
          </h1>

          <div
            class="prose text-ink/80 max-w-3xl text-sm leading-relaxed"
            [innerHTML]="introHtml()">
          </div>
        </div>
      </section>


      <section class="container-qp py-8">

        @if (products().length) {

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

            @for (prod of products(); track prod.id) {
              <app-product-card [product]="prod" />
            }

          </div>

        } @else {

          <p class="text-muted text-sm">
            No products available right now. Check back soon.
          </p>

        }

        <a 
          [routerLink]="['/shop', p.category.slug]" 
          class="btn-primary mt-6 inline-block">
          View All {{ p.category.name }}
        </a>

      </section>


    } @else {

      <app-not-found />

    }

    

  }
`,
})
export class SeoLandingComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  private readonly seo = inject(PageSeoService);
  private readonly doc = inject(DOCUMENT);

  readonly loading = signal(true);
  readonly page = signal<SeoPageData | null>(null);
  readonly products = signal<ProductListItem[]>([]);
  readonly introHtml = signal<string>('');

  constructor() {
    // Strip any query string; the backend matches on path only.
    const path = '/' + this.route.snapshot.url.map((s) => s.path).join('/');

    this.http.get<SeoPageData>(`/seo-pages${path}`).subscribe({
      next: (data) => {
        this.page.set(data);
        this.introHtml.set(data.introHtml);
        this.loading.set(false);
        this.applySeo(data, path);
        this.catalog.listProducts({ categorySlug: data.category.slug, pageSize: 8 }).subscribe({
          next: (res) => this.products.set(res.data),
          error: () => {},
        });
      },
      error: () => {
        this.loading.set(false);
        this.page.set(null);
      },
    });
  }

  private applySeo(p: SeoPageData, path: string): void {
    this.seo.set({
      title: p.title.replace(/\s*—\s*QistPY$/i, ''),
      description: p.metaDescription,
      path,
    });
    this.seo.setJsonLd('breadcrumb-schema', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://qistpy.com/' },
        {
          '@type': 'ListItem',
          position: 2,
          name: p.category.name,
          item: `https://qistpy.com/shop/${p.category.slug}`,
        },
        { '@type': 'ListItem', position: 3, name: p.city.name, item: `https://qistpy.com${path}` },
      ],
    });
  }
}
