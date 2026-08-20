import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('ims_token');
  if (!token) return next(req);
  const cloned = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
  return next(cloned).pipe(
    catchError(err => {
      if (err.status === 401) {
        localStorage.removeItem('ims_token');
      }
      return throwError(() => err);
    })
  );
};
