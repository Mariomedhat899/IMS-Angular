import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private api: ApiService, private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('ims_token');
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
