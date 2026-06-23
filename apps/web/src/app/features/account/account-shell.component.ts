import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent, IconName } from '../../shared/components/icon.component';

@Component({
  selector: 'app-account-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-qp py-8">
      <div class="grid md:grid-cols-4 gap-6">
        <aside class="card p-4 h-fit">
          <div class="mb-4 pb-4 border-b border-border">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white grid place-items-center font-heading font-bold">
                {{ initials() }}
              </div>
              <div class="min-w-0">
                <div class="font-semibold text-ink truncate">{{ auth.user()?.name || 'Customer' }}</div>
                <div class="text-xs text-muted truncate">{{ auth.user()?.phone }}</div>
              </div>
            </div>
          </div>
          <nav class="space-y-0.5">
            @for (link of links; track link.path) {
              <a [routerLink]="link.path" routerLinkActive="bg-primary-50 text-primary"
                 [routerLinkActiveOptions]="{ exact: link.exact }"
                 class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-canvas text-ink">
                <app-icon [name]="link.icon" [size]="16" />
                {{ link.label }}
              </a>
            }
            <button type="button" (click)="logout()"
                    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-red-50 text-red-600 mt-4">
              <app-icon name="x" [size]="16" /> Logout
            </button>
          </nav>
        </aside>

        <section class="md:col-span-3 min-w-0">
          <router-outlet />
        </section>
      </div>
    </div>
  `,
})
export class AccountShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly links: Array<{ path: string; label: string; icon: IconName; exact: boolean }> = [
    { path: '/account', label: 'Overview', icon: 'user', exact: true },
    { path: '/account/orders', label: 'My Orders', icon: 'package', exact: false },
    { path: '/account/installments', label: 'My Installments', icon: 'credit-card', exact: false },
    { path: '/account/addresses', label: 'Addresses', icon: 'map-pin', exact: false },
    { path: '/account/profile', label: 'Profile & Settings', icon: 'badge-check', exact: false },
    { path: '/account/notifications', label: 'Notifications', icon: 'phone', exact: false },
  ];

  initials(): string {
    const n = this.auth.user()?.name ?? 'QC';
    return n.split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase();
  }

  logout(): void {
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/']),
      error: () => this.router.navigate(['/']),
    });
  }
}
