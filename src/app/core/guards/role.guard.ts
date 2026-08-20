import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

const ROLE_ORDER = ['Admin', 'Manager', 'Staff'];

function hasRole(allowed: string[], roles: string[] | undefined): boolean {
  if (!roles || roles.length === 0) return false;
  const maxAllowed = Math.max(...allowed.map(r => ROLE_ORDER.indexOf(r)));
  const maxUser = Math.max(...roles.map(r => ROLE_ORDER.indexOf(r)));
  return maxUser <= maxAllowed;
}

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private api: ApiService, private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('ims_token');
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // roles are not persisted on client; use JWT decode minimally.
    // For now, rely on backend rejecting unauthorized requests.
    // Client gating can be enhanced after we parse JWT claims if needed.
    return true;
  }
}
