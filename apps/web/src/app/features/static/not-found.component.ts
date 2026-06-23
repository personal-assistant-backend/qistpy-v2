import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageSeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-http-status="404" style="display:none"></div>
    <div class="container-qp py-20 text-center">
      <div class="text-6xl mb-4">🔍</div>
      <h1 class="text-2xl md:text-3xl font-heading font-bold text-ink mb-2">Page Not Found</h1>
      <p class="text-muted text-sm mb-6 max-w-md mx-auto">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <a routerLink="/" class="btn-primary">Back to Homepage</a>
    </div>
  `,
})
export class NotFoundComponent {
  private readonly seo = inject(PageSeoService);

  constructor() {
    this.seo.set({
      title: 'Page Not Found',
      description: 'The page you are looking for could not be found on QistPY.',
    });
  }
}
