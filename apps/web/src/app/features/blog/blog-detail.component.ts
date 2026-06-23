import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogPost } from '../../core/models/api.models';
import { BlogService } from '../../core/services/blog.service';
import { PageSeoService } from '../../core/services/seo.service';

type ViewState = 'loading' | 'error' | 'ready';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-qp py-6 md:py-10">
      @switch (viewState()) {
        @case ('loading') {
          <div class="max-w-3xl mx-auto space-y-4">
            <div class="h-8 bg-canvas rounded shimmer w-3/4"></div>
            <div class="h-64 bg-canvas rounded-2xl shimmer"></div>
            <div class="h-4 bg-canvas rounded shimmer"></div>
            <div class="h-4 bg-canvas rounded shimmer w-5/6"></div>
          </div>
        }
        @case ('error') {
          <div data-http-status="404" style="display:none"></div>
          <div class="card p-12 text-center max-w-xl mx-auto">
            <div class="text-5xl mb-3">📰</div>
            <h2 class="text-ink mb-2">Post not found</h2>
            <p class="text-muted text-sm mb-5">This article may have been removed.</p>
            <a routerLink="/blog" class="btn-primary">Back to Blog</a>
          </div>
        }
        @case ('ready') {
          @if (post(); as p) {
            <div class="max-w-3xl mx-auto">
              <nav aria-label="Breadcrumb" class="text-xs text-muted mb-4 flex gap-1.5 flex-wrap items-center">
                <a routerLink="/" class="hover:text-primary">Home</a>
                <span>/</span>
                <a routerLink="/blog" class="hover:text-primary">Blog</a>
                <span>/</span>
                <span class="text-ink truncate max-w-[220px]" aria-current="page">{{ p.title }}</span>
              </nav>

              @if (p.category) {
                <span class="badge-primary mb-3 inline-flex">{{ p.category.name }}</span>
              }
              <h1 class="text-2xl md:text-3xl font-heading font-bold text-ink leading-tight mb-3">
                {{ p.title }}
              </h1>
              <p class="text-xs text-muted mb-6">
                Published {{ p.publishedAt | date: 'MMMM d, y' }}
              </p>

              @if (p.coverImageUrl) {
                <div class="aspect-[16/9] rounded-2xl overflow-hidden mb-6 bg-canvas">
                  <img [src]="p.coverImageUrl" [alt]="p.title" width="800" height="450"
                       class="w-full h-full object-cover"/>
                </div>
              }

              <div class="prose text-ink/80 leading-relaxed whitespace-pre-line">{{ p.content }}</div>

              <div class="mt-8 p-5 rounded-2xl bg-primary-50 border border-primary-100">
                <p class="text-sm text-ink font-semibold mb-2">Ready to buy on installments?</p>
                <a routerLink="/shop" class="btn-primary">Browse Products</a>
              </div>

              @if (related().length) {
                <div class="mt-10">
                  <h3 class="font-heading font-bold text-ink mb-4">More guides</h3>
                  <div class="grid sm:grid-cols-3 gap-4">
                    @for (r of related(); track r.id) {
                      <a [routerLink]="['/blog', r.slug]" class="card p-4 hover:border-primary transition-colors">
                        <h4 class="font-semibold text-ink text-sm leading-snug mb-1">{{ r.title }}</h4>
                        <p class="text-xs text-muted line-clamp-2">{{ r.excerpt }}</p>
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          }
        }
      }
    </div>
  `,
})
export class BlogDetailComponent {
  private readonly blogSvc = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(PageSeoService);

  readonly post = signal<BlogPost | null>(null);
  readonly related = signal<BlogPost[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly viewState = computed<ViewState>(() => {
    if (this.loading()) return 'loading';
    if (this.error()) return 'error';
    return 'ready';
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) return;
      this.loading.set(true);
      this.error.set(false);

      this.blogSvc.getBySlug(slug).subscribe({
        next: (data) => {
          this.post.set(data);
          this.related.set(data.related ?? []);
          this.loading.set(false);
          this.applySeo(data, slug);
        },
        error: () => { this.loading.set(false); this.error.set(true); },
      });
    });
  }

  private applySeo(p: BlogPost, slug: string): void {
    this.seo.set({
      title: p.metaTitle || p.title,
      description: p.metaDescription || p.excerpt,
      image: p.coverImageUrl ?? undefined,
      path: `/blog/${slug}`,
    });

    this.seo.setJsonLd('article-schema', {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.excerpt,
      image: p.coverImageUrl ? [p.coverImageUrl] : undefined,
      datePublished: p.publishedAt,
      dateModified: p.updatedAt,
      author: { '@type': 'Organization', name: 'QistPY' },
      publisher: { '@type': 'Organization', name: 'QistPY', url: 'https://qistpy.com' },
      mainEntityOfPage: `https://qistpy.com/blog/${slug}`,
    });

    this.seo.setJsonLd('breadcrumb-schema', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://qistpy.com/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://qistpy.com/blog' },
        { '@type': 'ListItem', position: 3, name: p.title, item: `https://qistpy.com/blog/${slug}` },
      ],
    });
  }
}
