import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpInterceptorFn } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ApplicationConfig } from '@angular/core';
import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { catchError, throwError } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      AuthInterceptor,
      (() => {
        const safeInterceptor: HttpInterceptorFn = (req, next) => {
          const token = typeof localStorage !== 'undefined' ? localStorage.getItem('ims_token') : null;
          if (!token) {
            return next(req);
          }

          const cloned = req.clone({
            setHeaders: { Authorization: 'Bearer ' + token }
          });

          return next(cloned).pipe(
            catchError(err => {
              if (err.status === 401) {
                if (typeof localStorage !== 'undefined') {
                  localStorage.removeItem('ims_token');
                  localStorage.removeItem('ims_email');
                  localStorage.removeItem('ims_role');
                }
              }
              return throwError(() => err);
            })
          );
        };
        return safeInterceptor;
      })()
    ])),
    provideAnimations()
  ]
};
