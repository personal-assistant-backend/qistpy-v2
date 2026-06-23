import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Brand, BlogPost, Category, ProductListItem } from '../../core/models/api.models';
import { BlogService } from '../../core/services/blog.service';
import { CatalogService } from '../../core/services/catalog.service';
import { formatPkr } from '../../core/services/currency';
import { getCategorySvg } from '../../core/services/product-image.service';
import { PageSeoService } from '../../core/services/seo.service';
import { IconComponent, IconName } from '../../shared/components/icon.component';
import { ProductCardComponent } from '../../shared/components/product-card.component';

// ── Hero slides ──────────────────────────────────────────────────────────────
interface HeroSlide {
  badge: string;
  headline: string;
  sub: string;
  cta: string;
  ctaLink: string;
  image: string;
  bg: string; // inline CSS background
}

const HERO_SLIDES: HeroSlide[] = [
  {
    badge: '🔥 Best Seller',
    headline: 'Samsung Galaxy S24 Ultra',
    sub: '200MP Camera · 12GB RAM · 5G — Now on 12-month installments',
    cta: 'Buy Now',
    ctaLink: '/product/samsung-galaxy-s24-ultra-12-256gb',
    image: 'https://fakeimg.pl/400x400/ffffff/17307A?text=Galaxy+S24+Ultra&font=bebas',
    bg: 'linear-gradient(135deg, #2346A0 0%, #17307A 100%)',
  },
  {
    badge: '🏍️ Top Pick',
    headline: 'Honda CG 125 — 2024 Model',
    sub: 'Pakistan\'s most trusted bike — lowest advance, easy monthly payments',
    cta: 'View Plans',
    ctaLink: '/product/honda-cg-125-2024',
    image: 'https://fakeimg.pl/400x400/ffffff/b91c1c?text=Honda+CG+125&font=bebas',
    bg: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
  },
  {
    badge: '💻 New Arrival',
    headline: 'HP Victus Gaming Laptop',
    sub: 'Core i7 RTX 4050 — Play anything, pay in installments',
    cta: 'Check Price',
    ctaLink: '/product/hp-victus-gaming-core-i7-rtx-4050',
    image: 'https://fakeimg.pl/400x400/ffffff/1a1a2e?text=HP+Victus&font=bebas',
    bg: 'linear-gradient(135deg, #166534 0%, #14532d 100%)',
  },
];

// ── Special Offer slides ──────────────────────────────────────────────────────
interface OfferSlide {
  tag: string;
  title: string;
  sub: string;
  advance: string;
  monthly: string;
  months: number;
  total: string;
  image: string;
  link: string;
  bg: string;
}

const OFFER_SLIDES: OfferSlide[] = [
  {
    tag: 'Special Offer',
    title: 'iPhone 15 Pro Max 256GB',
    sub: 'Starting from just Rs 49,899/month',
    advance: 'Rs 1,19,800', monthly: 'Rs 49,899', months: 12, total: 'Rs 7,18,588',
    image: 'https://fakeimg.pl/400x400/ffffff/1c1c1e?text=iPhone+15+Pro&font=bebas',
    link: '/shop/mobiles',
    bg: 'linear-gradient(135deg, #17307A 0%, #2346A0 100%)',
  },
  {
    tag: 'Ramadan Deal',
    title: 'Samsung 55" QLED Q60C',
    sub: 'Smart 4K TV — perfect for your lounge',
    advance: 'Rs 39,800', monthly: 'Rs 16,252', months: 9, total: 'Rs 1,86,068',
    image: 'https://fakeimg.pl/400x400/ffffff/1a202c?text=Samsung+55+QLED&font=bebas',
    link: '/shop/leds',
    bg: 'linear-gradient(135deg, #0d5c63 0%, #0f766e 100%)',
  },
  {
    tag: 'Summer Deal',
    title: 'Samsung 1.5 Ton WindFree AC',
    sub: 'Inverter technology — save electricity, stay cool',
    advance: 'Rs 39,800', monthly: 'Rs 16,252', months: 9, total: 'Rs 1,86,068',
    image: 'https://fakeimg.pl/400x400/ffffff/0c4a6e?text=Samsung+AC&font=bebas',
    link: '/shop/acs',
    bg: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="sr-only">Easy Installment Plan in Pakistan — Buy Mobile, Laptop, Bike & Home Appliances on Monthly Installments Without Credit Card. QistPY is based in Faisalabad, delivering nationwide.</h1>
    <!-- ═══════════════════ HERO + OFFER BANNERS ═══════════════════ -->
    <section class="bg-white border-b border-border">
      <div class="container-qp py-6 md:py-8">
        <div class="grid md:grid-cols-2 gap-4">

          <!-- LEFT: Main Hero Carousel -->
          <div class="relative overflow-hidden rounded-2xl min-h-[220px] md:min-h-[300px]"
               [style.background]="heroSlides()[heroIdx()].bg">
            @for (slide of heroSlides(); track $index) {
              @if ($index === heroIdx()) {
                <div class="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
                  <!-- pattern overlay -->
                  <div class="absolute inset-0 opacity-10 pointer-events-none overflow-hidden rounded-2xl">
                    <svg viewBox="0 0 200 200" class="w-full h-full">
                      <defs>
                        <pattern id="hero-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" stroke-width="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#hero-grid)" />
                    </svg>
                  </div>

                  <div class="relative z-10 flex gap-4 items-start">
                    <div class="flex-1">
                      <span class="inline-block text-xs font-bold px-2.5 py-1 rounded-full
                                   bg-white/20 text-white backdrop-blur mb-2">
                        {{ slide.badge }}
                      </span>
                      <h2 class="text-white font-heading font-bold text-xl md:text-2xl leading-tight">
                        {{ slide.headline }}
                      </h2>
                      <p class="text-white/80 text-xs md:text-sm mt-1 max-w-xs">
                        {{ slide.sub }}
                      </p>
                      <a [routerLink]="slide.ctaLink"
                         class="mt-4 inline-flex items-center gap-1.5 bg-white text-primary
                                px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/90 transition">
                        {{ slide.cta }}
                        <app-icon name="arrow-right" [size]="14"/>
                      </a>
                    </div>
                    <!-- Product image -->
                    <div class="shrink-0 w-28 h-28 md:w-40 md:h-40">
                      <img [src]="slide.image" [alt]="slide.headline" width="160" height="160"
                           class="w-full h-full object-contain drop-shadow-2xl"/>
                    </div>
                  </div>

                  <!-- Dots -->
                  <div class="relative z-10 flex gap-1.5 mt-3">
                    @for (s of heroSlides(); track $index) {
                      <span (click)="heroIdx.set($index)"
                            class="h-1.5 rounded-full transition-all cursor-pointer"
                            [class.w-5]="$index === heroIdx()"
                            [class.w-1]="$index !== heroIdx()"
                            [style.background]="$index === heroIdx() ? 'white' : 'rgba(255,255,255,0.4)'">
                      </span>
                    }
                  </div>
                </div>
              }
            }
          </div>

          <!-- RIGHT: Special Offers Carousel -->
          <div class="relative overflow-hidden rounded-2xl min-h-[220px] md:min-h-[300px]"
               [style.background]="offerSlides()[offerIdx()].bg">
            @for (slide of offerSlides(); track $index) {
              @if ($index === offerIdx()) {
                <div class="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
                  <div class="absolute inset-0 opacity-10 pointer-events-none overflow-hidden rounded-2xl">
                    <svg viewBox="0 0 200 200" class="w-full h-full">
                      <rect width="100%" height="100%" fill="url(#hero-grid)"/>
                    </svg>
                  </div>

                  <div class="relative z-10 flex gap-4 items-start">
                    <div class="flex-1">
                      <span class="inline-block text-xs font-bold px-2.5 py-1 rounded-full
                                   bg-white/20 text-white backdrop-blur mb-2">
                        🎁 {{ slide.tag }}
                      </span>
                      <h2 class="text-white font-heading font-bold text-base md:text-xl leading-tight">
                        {{ slide.title }}
                      </h2>
                      <p class="text-white/80 text-xs mt-1">{{ slide.sub }}</p>

                      <div class="mt-3 bg-white/15 backdrop-blur rounded-xl p-3 space-y-1 text-xs tabular-nums">
                        <div class="flex justify-between text-white/80">
                          <span>Advance</span>
                          <span class="font-bold text-white">{{ slide.advance }}</span>
                        </div>
                        <div class="flex justify-between text-white/80">
                          <span>Monthly × {{ slide.months }}</span>
                          <span class="font-bold text-white">{{ slide.monthly }}</span>
                        </div>
                        <div class="flex justify-between pt-1 border-t border-white/20">
                          <span class="text-white font-semibold">Total Payable</span>
                          <span class="font-bold text-accent">{{ slide.total }}</span>
                        </div>
                      </div>

                      <a [routerLink]="slide.link"
                         class="mt-3 inline-flex items-center gap-1.5 bg-white text-primary
                                px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/90 transition">
                        View Plan
                        <app-icon name="arrow-right" [size]="14"/>
                      </a>
                    </div>
                    <!-- Product image -->
                    <div class="shrink-0 w-24 h-24 md:w-36 md:h-36">
                      <img [src]="slide.image" [alt]="slide.title" width="144" height="144"
                           class="w-full h-full object-contain drop-shadow-2xl"/>
                    </div>
                  </div>

                  <!-- Dots -->
                  <div class="relative z-10 flex gap-1.5 mt-3">
                    @for (s of offerSlides(); track $index) {
                      <span (click)="offerIdx.set($index)"
                            class="h-1.5 rounded-full transition-all cursor-pointer"
                            [class.w-5]="$index === offerIdx()"
                            [class.w-1]="$index !== offerIdx()"
                            [style.background]="$index === offerIdx() ? 'white' : 'rgba(255,255,255,0.4)'">
                      </span>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════ TRUST STRIP ═══════════════════ -->
    <section class="border-b border-border bg-white">
      <div class="container-qp">
        <div class="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          @for (p of promises; track p.label) {
            <div class="flex items-center gap-3 py-4 px-4 md:px-6">
              <div class="icon-chip bg-primary/10 text-primary w-9 h-9 shrink-0">
                <app-icon [name]="p.icon" [size]="18"/>
              </div>
              <div>
                <div class="font-semibold text-ink text-sm">{{ p.label }}</div>
                <div class="text-xs text-muted">{{ p.sub }}</div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ═══════════════════ CATEGORIES ═══════════════════ -->
    <section class="py-10 md:py-14">
      <div class="container-qp">
        <div class="flex items-end justify-between mb-6">
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-primary mb-1">Browse</p>
            <h2 class="text-ink">Shop by Category</h2>
          </div>
          <a routerLink="/shop"
             class="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            View all <app-icon name="arrow-right" [size]="14"/>
          </a>
        </div>

        @if (categories().length) {
          <div class="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
            @for (cat of categories(); track cat.id) {
              <a [routerLink]="['/shop', cat.slug]"
                 class="flex flex-col items-center gap-2 group">
                <!-- Circle image — EasyQist style -->
                <div class="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-border
                             bg-white shadow-sm group-hover:border-primary group-hover:shadow-card-hover
                             group-hover:scale-110 transition-all duration-300">
                  <img [src]="catImg(cat)"
                       [alt]="cat.name"
                       width="64" height="64"
                       (error)="onCatImgError($event, cat)"
                       class="w-full h-full object-cover"
                       loading="lazy"/>
                </div>
                <span class="text-xs font-semibold text-ink group-hover:text-primary text-center leading-tight">
                  {{ cat.name }}
                </span>
              </a>
            }
          </div>
        } @else if (loading()) {
          <div class="grid grid-cols-4 md:grid-cols-8 gap-3">
            @for (_ of catSkeletons; track $index) {
              <div class="aspect-square rounded-2xl shimmer"></div>
            }
          </div>
        }
      </div>
    </section>

    <!-- ═══════════════════ BRAND STRIP ═══════════════════ -->
    @if (brands().length) {
      <section class="py-6 bg-canvas border-y border-border">
        <div class="container-qp">
          <p class="text-[10px] font-bold uppercase tracking-widest text-muted text-center mb-4">
            Trusted Brands
          </p>
          <div class="flex items-center justify-center gap-6 md:gap-12 flex-wrap">
            @for (brand of brands().slice(0, 8); track brand.id) {
              <a [routerLink]="['/shop']" [queryParams]="{ brandSlug: brand.slug }"
                 class="font-heading font-bold text-base md:text-xl text-muted
                        hover:text-ink transition-colors uppercase tracking-wide">
                {{ brand.name }}
              </a>
            }
          </div>
        </div>
      </section>
    }

    <!-- ═══════════════════ FEATURED PRODUCTS ═══════════════════ -->
    <section class="py-10 md:py-14">
      <div class="container-qp">
        <div class="flex items-end justify-between mb-6">
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-accent-dark mb-1">Latest</p>
            <h2 class="text-ink">Trending Products</h2>
          </div>
          <a routerLink="/shop"
             class="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            Browse all <app-icon name="arrow-right" [size]="14"/>
          </a>
        </div>

        @if (featuredProducts().length) {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            @for (product of featuredProducts(); track product.id) {
              <app-product-card [product]="product"/>
            }
          </div>
        } @else if (loading()) {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            @for (_ of prodSkeletons; track $index) {
              <div class="card h-80 shimmer rounded-xl"></div>
            }
          </div>
        } @else if (error()) {
          <div class="card p-8 text-center text-muted text-sm">
            Could not load products — make sure the API is running on
            <code class="bg-canvas px-1 rounded">http://192.168.25.13:3000</code>.
          </div>
        }
      </div>
    </section>

    <!-- ═══════════════════ HOW IT WORKS ═══════════════════ -->
    <section class="py-10 md:py-14 bg-gradient-to-br from-primary-50 via-white to-accent/5">
      <div class="container-qp">
        <div class="text-center mb-10">
          <p class="text-xs font-bold uppercase tracking-widest text-primary mb-1">Simple Process</p>
          <h2 class="text-ink">How It Works</h2>
          <p class="text-muted text-sm mt-2 max-w-xl mx-auto">
            No payments online. Just pick a product, submit your details — our agent will call you!
          </p>
        </div>

        <div class="grid md:grid-cols-4 gap-5 relative">
          <!-- connecting line desktop -->
          <div class="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5
                       bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"></div>

          @for (s of steps; track s.n) {
            <div class="card p-6 text-center relative z-10">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark
                           text-white grid place-items-center mx-auto mb-3 shadow-lg">
                <app-icon [name]="s.icon" [size]="28"/>
              </div>
              <div class="badge-primary mb-2 mx-auto w-fit">Step {{ s.n }}</div>
              <h3 class="text-sm font-heading font-bold text-ink">{{ s.title }}</h3>
              <p class="text-xs text-muted mt-1.5 leading-relaxed">{{ s.desc }}</p>
            </div>
          }
        </div>

        <!-- No hidden charges note -->
        <div class="mt-8 card p-4 bg-success/5 border border-success/30 text-center max-w-2xl mx-auto">
          <div class="flex items-center justify-center gap-2 text-sm text-success font-semibold">
            <app-icon name="shield" [size]="16"/>
            No payment online · No KYC documents needed · Our agent will call you
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════ TESTIMONIALS ═══════════════════ -->
    <section class="py-10 md:py-14">
      <div class="container-qp">
        <div class="text-center mb-8">
          <p class="text-xs font-bold uppercase tracking-widest text-success mb-1">Reviews</p>
          <h2 class="text-ink">What Our Customers Say</h2>
        </div>
        <div class="grid md:grid-cols-3 gap-4">
          @for (t of testimonials; track t.name) {
            <div class="card p-5">
              <div class="flex items-center gap-0.5 text-accent mb-3">
                @for (_ of five; track $index) {
                  <app-icon name="star" [size]="14"/>
                }
              </div>
              <p class="text-ink/80 text-sm leading-relaxed italic">"{{ t.text }}"</p>
              <div class="mt-4 flex items-center gap-3 pt-4 border-t border-border">
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark
                             text-white grid place-items-center font-heading font-bold text-sm shrink-0">
                  {{ t.initial }}
                </div>
                <div>
                  <div class="font-semibold text-ink text-sm">{{ t.name }}</div>
                  <div class="text-xs text-muted">{{ t.city }}</div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ═══════════════════ BLOG TEASER ═══════════════════ -->
    @if (blogPosts().length) {
      <section class="py-10 md:py-14 bg-canvas">
        <div class="container-qp">
          <div class="flex items-center justify-between mb-8">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-success mb-1">Guides</p>
              <h2 class="text-ink">From the Blog</h2>
            </div>
            <a routerLink="/blog" class="text-sm font-semibold text-primary hover:underline">View all</a>
          </div>
          <div class="grid md:grid-cols-3 gap-4">
            @for (post of blogPosts(); track post.id) {
              <a [routerLink]="['/blog', post.slug]" class="card overflow-hidden group hover:border-primary transition-colors">
                @if (post.coverImageUrl) {
                  <div class="aspect-[16/9] bg-white overflow-hidden">
                    <img [src]="post.coverImageUrl" [alt]="post.title" width="400" height="225" loading="lazy"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                  </div>
                }
                <div class="p-4">
                  <h3 class="font-heading font-bold text-ink text-sm leading-snug mb-1.5">{{ post.title }}</h3>
                  <p class="text-xs text-muted line-clamp-2">{{ post.excerpt }}</p>
                </div>
              </a>
            }
          </div>
        </div>
      </section>
    }

    <!-- ═══════════════════ CTA ═══════════════════ -->
    <section class="py-10 md:py-14">
      <div class="container-qp">
        <div class="relative overflow-hidden rounded-3xl
                     bg-gradient-to-br from-primary via-primary-dark to-ink
                     p-8 md:p-12 shadow-xl text-center">
          <div class="absolute -top-10 -right-10 w-48 h-48 bg-accent/30 rounded-full blur-3xl"></div>
          <div class="relative max-w-xl mx-auto text-white">
            <h2 class="text-white text-xl md:text-3xl font-heading font-bold">
              Ready to get started?
            </h2>
            <p class="mt-2 text-white/80 text-sm md:text-base">
              Sign up in 2 minutes. Pick a product. We'll call you — simple!
            </p>
            <div class="mt-6 flex gap-3 justify-center flex-wrap">
              <a routerLink="/signup" class="btn-accent btn-lg shadow-lg">
                Create Free Account
                <app-icon name="arrow-right" [size]="16"/>
              </a>
              <a routerLink="/how-it-works"
                 class="btn-lg bg-white/10 hover:bg-white/20 text-white border border-white/20">
                How it works
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly catalog = inject(CatalogService);
  private readonly http = inject(HttpClient);
  private readonly seo = inject(PageSeoService);
  private readonly blogSvc = inject(BlogService);

  readonly blogPosts = signal<BlogPost[]>([]);

  // Signals
  readonly categories      = signal<Category[]>([]);
  readonly brands          = signal<Brand[]>([]);
  readonly featuredProducts = signal<ProductListItem[]>([]);
  readonly loading         = signal(true);
  readonly error           = signal(false);

  // Carousel indexes
  readonly heroIdx  = signal(0);
  readonly offerIdx = signal(0);

  // Slide data — starts with built-in fallbacks, replaced once /banners responds
  readonly heroSlides  = signal<HeroSlide[]>(HERO_SLIDES);
  readonly offerSlides = signal<OfferSlide[]>(OFFER_SLIDES);

  private mapHeroSlides(rows: any[]): HeroSlide[] {
    const mapped = (rows ?? []).map((s: any) => ({
      badge: s.badge, headline: s.headline, sub: s.subtitle,
      cta: s.ctaText, ctaLink: s.ctaLink, image: s.imageUrl || HERO_SLIDES[s.position - 1]?.image,
      bg: `linear-gradient(135deg, ${s.bgColor} 0%, ${s.bgColor}cc 100%)`,
    })).filter((s: any) => s.headline);
    return mapped.length ? mapped : HERO_SLIDES;
  }

  private mapOfferSlides(rows: any[]): OfferSlide[] {
    const mapped = (rows ?? []).map((s: any) => ({
      tag: s.badge, title: s.headline, sub: s.subtitle,
      advance: s.advance || 'Rs 25,000', monthly: s.monthly || 'Rs 8,000',
      months: s.months || 6, total: s.total || 'Rs 75,000',
      image: s.imageUrl || OFFER_SLIDES[s.position - 1]?.image,
      link: s.ctaLink || '/shop',
      bg: `linear-gradient(135deg, ${s.bgColor} 0%, ${s.bgColor}cc 100%)`,
    })).filter((s: any) => s.title);
    return mapped.length ? mapped : OFFER_SLIDES;
  }

  // Skeleton arrays
  readonly catSkeletons  = Array.from({ length: 8 });
  readonly prodSkeletons = Array.from({ length: 8 });
  readonly five          = Array.from({ length: 5 });

  // Auto-rotate timers
  private heroTimer!:  ReturnType<typeof setInterval>;
  private offerTimer!: ReturnType<typeof setInterval>;

  readonly promises: Array<{ label: string; sub: string; icon: IconName }> = [
    { label: 'Free Delivery',   sub: 'All Pakistan',       icon: 'truck'       },
    { label: '100% Original',   sub: 'Verified products',  icon: 'badge-check' },
    { label: 'Agent Callback',  sub: 'No online payment',  icon: 'phone'       },
    { label: 'Secure Process',  sub: 'Your data is safe',  icon: 'shield'      },
  ];

  readonly steps: Array<{ n: number; title: string; desc: string; icon: IconName }> = [
    { n: 1, title: 'Choose Product',    desc: 'Browse categories, pick any product you like.', icon: 'tag'         },
    { n: 2, title: 'Select a Plan',     desc: '3, 6, 9 or 12 months — pick what fits you.',    icon: 'credit-card' },
    { n: 3, title: 'Submit Your Info',  desc: 'Fill your name, CNIC, city. Done!',              icon: 'user'        },
    { n: 4, title: 'Agent Calls You',   desc: 'Our team calls to confirm. Delivery arranged.',  icon: 'phone'       },
  ];

  readonly testimonials = [
    { initial: 'A', name: 'Ahmed Raza',   city: 'Lahore',
      text: 'Bohot aasaan process hai. Agent ne call kiya, saara kaam unhon ne kiya. iPhone ghar aa gaya 5 din mein!' },
    { initial: 'F', name: 'Fatima Khan',  city: 'Karachi',
      text: 'Koi online payment nahi, koi tension nahi. Sirf form bharo aur agent deal karta hai. Highly recommended!' },
    { initial: 'U', name: 'Usman Ali',    city: 'Islamabad',
      text: 'Laptop installment pe liya, process bilkul simple tha. Agent sahab ne sab samjha diya phone pe.' },
  ];

  readonly fmt = formatPkr;

  ngOnInit(): void {
    this.seo.set({
      title: 'Easy Installment Plan in Pakistan',
      description: 'Buy mobiles, laptops, bikes & home appliances on easy monthly installments across Pakistan. No credit card needed — buy now, pay later with QistPY.',
      path: '/',
    });
    this.seo.setJsonLd('organization-schema', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'QistPY',
      url: 'https://qistpy.com',
      description: "Pakistan's installment marketplace for mobiles, bikes, laptops, and home appliances. No credit card needed, agent-confirmed orders, based in Faisalabad and serving all of Pakistan.",
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Faisalabad',
        addressRegion: 'Punjab',
        addressCountry: 'PK',
      },
      areaServed: 'PK',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+92-300-724-4198',
        contactType: 'customer service',
        areaServed: 'PK',
      },
    });

    // Fetch live banners from the database so every browser/device sees the
    // same admin-saved hero and offer banners (previously read from localStorage).
    this.http.get<{ hero: any[]; offer: any[] }>('/banners').subscribe({
      next: (res) => {
        this.heroSlides.set(this.mapHeroSlides(res.hero));
        this.offerSlides.set(this.mapOfferSlides(res.offer));
      },
      error: () => {
        // Keep built-in fallback slides if the request fails.
      },
    });

    // Start auto-rotate (2 seconds per brief)
    this.heroTimer  = setInterval(() => {
      this.heroIdx.set((this.heroIdx() + 1) % HERO_SLIDES.length);
    }, 2000);

    this.offerTimer = setInterval(() => {
      this.offerIdx.set((this.offerIdx() + 1) % OFFER_SLIDES.length);
    }, 2000);

    // Fetch latest blog posts for the homepage teaser (silently skip if none yet).
    this.blogSvc.list(1, 3).subscribe({
      next: (res) => this.blogPosts.set(res.data),
      error: () => {},
    });

    // Load data
    forkJoin({
      categories: this.catalog.listCategories(),
      brands:     this.catalog.listBrands(),
      products:   this.catalog.listProducts({ pageSize: 8, sort: 'latest' }),
    }).subscribe({
      next: ({ categories, brands, products }) => {
        this.categories.set(categories);
        this.brands.set(brands);
        this.featuredProducts.set(products.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.heroTimer);
    clearInterval(this.offerTimer);
  }

  catIcon(slug: string): IconName {
    const m: Record<string, IconName> = {
      mobiles: 'smartphone', laptops: 'laptop', leds: 'tv',
      refrigerators: 'refrigerator', acs: 'snowflake',
      'washing-machines': 'washing-machine', microwaves: 'microwave', bikes: 'bike',
    };
    return m[slug] ?? 'package';
  }

  catImg(cat: Category): string {
    return cat.imageUrl || getCategorySvg(cat.name, cat.slug);
  }

  onCatImgError(event: Event, cat: Category): void {
    (event.target as HTMLImageElement).src = getCategorySvg(cat.name, cat.slug);
  }
}
