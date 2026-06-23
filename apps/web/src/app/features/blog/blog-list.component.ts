import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogPost, Paginated } from '../../core/models/api.models';
import { BlogService } from '../../core/services/blog.service';
import { PageSeoService } from '../../core/services/seo.service';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="container-qp py-6 md:py-8">
    <nav aria-label="Breadcrumb" class="text-xs text-muted mb-3 flex gap-1.5 items-center">
      <a routerLink="/" class="hover:text-primary">Home</a>
      <span>/</span>
      <span class="text-ink" aria-current="page">Blog</span>
    </nav>

    <h1 class="text-ink mb-1">QistPY Blog</h1>
    <p class="text-muted text-sm mb-6">
      Guides on installment shopping, budgeting, and buying without a credit card in Pakistan.
    </p>

    @if (loading()) {
      <div class="grid md:grid-cols-3 gap-5">
        @for (_ of skeletons; track $index) {
          <div class="card h-72 shimmer rounded-2xl"></div>
        }
      </div>
    } @else {
      @if (result(); as r) {

        @if (r.data.length === 0) {
          <div class="card p-12 text-center text-muted">
            No posts published yet. Check back soon.
          </div>
        } @else {

          <div class="grid md:grid-cols-3 gap-5">
            @for (post of r.data; track post.id) {
              <a
                [routerLink]="['/blog', post.slug]"
                class="card overflow-hidden group hover:border-primary transition-colors">

                @if (post.coverImageUrl) {
                  <div class="aspect-[16/9] bg-canvas overflow-hidden">
                    <img
                      [src]="post.coverImageUrl"
                      [alt]="post.title"
                      width="400"
                      height="225"
                      loading="lazy"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                }

                <div class="p-4">
                  @if (post.category) {
                    <span class="badge-primary mb-2 inline-flex">
                      {{ post.category.name }}
                    </span>
                  }

                  <h3 class="font-heading font-bold text-ink leading-snug mb-1.5">
                    {{ post.title }}
                  </h3>

                  <p class="text-sm text-muted leading-relaxed line-clamp-3">
                    {{ post.excerpt }}
                  </p>
                </div>
              </a>
            }
          </div>

          <app-pagination
            [meta]="r.meta"
            (pageChange)="onPageChange($event)"
          />
        }

      }
    }

  </div>
`,
})
export class BlogListComponent {
  private readonly blog = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(PageSeoService);

  readonly result = signal<Paginated<BlogPost> | null>(null);
  readonly loading = signal(true);
  readonly skeletons = Array.from({ length: 6 });
  private page = 1;

  constructor() {
    this.seo.set({
      title: 'Installment Shopping Blog Pakistan',
      description: 'Guides on buying mobiles, laptops, bikes and appliances on easy monthly installments in Pakistan, without a credit card. Tips, comparisons and city guides from QistPY.',
      path: '/blog',
    });

    this.route.queryParamMap.subscribe((params) => {
      const p = params.get('page');
      this.page = p ? parseInt(p, 10) || 1 : 1;
      this.fetch();
    });
  }

  fetch(): void {
    this.loading.set(true);
    this.blog.list(this.page, 9).subscribe({
      next: (res) => { this.result.set(res); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  onPageChange(page: number): void {
    this.router.navigate([], { queryParams: { page }, queryParamsHandling: 'merge' });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
