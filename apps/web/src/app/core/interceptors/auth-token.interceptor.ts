import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const token  = auth.token();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && auth.isLoggedIn()) {
        // Token expired — try refresh
        auth.refreshToken().subscribe({
          next: () => {},
          error: () => {
            // Refresh failed — logout and redirect
            auth.logout().subscribe();
            router.navigate(['/login']);
          },
        });
      }
      return throwError(() => err);
    }),
  );
};
