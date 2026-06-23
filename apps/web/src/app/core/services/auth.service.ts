import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';

export type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN';
export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AuthUser {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: UserRole;
  kycStatus: KycStatus;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

const TOKEN_KEY = 'qistpy:access';
const USER_KEY  = 'qistpy:user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http       = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser  = isPlatformBrowser(this.platformId);

  private readonly _user  = signal<AuthUser | null>(this.loadUser());
  private readonly _token = signal<string | null>(this.loadToken());

  readonly user       = this._user.asReadonly();
  readonly token      = this._token.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly role       = computed(() => this._user()?.role ?? null);

  requestSignupOtp(phone: string): Observable<{ message: string; expiresInMinutes: number }> {
    return this.http.post<{ message: string; expiresInMinutes: number }>(
      '/auth/signup/request-otp', { phone });
  }

  verifySignupOtp(phone: string, code: string): Observable<{ token: string; purpose: string }> {
    return this.http.post<{ token: string; purpose: string }>(
      '/auth/signup/verify-otp', { phone, code });
  }

  completeSignup(body: { signupToken: string; name: string; password: string; cnic: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/signup/complete', body)
      .pipe(tap((res) => this.persist(res)));
  }

  login(phone: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/login', { phone, password })
      .pipe(tap((res) => this.persist(res)));
  }

  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/refresh', {})
      .pipe(tap((res) => this.persist(res)));
  }

  logout(): Observable<{ message: string }> {
    this.clear();
    return this.http.post<{ message: string }>('/auth/logout', {});
  }

  forgotRequestOtp(phone: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/auth/forgot-password/request-otp', { phone });
  }

  forgotVerifyOtp(phone: string, code: string): Observable<{ token: string; purpose: string }> {
    return this.http.post<{ token: string; purpose: string }>(
      '/auth/forgot-password/verify-otp', { phone, code });
  }

  forgotReset(resetToken: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/auth/forgot-password/reset', { resetToken, newPassword });
  }

  private persist(res: LoginResponse): void {
    this._user.set(res.user);
    this._token.set(res.accessToken);
    if (this.isBrowser) {
      localStorage.setItem(TOKEN_KEY, res.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
  }

  private clear(): void {
    this._user.set(null);
    this._token.set(null);
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  private loadToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): AuthUser | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch { return null; }
  }
}
