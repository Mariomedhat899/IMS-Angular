import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('ims_token');
  const email = localStorage.getItem('ims_email');

  if (!token) {
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });

  return next(cloned).pipe(
    catchError(err => {
      if (err.status === 401) {
        // Invalid token - clear auth state and let component handle navigation
        localStorage.removeItem('ims_token');
        localStorage.removeItem('ims_email');
        localStorage.removeItem('ims_role');
      }
      return throwError(() => err);
    })
  );
};