import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Input, OnChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageSeoService } from '../../core/services/seo.service';
import { IconComponent, IconName } from '../../shared/components/icon.component';

export type StaticPageKey =
  | 'about'
  | 'contact'
  | 'faqs'
  | 'terms'
  | 'privacy'
  | 'how-it-works';

interface Faq { q: string; a: string }

@Component({
  selector: 'app-static-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- HOW IT WORKS -->
    @if (page === 'how-it-works') {
      <section class="gradient-hero py-12 md:py-16">
        <div class="container-qp text-center">
          <div class="badge-primary mb-2 mx-auto w-fit">Simple Process</div>
          <h1 class="mb-3">How QistPY Works</h1>
          <p class="text-muted max-w-xl mx-auto">Get your favorite product in 4 easy steps. Fast approval, flexible plans, free delivery nationwide.</p>
        </div>
      </section>
      <section class="container-qp py-12">
        <div class="grid md:grid-cols-4 gap-5 mb-10">
          @for (s of howItWorksSteps; track s.n) {
            <div class="card p-6">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white grid place-items-center mb-3">
                <app-icon [name]="s.icon" [size]="26" />
              </div>
              <div class="badge-primary mb-2 w-fit">Step {{ s.n }}</div>
              <h3 class="text-base">{{ s.title }}</h3>
              <p class="text-sm text-muted mt-2">{{ s.desc }}</p>
            </div>
          }
        </div>
        <div class="card p-8 text-center bg-gradient-to-br from-primary-50 to-accent/10">
          <h2 class="mb-3">Ready to get started?</h2>
          <p class="text-muted text-sm mb-5">Create your account in under 2 minutes.</p>
          <div class="flex gap-3 justify-center flex-wrap">
            <a routerLink="/signup" class="btn-primary">Sign Up</a>
            <a routerLink="/shop" class="btn-secondary">Browse Products</a>
          </div>
        </div>
      </section>
    }

    <!-- ABOUT -->
    @if (page === 'about') {
      <section class="gradient-hero py-12 md:py-16">
        <div class="container-qp">
          <h1 class="mb-3">About QistPY</h1>
          <p class="text-muted max-w-2xl">Pakistan's installment marketplace, based in Faisalabad — making premium products accessible to everyone, no credit card required.</p>
        </div>
      </section>
      <section class="container-qp py-10 md:py-16">
        <div class="grid md:grid-cols-2 gap-10 items-start">
          <div class="prose text-ink/80 space-y-4 text-base leading-relaxed">
            <p>QistPY was founded in Faisalabad with a simple mission: make quality electronics, appliances, and vehicles affordable for every Pakistani family through flexible, easy monthly installment plans, no bank credit card required.</p>
            <p>We partner with verified vendors across Pakistan to bring you 100% original products, delivered free to your doorstep, with transparent installment plans that fit your budget. Pick a plan, our agent calls to confirm, buy now and pay later.</p>
            <p>No hidden charges. No complicated paperwork. Just simple, honest installments.</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="card p-5 text-center">
              <div class="text-3xl font-heading font-bold text-primary tabular-nums">50k+</div>
              <div class="text-xs text-muted">Happy Customers</div>
            </div>
            <div class="card p-5 text-center">
              <div class="text-3xl font-heading font-bold text-primary tabular-nums">10+</div>
              <div class="text-xs text-muted">Cities Served</div>
            </div>
            <div class="card p-5 text-center">
              <div class="text-3xl font-heading font-bold text-primary tabular-nums">100%</div>
              <div class="text-xs text-muted">Original Products</div>
            </div>
            <div class="card p-5 text-center">
              <div class="text-3xl font-heading font-bold text-primary tabular-nums">4.8</div>
              <div class="text-xs text-muted">Avg Rating</div>
            </div>
          </div>
        </div>
      </section>
    }

    <!-- CONTACT -->
    @if (page === 'contact') {
      <section class="container-qp py-10 md:py-14">
        <h1 class="mb-3">Contact Us</h1>
        <p class="text-muted mb-8">We're here to help. Reach out anytime.</p>
        <div class="grid md:grid-cols-3 gap-4 mb-8">
          <div class="card p-5">
            <div class="icon-chip bg-primary/10 text-primary w-10 h-10 mb-3">
              <app-icon name="phone" [size]="18" />
            </div>
            <div class="font-semibold">Phone</div>
            <a href="tel:+923007244198" class="text-sm text-primary hover:underline">+92 300 724 4198</a>
          </div>
          <div class="card p-5">
            <div class="icon-chip bg-primary/10 text-primary w-10 h-10 mb-3">
              <app-icon name="mail" [size]="18" />
            </div>
            <div class="font-semibold">Email</div>
            <a href="mailto:hello&#64;qistpy.com" class="text-sm text-primary hover:underline">hello&#64;qistpy.com</a>
          </div>
          <div class="card p-5">
            <div class="icon-chip bg-success/10 text-success w-10 h-10 mb-3">
              <app-icon name="whatsapp" [size]="18" />
            </div>
            <div class="font-semibold">WhatsApp</div>
            <a href="https://wa.me/923007244198" target="_blank" class="text-sm text-primary hover:underline">Chat now</a>
          </div>
        </div>
        <div class="card p-6 max-w-2xl">
          <h3 class="mb-4 text-lg">Send us a message</h3>
          <form (ngSubmit)="submitContact()" #f="ngForm" class="space-y-3">
            <input type="text" name="name" [(ngModel)]="contactName" required placeholder="Your name"
              class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"/>
            <input type="email" name="email" [(ngModel)]="contactEmail" required placeholder="Email"
              class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"/>
            <textarea name="message" [(ngModel)]="contactMessage" required rows="4" placeholder="Your message"
              class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"></textarea>
            <button type="submit" class="btn-primary" [disabled]="!f.valid || submitting()">
              @if (submitting()) { Sending... } @else { Send Message }
            </button>
            @if (submitted()) {
              <div class="rounded-xl bg-success/10 text-success text-sm p-3">
                Thanks! We'll reply within 24 hours.
              </div>
            }
          </form>
        </div>
      </section>
    }

    <!-- FAQs -->
    @if (page === 'faqs') {
      <section class="container-qp py-10 md:py-14">
        <h1 class="mb-3">Frequently Asked Questions</h1>
        <p class="text-muted mb-8">Common questions about QistPY installments</p>
        <div class="space-y-3 max-w-3xl">
          @for (faq of faqs; track $index) {
            <details class="card p-5 group">
              <summary class="cursor-pointer font-semibold text-ink flex items-center justify-between">
                {{ faq.q }}
                <span class="text-muted group-open:rotate-90 transition-transform">
                  <app-icon name="chevron-right" [size]="16" />
                </span>
              </summary>
              <p class="text-sm text-ink/70 mt-3 leading-relaxed">{{ faq.a }}</p>
            </details>
          }
        </div>
      </section>
    }

    <!-- TERMS / PRIVACY - simple text pages -->
    @if (page === 'terms' || page === 'privacy') {
      <section class="container-qp py-10 md:py-14 max-w-3xl">
        <h1 class="mb-3">{{ page === 'terms' ? 'Terms of Service' : 'Privacy Policy' }}</h1>
        <p class="text-muted text-sm mb-8">Last updated: April 2026</p>
        <article class="space-y-5 text-ink/80 text-base leading-relaxed">
          @for (section of (page === 'terms' ? termsSections : privacySections); track $index) {
            <div>
              <h3 class="text-lg mb-2">{{ section.h }}</h3>
              <p>{{ section.p }}</p>
            </div>
          }
        </article>
      </section>
    }
  `,
})
export class StaticPageComponent implements OnChanges {
  @Input({ required: true }) page!: StaticPageKey;
  private readonly http = inject(HttpClient);
  private readonly seo = inject(PageSeoService);

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  contactName = '';
  contactEmail = '';
  contactMessage = '';

  private readonly seoMap: Record<StaticPageKey, { title: string; description: string }> = {
    'how-it-works': {
      title: 'How It Works',
      description: 'See how QistPY installments work in 4 simple steps. Pick a product, select a plan, submit your CNIC, get free delivery nationwide.',
    },
    about: {
      title: 'About Us',
      description: "QistPY is Pakistan's installment marketplace for mobiles, bikes, laptops, and home appliances. Based in Faisalabad, no credit card needed, 100% original products with free delivery nationwide.",
    },
    contact: {
      title: 'Contact Us',
      description: 'Get in touch with QistPY for help with your order, installment plan, or any questions. Call, WhatsApp, or email our support team.',
    },
    faqs: {
      title: 'Frequently Asked Questions',
      description: 'Answers to common questions about QistPY installment plans, delivery, payments, and how to buy mobiles, bikes, and appliances on easy monthly installments.',
    },
    terms: {
      title: 'Terms of Service',
      description: 'Read the QistPY Terms of Service covering installment plans, payments, returns, and account rules for using our marketplace.',
    },
    privacy: {
      title: 'Privacy Policy',
      description: 'Read how QistPY collects, uses, and protects your personal data, including CNIC verification and payment information.',
    },
  };

  ngOnChanges(): void {
    this.submitted.set(false);
    const meta = this.seoMap[this.page];
    if (meta) {
      this.seo.set({ title: meta.title, description: meta.description, path: `/${this.page}` });
    }
  }

  submitContact(): void {
    this.submitting.set(true);
    // No contact endpoint yet — simulate success.
    setTimeout(() => {
      this.submitting.set(false);
      this.submitted.set(true);
      this.contactName = this.contactEmail = this.contactMessage = '';
    }, 600);
  }

  readonly howItWorksSteps: Array<{ n: number; title: string; desc: string; icon: IconName }> = [
    { n: 1, title: 'Pick a Product', desc: 'Choose from 30+ products across mobiles, laptops, bikes, appliances.', icon: 'tag' },
    { n: 2, title: 'Select a Plan', desc: '3, 6, 9, or 12 months — you decide what fits your budget.', icon: 'credit-card' },
    { n: 3, title: 'Submit CNIC', desc: 'Quick verification with CNIC and selfie. Approved within 24 hours.', icon: 'shield' },
    { n: 4, title: 'Pay & Enjoy', desc: 'Pay your advance, get free delivery, then pay monthly installments.', icon: 'truck' },
  ];

  readonly faqs: Faq[] = [
    { q: 'How do installments work at QistPY?', a: 'Pick any product, choose a plan (3/6/9/12 months), pay a small advance, and receive the product. Pay the rest monthly.' },
    { q: 'Do I need a credit card to buy on installment?', a: 'No. QistPY does not require a bank credit card at all. You only need your CNIC. Our agent calls to confirm your order and you pay monthly through JazzCash, EasyPaisa, bank transfer, or Raast.' },
    { q: 'Are there any hidden charges?', a: 'No. The total you see during checkout is exactly what you pay. Markup is transparent and shown on every product page.' },
    { q: 'How long does approval take?', a: 'Most requests are approved within 24 hours. Vendors approve directly for their products; admin oversees the process.' },
    { q: 'What payment methods do you accept?', a: 'JazzCash, EasyPaisa, Bank Transfer, and Raast. Manual bank transfers are verified by admin within 24 hours.' },
    { q: 'What if I miss an installment?', a: 'You\'ll receive SMS + in-app reminders 3 days before each due date. Missed payments incur a late fee (flat Rs 500 + 1% of amount).' },
    { q: 'Can I cancel my order?', a: 'Yes — you can cancel for free before paying the advance. After advance payment, cancellation requires admin approval.' },
    { q: 'Do I need to submit CNIC?', a: 'Yes, CNIC verification is required once before your first installment. It\'s a one-time process.' },
    { q: 'Do you deliver to my city?', a: 'We deliver free across 10+ major cities including Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar, Multan, Sialkot, and more.' },
  ];

  readonly termsSections = [
    { h: '1. Acceptance', p: 'By using QistPY, you agree to these Terms of Service. If you don\'t agree, please don\'t use our platform.' },
    { h: '2. Eligibility', p: 'You must be at least 18 years old and a legal resident of Pakistan with a valid CNIC to use QistPY installments.' },
    { h: '3. Installment Plans', p: 'Installment plans create a legally binding payment obligation. You must pay all scheduled installments on their due dates.' },
    { h: '4. Late Payments', p: 'Late payments incur a flat Rs 500 + 1% of the installment amount. Accounts 60+ days overdue may be marked as defaulted and reported.' },
    { h: '5. Product Returns', p: 'Products may be returned within 7 days in original condition for a full refund of the advance paid.' },
    { h: '6. Account Termination', p: 'We reserve the right to suspend accounts that violate these terms, provide false information, or repeatedly default on installments.' },
    { h: '7. Disputes', p: 'Any disputes will be resolved through arbitration in Faisalabad, Pakistan, under Pakistani law.' },
  ];

  readonly privacySections = [
    { h: '1. What We Collect', p: 'We collect your name, phone number, email, CNIC, address, and payment information to provide our services. We never sell your data.' },
    { h: '2. How We Use It', p: 'Your data is used for account management, installment verification, delivery, customer support, and fraud prevention.' },
    { h: '3. CNIC Verification', p: 'Your CNIC is encrypted, stored securely, and only used for one-time identity verification. Only masked portions are shown in your profile.' },
    { h: '4. Data Sharing', p: 'We share data only with: vendors (for fulfillment), payment gateways (JazzCash, EasyPaisa), and delivery partners. Never third-party advertisers.' },
    { h: '5. Data Retention', p: 'Account data is retained while your account is active. Deleted accounts are purged after 90 days except for legal/financial records required by law.' },
    { h: '6. Your Rights', p: 'You can request data export, correction, or deletion by contacting support at hello@qistpy.com.' },
    { h: '7. Security', p: 'All data is encrypted in transit (HTTPS) and at rest. Passwords are hashed with bcrypt. Payment information is never stored on our servers.' },
  ];
}
