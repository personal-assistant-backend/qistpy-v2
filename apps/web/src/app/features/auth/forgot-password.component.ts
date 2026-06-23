import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';

type Step = 'phone' | 'otp' | 'reset' | 'done';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 gradient-hero">
      <div class="w-full max-w-md">
        <div class="text-center mb-6">
          <h1 class="text-2xl md:text-3xl">Reset your password</h1>
          <p class="text-muted text-sm mt-1">We'll send an OTP to your phone</p>
        </div>

        <div class="card p-6 md:p-8">
          @switch (step()) {
            @case ('phone') {
              <form (ngSubmit)="sendOtp()" #f="ngForm" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-ink mb-1.5">Phone Number</label>
                  <input type="tel" name="phone" [(ngModel)]="phone" required
                    placeholder="03001234567"
                    class="w-full px-4 py-2.5 rounded-xl border border-border bg-canvas
                           focus:outline-none focus:border-primary focus:bg-white text-sm"/>
                </div>
                @if (error()) {
                  <div class="rounded-xl bg-red-50 text-red-700 text-sm p-3 border border-red-200">
                    {{ error() }}
                  </div>
                }
                <button type="submit" class="btn-primary w-full btn-lg" [disabled]="loading() || !f.valid">
                  @if (loading()) { Sending... } @else { Send OTP }
                </button>
              </form>
            }

            @case ('otp') {
              <form (ngSubmit)="verifyOtp()" #f="ngForm" class="space-y-4">
                <p class="text-sm text-muted">Enter the 6-digit OTP sent to {{ phone }}</p>
                <input type="text" name="otp" [(ngModel)]="otp" required minlength="6" maxlength="6"
                  placeholder="123456"
                  class="w-full px-4 py-3 text-center text-xl font-bold tracking-widest tabular-nums rounded-xl border border-border bg-canvas focus:outline-none focus:border-primary focus:bg-white"/>
                @if (error()) {
                  <div class="rounded-xl bg-red-50 text-red-700 text-sm p-3 border border-red-200">{{ error() }}</div>
                }
                <button type="submit" class="btn-primary w-full btn-lg" [disabled]="loading() || !f.valid">
                  @if (loading()) { Verifying... } @else { Verify }
                </button>
              </form>
            }

            @case ('reset') {
              <form (ngSubmit)="reset()" #f="ngForm" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-ink mb-1.5">New Password</label>
                  <input type="password" name="newPassword" [(ngModel)]="newPassword" required minlength="8"
                    class="w-full px-4 py-2.5 rounded-xl border border-border bg-canvas focus:outline-none focus:border-primary focus:bg-white text-sm"/>
                </div>
                @if (error()) {
                  <div class="rounded-xl bg-red-50 text-red-700 text-sm p-3 border border-red-200">{{ error() }}</div>
                }
                <button type="submit" class="btn-primary w-full btn-lg" [disabled]="loading() || !f.valid">
                  @if (loading()) { Resetting... } @else { Reset Password }
                </button>
              </form>
            }

            @case ('done') {
              <div class="text-center py-6">
                <div class="w-16 h-16 rounded-full bg-success/10 text-success grid place-items-center mx-auto mb-4">
                  <app-icon name="check-circle" [size]="32" />
                </div>
                <h2 class="text-xl mb-2">Password Reset!</h2>
                <p class="text-sm text-muted mb-5">You can now log in with your new password.</p>
                <a routerLink="/login" class="btn-primary">Go to Login</a>
              </div>
            }
          }

          @if (step() !== 'done') {
            <div class="mt-6 pt-6 border-t border-border text-center">
              <a routerLink="/login" class="text-sm text-muted hover:text-primary">← Back to Login</a>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly step = signal<Step>('phone');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  phone = '';
  otp = '';
  newPassword = '';
  private resetToken = '';

  sendOtp(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.forgotRequestOtp(this.phone.trim()).subscribe({
      next: () => { this.loading.set(false); this.step.set('otp'); },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Could not send OTP');
      },
    });
  }

  verifyOtp(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.forgotVerifyOtp(this.phone.trim(), this.otp).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.resetToken = res.token;
        this.step.set('reset');
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Invalid OTP');
      },
    });
  }

  reset(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.forgotReset(this.resetToken, this.newPassword).subscribe({
      next: () => { this.loading.set(false); this.step.set('done'); },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Reset failed');
      },
    });
  }
}
