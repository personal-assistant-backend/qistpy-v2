import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoOptions {
  title: string;
  description: string;
  image?: string;
  /** Path only, e.g. "/product/iphone-15-pro-max". Origin is added automatically. */
  path?: string;
}

const SITE_NAME = 'QistPY';
const SITE_ORIGIN = 'https://qistpy.com';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-default.jpg`;

/**
 * Sets document title, meta description, Open Graph, Twitter Card, and
 * canonical link for the active route. Call `.set()` from each page
 * component once its data has loaded (or immediately for static pages).
 *
 * Previously: no page in the app ever called Angular's Title/Meta services,
 * so every route shared the same static tags from index.html. This service
 * fixes that — see the SEO audit for details.
 */
@Injectable({ providedIn: 'root' })
export class PageSeoService {
  private readonly titleSvc = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  set(opts: SeoOptions): void {
    const fullTitle = opts.title.includes(SITE_NAME) ? opts.title : `${opts.title} — ${SITE_NAME}`;
    const url = opts.path ? `${SITE_ORIGIN}${opts.path}` : SITE_ORIGIN;
    const image = opts.image || DEFAULT_IMAGE;

    this.titleSvc.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: opts.description });

    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: opts.description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: opts.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setCanonical(url);
  }

  setCanonical(url: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /** Injects (or replaces) a JSON-LD <script> block identified by `id`. */
  setJsonLd(id: string, data: unknown): void {
    const existing = this.doc.getElementById(id);
    if (existing) existing.remove();

    const script = this.doc.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    this.doc.head.appendChild(script);
  }

  removeJsonLd(id: string): void {
    this.doc.getElementById(id)?.remove();
  }
}
