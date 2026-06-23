import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 gradient-hero">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-6">
          <a routerLink="/" class="inline-flex items-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark grid place-items-center shadow-lg">
              <span class="text-white font-heading font-bold text-2xl">Q</span>
            </div>
          </a>
          <h1 class="mt-4 text-2xl md:text-3xl">Welcome back</h1>
          <p class="text-muted text-sm mt-1">Log in to continue shopping on installments</p>
        </div>

        <div class="card p-6 md:p-8">
          <form (ngSubmit)="submit()" #f="ngForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-ink mb-1.5">Phone Number</label>
              <input
                type="tel"
                name="phone"
                [(ngModel)]="phone"
                required
                placeholder="+923001234567"
                class="w-full px-4 py-2.5 rounded-xl border border-border bg-canvas
                       focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20
                       text-sm"
              />
              <p class="text-xs text-muted mt-1">Format: +92XXXXXXXXXX or 03XXXXXXXXX</p>
            </div>

            <div>
              <div class="flex justify-between items-center mb-1.5">
                <label class="block text-sm font-medium text-ink">Password</label>
                <a routerLink="/forgot-password" class="text-xs font-semibold text-primary hover:underline">
                  Forgot?
                </a>
              </div>
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  name="password"
                  [(ngModel)]="password"
                  required
                  minlength="8"
                  placeholder="Your password"
                  class="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-canvas
                         focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20
                         text-sm"
                />
                <button type="button" (click)="showPassword.set(!showPassword())"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                  <app-icon name="user" [size]="16" />
                </button>
              </div>
            </div>

            @if (error()) {
              <div class="rounded-xl bg-red-50 text-red-700 text-sm p-3 border border-red-200">
                {{ error() }}
              </div>
            }

            <button type="submit" class="btn-primary w-full btn-lg" [disabled]="loading() || !f.valid">
              @if (loading()) {
                Logging in...
              } @else {
                Log In
                <app-icon name="arrow-right" [size]="16" />
              }
            </button>
          </form>

          <div class="mt-6 pt-6 border-t border-border text-center">
            <p class="text-sm text-muted">
              New to QistPY?
              <a routerLink="/signup" class="text-primary font-semibold hover:underline ml-1">
                Create an account
              </a>
            </p>
          </div>
        </div>

        <div class="mt-6 text-center text-xs text-muted">
          <p>By logging in, you agree to our
            <a routerLink="/terms" class="text-primary hover:underline">Terms</a> and
            <a routerLink="/privacy" class="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  phone = '';
  password = '';
  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.phone.trim(), this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        // Route based on role
        const role = res.user.role;
        if (role === 'ADMIN') this.router.navigate(['/admin']);
        else if (role === 'VENDOR') this.router.navigate(['/vendor']);
        else this.router.navigate(['/account']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Login failed. Please check your credentials.');
      },
    });
  }
}
