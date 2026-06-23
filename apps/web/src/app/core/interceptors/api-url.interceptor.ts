import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../environment';

/**
 * Rewrites relative URLs like `/products` to the configured API base.
 * Also ensures credentials are sent so httpOnly refresh cookie works.
 *
 * Calls that already start with http(s):// pass through untouched —
 * useful for loading images or third-party URLs from responses.
 */
export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const isAbsolute = /^https?:\/\//i.test(req.url);
  if (isAbsolute) return next(req);

  const normalizedPath = req.url.startsWith('/') ? req.url : `/${req.url}`;
  const target = `${environment.apiUrl}${normalizedPath}`;

  return next(
    req.clone({
      url: target,
      withCredentials: true, // send refresh cookie
    }),
  );
};
