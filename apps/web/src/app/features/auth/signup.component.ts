import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';

type Step = 'phone' | 'otp' | 'complete';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 gradient-hero">
      <div class="w-full max-w-md">
        <div class="text-center mb-6">
          <a routerLink="/" class="inline-flex items-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark grid place-items-center shadow-lg">
              <span class="text-white font-heading font-bold text-2xl">Q</span>
            </div>
          </a>
          <h1 class="mt-4 text-2xl md:text-3xl">Create your account</h1>
          <p class="text-muted text-sm mt-1">Join thousands shopping on installments</p>
        </div>

        <!-- Progress dots -->
        <div class="flex items-center justify-center gap-2 mb-6">
          <span class="w-8 h-1.5 rounded-full transition-colors"
                [class.bg-primary]="step() === 'phone'"
                [class.bg-success]="step() !== 'phone'"></span>
          <span class="w-8 h-1.5 rounded-full transition-colors"
                [class.bg-primary]="step() === 'otp'"
                [class.bg-success]="step() === 'complete'"
                [class.bg-border]="step() === 'phone'"></span>
          <span class="w-8 h-1.5 rounded-full transition-colors"
                [class.bg-primary]="step() === 'complete'"
                [class.bg-border]="step() !== 'complete'"></span>
        </div>

        <div class="card p-6 md:p-8">
          @switch (step()) {
            @case ('phone') {
              <form (ngSubmit)="sendOtp()" #f="ngForm" class="space-y-4">
                <h2 class="text-lg">Step 1: Your phone</h2>
                <p class="text-sm text-muted -mt-3">We'll send you a 6-digit verification code</p>

                <div>
                  <label class="block text-sm font-medium text-ink mb-1.5">Phone Number</label>
                  <input type="tel" name="phone" [(ngModel)]="phone" required
                    placeholder="03001234567"
                    class="w-full px-4 py-2.5 rounded-xl border border-border bg-canvas
                           focus:outline-none focus:border-primary focus:bg-white text-sm"/>
                  <p class="text-xs text-muted mt-1">Format: 03XXXXXXXXX or +92XXXXXXXXXX</p>
                </div>

                @if (error()) {
                  <div class="rounded-xl bg-red-50 text-red-700 text-sm p-3 border border-red-200">
                    {{ error() }}
                  </div>
                }

                <button type="submit" class="btn-primary w-full btn-lg" [disabled]="loading()">
                  @if (loading()) { Sending OTP... } @else {
                    Send OTP <app-icon name="arrow-right" [size]="16" />
                  }
                </button>
              </form>
            }

            @case ('otp') {
              <form (ngSubmit)="verifyOtp()" #f="ngForm" class="space-y-4">
                <h2 class="text-lg">Step 2: Verify phone</h2>
                <p class="text-sm text-muted -mt-3">
                  Enter the 6-digit code sent to <strong>{{ phone }}</strong>
                </p>

                <!-- Dev mode hint -->
                <div class="rounded-xl bg-blue-50 text-blue-700 text-xs p-3 border border-blue-200">
                  💡 <strong>Dev mode:</strong> Check the backend terminal window (CMD where
                  <code>pnpm dev:api</code> is running) for a line like:<br/>
                  <code class="mt-1 block">SMS to {{ phone }}: "Your QistPY verification code is <strong>XXXXXX</strong>"</code>
                </div>

                <div>
                  <label class="block text-sm font-medium text-ink mb-1.5">6-Digit OTP</label>
                  <input type="text" name="code" [(ngModel)]="code"
                    required minlength="6" maxlength="6" inputmode="numeric"
                    placeholder="123456"
                    class="w-full px-4 py-3 text-center text-2xl font-heading font-bold tracking-[0.5em]
                           tabular-nums rounded-xl border border-border bg-canvas
                           focus:outline-none focus:border-primary focus:bg-white"/>
                </div>

                @if (error()) {
                  <div class="rounded-xl bg-red-50 text-red-700 text-sm p-3 border border-red-200">
                    {{ error() }}
                  </div>
                }

                <div class="flex gap-2">
                  <button type="button" (click)="step.set('phone')" class="btn-secondary flex-1">
                    ← Back
                  </button>
                  <button type="submit" class="btn-primary flex-1" [disabled]="loading() || code.length !== 6">
                    @if (loading()) { Verifying... } @else { Verify }
                  </button>
                </div>
                <button type="button" (click)="resendOtp()" [disabled]="loading()"
                        class="w-full text-xs text-muted hover:text-primary text-center">
                  Didn't receive? Resend OTP
                </button>
              </form>
            }

            @case ('complete') {
              <form (ngSubmit)="completeSignup()" #f="ngForm" class="space-y-4">
                <h2 class="text-lg">Step 3: Complete profile</h2>
                <p class="text-sm text-muted -mt-3">Almost done! Just a few details.</p>

                <div>
                  <label class="block text-sm font-medium text-ink mb-1.5">Full Name *</label>
                  <input type="text" name="name" [(ngModel)]="name" required minlength="2"
                    placeholder="Muhammad Khalid"
                    class="w-full px-4 py-2.5 rounded-xl border border-border bg-canvas
                           focus:outline-none focus:border-primary focus:bg-white text-sm"/>
                </div>

                <div>
                  <label class="block text-sm font-medium text-ink mb-1.5">CNIC (13 digits, no dashes) *</label>
                  <input type="text" name="cnic" [(ngModel)]="cnic"
                    required pattern="[0-9]{13}" minlength="13" maxlength="13"
                    inputmode="numeric" placeholder="3540112345678"
                    class="w-full px-4 py-2.5 rounded-xl border border-border bg-canvas
                           focus:outline-none focus:border-primary focus:bg-white text-sm tabular-nums"/>
                  <p class="text-xs text-muted mt-1">Example: 3540112345678 (no dashes)</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-ink mb-1.5">Password *</label>
                  <input type="password" name="password" [(ngModel)]="password"
                    required minlength="8"
                    placeholder="At least 8 characters"
                    class="w-full px-4 py-2.5 rounded-xl border border-border bg-canvas
                           focus:outline-none focus:border-primary focus:bg-white text-sm"/>
                  <p class="text-xs text-muted mt-1">Minimum 8 characters</p>
                </div>

                @if (error()) {
                  <div class="rounded-xl bg-red-50 text-red-700 text-sm p-3 border border-red-200">
                    {{ error() }}
                  </div>
                }

                <button type="submit" class="btn-primary w-full btn-lg"
                        [disabled]="loading() || !f.valid">
                  @if (loading()) { Creating account... } @else {
                    Create Account <app-icon name="check" [size]="16" />
                  }
                </button>
              </form>
            }
          }

          <div class="mt-6 pt-6 border-t border-border text-center">
            <p class="text-sm text-muted">
              Already have an account?
              <a routerLink="/login" class="text-primary font-semibold hover:underline ml-1">
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SignupComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  readonly step    = signal<Step>('phone');
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  phone    = '';
  code     = '';
  name     = '';
  cnic     = '';
  password = '';
  private signupToken = '';

  sendOtp(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.requestSignupOtp(this.phone.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.code = '';
        this.step.set('otp');
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Could not send OTP. Check phone number.');
      },
    });
  }

  resendOtp(): void {
    this.error.set(null);
    this.sendOtp();
  }

  verifyOtp(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.verifySignupOtp(this.phone.trim(), this.code).subscribe({
      next: (res) => {
        this.loading.set(false);
        // Backend returns { token, purpose } — we use token as signupToken
        this.signupToken = res.token;
        this.step.set('complete');
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Invalid OTP. Please try again.');
      },
    });
  }

  completeSignup(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.completeSignup({
      signupToken: this.signupToken,
      name:        this.name.trim(),
      password:    this.password,
      cnic:        this.cnic.trim(),
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/account']);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Signup failed. Please try again.');
      },
    });
  }
}
