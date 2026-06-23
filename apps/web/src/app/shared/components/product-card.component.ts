import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '../../core/models/api.models';
import { formatPkr } from '../../core/services/currency';
import { getProductSvg } from '../../core/services/product-image.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a [routerLink]="['/product', product.slug]"
       class="card-hover group block overflow-hidden relative">

      <!-- Wishlist button -->
      <button type="button" (click)="onWishlist($event)"
              class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur
                     shadow-sm grid place-items-center text-muted hover:text-accent hover:bg-white
                     transition-colors" aria-label="Add to wishlist">
        <app-icon name="heart" [size]="16"/>
      </button>

      <!-- Installment badge -->
      @if (product.lowestMonthly) {
        <div class="absolute top-3 left-3 z-10">
          <span class="badge-accent shadow-sm">
            <app-icon name="credit-card" [size]="10"/>
            On Installments
          </span>
        </div>
      }

      <!-- Image -->
      <div class="aspect-square bg-canvas overflow-hidden">
        <img [src]="imgSrc()"
             [alt]="product.name"
             width="300" height="300"
             loading="lazy"
             (error)="onImgError()"
             class="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"/>
      </div>

      <!-- Info -->
      <div class="p-4">
        <div class="flex items-center gap-1.5 mb-2 flex-wrap">
          @if (product.brand) {
            <span class="badge-primary">{{ product.brand.name }}</span>
          }
          <span class="text-[10px] text-muted uppercase tracking-wide font-medium">
            {{ product.category.name }}
          </span>
        </div>

        <h3 class="font-heading font-semibold text-ink text-sm md:text-[15px] leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
          {{ product.name }}
        </h3>

        <div class="flex items-center gap-0.5 text-accent mt-2">
          @for (_ of five; track $index) { <app-icon name="star" [size]="12"/> }
          <span class="text-[11px] text-muted ml-1">(4.8)</span>
        </div>

        <div class="mt-3 space-y-1.5">
          @if (product.lowestAdvance) {
            <div class="flex items-baseline gap-1.5 tabular-nums">
              <span class="text-[11px] text-muted font-medium">Advance:</span>
              <span class="font-heading font-bold text-primary text-base">
                {{ fmt(product.lowestAdvance) }}
              </span>
            </div>
          }
          @if (product.lowestMonthly) {
            <div class="flex items-baseline gap-1.5 tabular-nums">
              <span class="text-[11px] text-muted font-medium">Monthly from:</span>
              <span class="font-semibold text-ink text-sm">{{ fmt(product.lowestMonthly) }}</span>
            </div>
          }
          <div class="flex items-baseline justify-between pt-2 border-t border-border mt-2 tabular-nums">
            <span class="text-[11px] text-muted">Cash price</span>
            <span class="text-sm font-medium text-ink">{{ fmt(product.cashPrice) }}</span>
          </div>
        </div>
      </div>

      <!-- Hover CTA -->
      <div class="absolute inset-x-0 bottom-0 bg-primary text-white text-center py-2 text-sm font-semibold translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-1.5">
        View Details <app-icon name="arrow-right" [size]="14"/>
      </div>
    </a>
  `,
})
export class ProductCardComponent implements OnInit {
  @Input({ required: true }) product!: ProductListItem;

  readonly fmt  = formatPkr;
  readonly five = Array.from({ length: 5 });

  imgSrc = signal('');

  ngOnInit(): void {
    const url = this.product.images?.[0]?.url;
    this.imgSrc.set(url || this.fallback());
  }

  onImgError(): void {
    this.imgSrc.set(this.fallback());
  }

  private fallback(): string {
    return getProductSvg(
      this.product.name,
      this.product.brand?.slug ?? 'default',
      this.product.category.slug,
    );
  }

  onWishlist(e: Event): void { e.preventDefault(); e.stopPropagation(); }
}
