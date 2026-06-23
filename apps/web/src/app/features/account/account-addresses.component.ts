import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { IconComponent } from '../../shared/components/icon.component';

interface City { id: string; name: string; slug: string }
interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  phone?: string | null;
  city: { id: string; name: string };
  isDefault: boolean;
}

@Component({
  selector: 'app-account-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex justify-between items-start flex-wrap gap-3 mb-6">
      <h1>Addresses</h1>
      <button type="button" (click)="startAdd()" class="btn-primary">
        <app-icon name="check" [size]="16"/> Add New
      </button>
    </div>

    @if (addresses().length === 0 && !editing()) {
      <div class="card p-12 text-center">
        <div class="icon-chip mx-auto bg-canvas text-muted w-16 h-16 mb-3">
          <app-icon name="map-pin" [size]="28"/>
        </div>
        <h3>No addresses saved</h3>
        <p class="text-muted text-sm mb-4">Add a delivery address to check out faster</p>
        <button type="button" (click)="startAdd()" class="btn-primary">Add Address</button>
      </div>
    }

    <!-- Add/Edit Form -->
    @if (editing()) {
      <div class="card p-6 mb-4">
        <h3 class="mb-4 text-lg">{{ form().id ? 'Edit' : 'New' }} Address</h3>
        <form (ngSubmit)="save()" #f="ngForm" class="grid md:grid-cols-2 gap-3">
          <!-- Label -->
          <div>
            <label class="block text-xs font-semibold text-muted mb-1">Label * (e.g. Home, Office)</label>
            <input type="text" name="label" [(ngModel)]="form().label" required
              maxlength="40" placeholder="Home"
              class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"/>
          </div>
          <!-- City -->
          <div>
            <label class="block text-xs font-semibold text-muted mb-1">City *</label>
            <select name="cityId" [(ngModel)]="form().cityId" required
              class="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:border-primary">
              <option value="">Select city</option>
              @for (c of cities(); track c.id) {
                <option [value]="c.id">{{ c.name }}</option>
              }
            </select>
          </div>
          <!-- Line 1 -->
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-muted mb-1">Address Line 1 *</label>
            <input type="text" name="line1" [(ngModel)]="form().line1" required
              placeholder="Street, house number, area"
              class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"/>
          </div>
          <!-- Line 2 -->
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-muted mb-1">Address Line 2 (Optional)</label>
            <input type="text" name="line2" [(ngModel)]="form().line2"
              placeholder="Near landmark, building name"
              class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"/>
          </div>
          <!-- Phone -->
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-muted mb-1">Contact Phone for Delivery (Optional)</label>
            <input type="tel" name="phone" [(ngModel)]="form().phone"
              placeholder="03001234567"
              class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"/>
            <p class="text-[11px] text-muted mt-1">Format: 03XXXXXXXXX (leave empty to use account phone)</p>
          </div>

          @if (error()) {
            <div class="md:col-span-2 rounded-lg bg-red-50 text-red-700 text-sm p-3 border border-red-200">
              {{ error() }}
            </div>
          }

          <div class="md:col-span-2 flex gap-2 mt-2">
            <button type="submit" [disabled]="saving() || !f.valid" class="btn-primary">
              @if (saving()) { Saving... } @else { Save Address }
            </button>
            <button type="button" (click)="cancel()" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    }

    <!-- Address cards -->
    <div class="grid md:grid-cols-2 gap-3">
      @for (a of addresses(); track a.id) {
        <div class="card p-5">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <app-icon name="map-pin" [size]="16" class="text-primary shrink-0"/>
              <span class="font-heading font-bold text-ink">{{ a.label }}</span>
              @if (a.isDefault) {
                <span class="badge-primary">Default</span>
              }
            </div>
          </div>
          <div class="text-sm text-ink/80 space-y-0.5">
            <div>{{ a.line1 }}</div>
            @if (a.line2) { <div>{{ a.line2 }}</div> }
            <div>{{ a.city.name }}</div>
            @if (a.phone) {
              <div class="flex items-center gap-1 text-muted text-xs mt-1">
                <app-icon name="phone" [size]="12"/>
                {{ a.phone }}
              </div>
            }
          </div>
          <div class="flex gap-3 mt-4 pt-4 border-t border-border">
            @if (!a.isDefault) {
              <button type="button" (click)="setDefault(a.id)"
                      class="text-xs text-primary font-semibold hover:underline">
                Set as default
              </button>
            }
            <button type="button" (click)="edit(a)"
                    class="text-xs text-ink hover:text-primary font-semibold">
              Edit
            </button>
            <button type="button" (click)="remove(a.id)"
                    class="text-xs text-red-600 hover:underline font-semibold">
              Delete
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class AccountAddressesComponent {
  private readonly http = inject(HttpClient);

  readonly addresses = signal<Address[]>([]);
  readonly cities    = signal<City[]>([]);
  readonly editing   = signal(false);
  readonly saving    = signal(false);
  readonly error     = signal<string | null>(null);
  readonly form      = signal<{
    id: string | null;
    label: string;
    line1: string;
    line2: string;
    cityId: string;
    phone: string;
  }>({ id: null, label: '', line1: '', line2: '', cityId: '', phone: '' });

  constructor() {
    forkJoin({
      addrs:  this.http.get<Address[]>('/users/me/addresses'),
      cities: this.http.get<City[]>('/cities'),
    }).subscribe(({ addrs, cities }) => {
      this.addresses.set(addrs);
      this.cities.set(cities);
    });
  }

  startAdd(): void {
    this.form.set({ id: null, label: '', line1: '', line2: '', cityId: '', phone: '' });
    this.error.set(null);
    this.editing.set(true);
  }

  edit(a: Address): void {
    this.form.set({
      id:     a.id,
      label:  a.label,
      line1:  a.line1,
      line2:  a.line2 ?? '',
      cityId: a.city.id,
      phone:  a.phone ?? '',
    });
    this.error.set(null);
    this.editing.set(true);
  }

  cancel(): void {
    this.editing.set(false);
    this.error.set(null);
  }

  save(): void {
    const body = this.form();
    // Build payload — only send fields backend expects
    const payload: Record<string, unknown> = {
      label:  body.label,
      line1:  body.line1,
      cityId: body.cityId,
    };
    if (body.line2?.trim()) payload['line2'] = body.line2.trim();
    if (body.phone?.trim()) payload['phone'] = body.phone.trim();

    this.saving.set(true);
    this.error.set(null);

    const req$ = body.id
      ? this.http.patch<Address>(`/users/me/addresses/${body.id}`, payload)
      : this.http.post<Address>('/users/me/addresses', payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.reload();
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(
          Array.isArray(e?.error?.message)
            ? e.error.message.join(', ')
            : (e?.error?.message ?? 'Save failed. Please check all fields.')
        );
      },
    });
  }

  setDefault(id: string): void {
    this.http.post(`/users/me/addresses/${id}/set-default`, {})
      .subscribe(() => this.reload());
  }

  remove(id: string): void {
    if (!confirm('Delete this address?')) return;
    this.http.delete(`/users/me/addresses/${id}`)
      .subscribe(() => this.reload());
  }

  private reload(): void {
    this.http.get<Address[]>('/users/me/addresses')
      .subscribe(a => this.addresses.set(a));
  }
}
