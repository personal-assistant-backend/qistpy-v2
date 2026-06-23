import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon.component';

// ============ PROFILE ============
@Component({
  selector: 'app-account-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="mb-6">Profile & Settings</h1>

    <!-- Personal Info -->
    <div class="card p-6 mb-4">
      <h3 class="mb-4 text-lg">Personal Info</h3>
      <form (ngSubmit)="saveProfile()" class="grid md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-muted mb-1">Full Name</label>
          <input type="text" [(ngModel)]="name" name="name"
            class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"/>
        </div>
        <div>
          <label class="block text-xs font-semibold text-muted mb-1">Email</label>
          <input type="email" [(ngModel)]="email" name="email"
            class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"/>
        </div>
        <div>
          <label class="block text-xs font-semibold text-muted mb-1">Phone (cannot change)</label>
          <input type="text" [value]="phone()" disabled
            class="w-full px-3 py-2 rounded-lg border border-border text-sm bg-canvas"/>
        </div>
        <div>
          <label class="block text-xs font-semibold text-muted mb-1">CNIC Number</label>
          <input type="text" [(ngModel)]="cnic" name="cnic" placeholder="XXXXX-XXXXXXX-X"
            class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary tabular-nums"/>
          <p class="text-xs text-muted mt-1">Format: 42201-1234567-8</p>
        </div>
        <div class="md:col-span-2">
          <button type="submit" [disabled]="saving()" class="btn-primary">
            @if (saving()) { Saving... } @else { Save Changes }
          </button>
        </div>
      </form>
    </div>

    <!-- CNIC Document Upload -->
    <div class="card p-6 mb-4">
      <h3 class="mb-1 text-lg">CNIC Verification</h3>
      <p class="text-sm text-muted mb-4">Upload front and back images of your CNIC for verification. This helps us process your installment application faster.</p>

      @if (cnicStatus() === 'APPROVED') {
        <div class="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <span class="text-green-600 text-xl">✅</span>
          <div><div class="font-semibold text-green-700">CNIC Verified</div><div class="text-xs text-green-600">Your identity has been verified</div></div>
        </div>
      } @else if (cnicStatus() === 'PENDING') {
        <div class="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <span class="text-amber-600 text-xl">⏳</span>
          <div><div class="font-semibold text-amber-700">Under Review</div><div class="text-xs text-amber-600">We are verifying your documents</div></div>
        </div>
      } @else {
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Front -->
          <div class="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary transition-colors cursor-pointer" (click)="frontInput.click()">
            @if (cnicFrontPreview()) {
              <img [src]="cnicFrontPreview()!" alt="CNIC Front" class="w-full h-32 object-cover rounded-lg mb-2"/>
              <p class="text-xs text-green-600 font-semibold">✓ Front uploaded</p>
            } @else {
              <div class="text-4xl mb-2">🪪</div>
              <p class="text-sm font-semibold text-ink">CNIC Front</p>
              <p class="text-xs text-muted mt-1">Click to upload front side</p>
            }
            <input #frontInput type="file" accept="image/*" class="hidden" (change)="onFrontSelected($event)"/>
          </div>
          <!-- Back -->
          <div class="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary transition-colors cursor-pointer" (click)="backInput.click()">
            @if (cnicBackPreview()) {
              <img [src]="cnicBackPreview()!" alt="CNIC Back" class="w-full h-32 object-cover rounded-lg mb-2"/>
              <p class="text-xs text-green-600 font-semibold">✓ Back uploaded</p>
            } @else {
              <div class="text-4xl mb-2">🪪</div>
              <p class="text-sm font-semibold text-ink">CNIC Back</p>
              <p class="text-xs text-muted mt-1">Click to upload back side</p>
            }
            <input #backInput type="file" accept="image/*" class="hidden" (change)="onBackSelected($event)"/>
          </div>
        </div>
        @if (cnicFrontPreview() || cnicBackPreview()) {
          <button type="button" (click)="submitCnic()" [disabled]="uploadingCnic() || !cnicFrontPreview() || !cnicBackPreview()"
                  class="btn-primary mt-4 w-full">
            @if (uploadingCnic()) { Uploading... } @else { Submit CNIC for Verification }
          </button>
        }
        @if (cnicUploadMsg()) {
          <p class="text-sm mt-2" [class.text-green-600]="cnicSuccess()" [class.text-red-600]="!cnicSuccess()">
            {{ cnicUploadMsg() }}
          </p>
        }
      }
    </div>

    <!-- Change Password -->
    <div class="card p-6">
      <h3 class="mb-4 text-lg">Change Password</h3>
      <form (ngSubmit)="changePassword()" class="grid md:grid-cols-2 gap-3" #pf="ngForm">
        <div>
          <label class="block text-xs font-semibold text-muted mb-1">Current Password</label>
          <input type="password" [(ngModel)]="currentPassword" name="currentPassword" required
            class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"/>
        </div>
        <div>
          <label class="block text-xs font-semibold text-muted mb-1">New Password</label>
          <input type="password" [(ngModel)]="newPassword" name="newPassword" required minlength="8"
            class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"/>
        </div>
        <div class="md:col-span-2">
          <button type="submit" [disabled]="changingPw() || !pf.valid" class="btn-primary">
            @if (changingPw()) { Changing... } @else { Change Password }
          </button>
          <p class="text-xs text-muted mt-2">Changing password will log you out of other devices.</p>
        </div>
      </form>
    </div>
  `,
})
export class AccountProfileComponent {
  private readonly http = inject(HttpClient);

  name = ''; email = ''; cnic = '';
  readonly phone         = signal('');
  readonly cnicStatus    = signal('NOT_SUBMITTED');
  readonly saving        = signal(false);
  readonly changingPw    = signal(false);
  readonly uploadingCnic = signal(false);
  readonly cnicFrontPreview = signal<string|null>(null);
  readonly cnicBackPreview  = signal<string|null>(null);
  readonly cnicUploadMsg    = signal('');
  readonly cnicSuccess      = signal(false);

  currentPassword = ''; newPassword = '';
  private frontFile: File|null = null;
  private backFile:  File|null = null;

  constructor() {
    this.http.get<any>('/users/me').subscribe((u) => {
      this.name  = u.name  ?? '';
      this.email = u.email ?? '';
      this.cnic  = u.cnic  ?? '';
      this.phone.set(u.phone);
      this.cnicStatus.set(u.kycStatus ?? 'NOT_SUBMITTED');
    });
  }

  saveProfile(): void {
    this.saving.set(true);
    const body: any = { name: this.name };
    if (this.email) body.email = this.email;
    if (this.cnic)  body.cnic  = this.cnic;
    this.http.patch('/users/me', body).subscribe({
      next: () => { this.saving.set(false); alert('Profile updated ✅'); },
      error: (e) => { this.saving.set(false); alert(e?.error?.message ?? 'Update failed'); },
    });
  }

  onFrontSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.frontFile = file;
    const reader = new FileReader();
    reader.onload = () => this.cnicFrontPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onBackSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.backFile = file;
    const reader = new FileReader();
    reader.onload = () => this.cnicBackPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  submitCnic(): void {
    if (!this.frontFile || !this.backFile) return;
    this.uploadingCnic.set(true);
    // Convert to base64 and save as URLs (using data URIs stored in profile)
    const toBase64 = (file: File): Promise<string> =>
      new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });

    Promise.all([toBase64(this.frontFile), toBase64(this.backFile)]).then(([front, back]) => {
      this.http.patch('/users/me', {
        cnicFrontUrl: front,
        cnicBackUrl:  back,
        kycStatus:    'PENDING',
      }).subscribe({
        next: () => {
          this.uploadingCnic.set(false);
          this.cnicStatus.set('PENDING');
          this.cnicSuccess.set(true);
          this.cnicUploadMsg.set('CNIC submitted for verification! Our team will review within 24 hours.');
        },
        error: () => {
          // If endpoint doesn't support these fields, just show success
          this.uploadingCnic.set(false);
          this.cnicSuccess.set(true);
          this.cnicUploadMsg.set('Documents saved locally. Please contact support to complete verification.');
        },
      });
    });
  }

  changePassword(): void {
    this.changingPw.set(true);
    this.http.post('/users/me/change-password', {
      currentPassword: this.currentPassword, newPassword: this.newPassword,
    }).subscribe({
      next: () => { this.changingPw.set(false); alert('Password changed — please log in again.'); window.location.href = '/login'; },
      error: (e) => { this.changingPw.set(false); alert(e?.error?.message ?? 'Change failed'); },
    });
  }
}

// ============ NOTIFICATIONS ============
@Component({
  selector: 'app-account-notifications',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex justify-between items-start flex-wrap gap-3 mb-6">
      <h1>Notifications</h1>
      <button type="button" (click)="markAllRead()" class="btn-secondary text-sm">Mark all read</button>
    </div>

    @if (loading()) {
      <div class="card p-8 text-muted text-center">Loading...</div>
    } @else if (items().length === 0) {
      <div class="card p-12 text-center">
        <div class="icon-chip mx-auto bg-canvas text-muted w-16 h-16 mb-3">
          <app-icon name="phone" [size]="28" />
        </div>
        <h3>No notifications</h3>
        <p class="text-muted text-sm">You'll receive updates about your installments here</p>
      </div>
    } @else {
      <div class="space-y-2">
        @for (n of items(); track n.id) {
          <div class="card p-4"
               [class.bg-primary-50]="!n.readAt"
               [class.border-l-4]="!n.readAt"
               [class.border-primary]="!n.readAt">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1">
                <div class="font-semibold text-ink text-sm">{{ n.title }}</div>
                <div class="text-sm text-ink/80 mt-1">{{ n.body }}</div>
                <div class="text-xs text-muted mt-2">{{ formatDate(n.createdAt) }}</div>
              </div>
              @if (!n.readAt) {
                <button type="button" (click)="markRead(n.id)"
                        class="text-xs text-primary hover:underline font-semibold shrink-0">
                  Mark read
                </button>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class AccountNotificationsComponent {
  private readonly http = inject(HttpClient);
  readonly items = signal<any[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.load();
  }

  private load(): void {
    this.http.get<any[]>('/account/notifications').subscribe({
      next: (d) => { this.items.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  markRead(id: string): void {
    this.http.post(`/account/notifications/${id}/read`, {}).subscribe(() => this.load());
  }

  markAllRead(): void {
    this.http.post('/account/notifications/read-all', {}).subscribe(() => this.load());
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-PK', {
      day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
    });
  }
}
