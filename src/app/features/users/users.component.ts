import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { StaggerService } from '../../core/services/stagger.service';
import { DashboardCacheService } from '../../core/services/dashboard-cache.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

interface AppUser {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  roles: string[];
  apiKey?: { isActive?: boolean; expiresAt?: string };
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, EmptyStateComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements AfterViewInit {
  users: AppUser[] = [];
  editing: AppUser | null = null;
  adding = false;
  fullName = '';
  email = '';
  phoneNumber = '';
  selectedRole: string | null = null;
  password = '';
  apiKeyExpiry = '';
  message = '';
  messageColor = 'var(--brick)';
  okColor = 'var(--teal)';
  errColor = 'var(--brick)';
  showModal = false;
  provisioningUser: AppUser | null = null;
  provisionExpiry = '';
  showProvisionModal = false;
  loading = false;
  loadError = '';
  isSuperAdmin = false;
  showSettingsModal = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showDeleteModal = false;
  deleteTargetId: string | null = null;
  deleteTargetName = '';
  private originalPayload: any = null;

  constructor(public api: ApiService, private cdr: ChangeDetectorRef, private toast: ToastService, private stagger: StaggerService, private cache: DashboardCacheService) {}

  ngOnInit(): void {
    this.cache.users$.subscribe({
      next: list => {
        const items = list ?? [];
        this.isSuperAdmin = items.some((u: any) => u.email === 'MarioMedhat899@gmail.com' && Array.isArray(u.roles) && u.roles.includes('Admin'));
        this.users = items.map((u: any) => ({
          id: String(u.id ?? u.userId ?? ''),
          email: u.email ?? '',
          fullName: u.fullName ?? '',
          phoneNumber: u.phoneNumber ?? '',
          roles: Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : []),
          apiKey: u.apiKey ? {
            isActive: u.apiKey.isActive ?? false,
            expiresAt: u.apiKey.expiresAt ?? u.apiKey.expiration ?? null
          } : null
        } as AppUser));
        this.loading = false;
        this.cdr.markForCheck();
        this.stagger.animate('tbody tr.stagger-item');
      },
      error: () => {
        this.users = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });

    this.cache.loading$.subscribe(loading => {
      this.loading = loading;
      this.cdr.markForCheck();
    });

    this.cache.error$.subscribe(err => {
      if (err) {
        this.loadError = err;
        this.cdr.markForCheck();
      }
    });
  }

  ngAfterViewInit() {
    this.stagger.animate('tbody tr.stagger-item');
  }

  private isDirty(current: any, original: any): boolean {
    if (!original) return true;
    return Object.keys(current).some(key => current[key] !== original[key]);
  }

  canAddUser(): boolean {
    return this.isSuperAdmin;
  }

  canManage(u: AppUser): boolean {
    if (u.email === 'MarioMedhat899@gmail.com') return false;
    return true;
  }

  isSecured(u: AppUser): boolean {
    return u.email === 'MarioMedhat899@gmail.com';
  }

  isAdmin(u: AppUser): boolean {
    return Array.isArray(u.roles) && u.roles.includes('Admin');
  }

  get managedUsers(): AppUser[] {
    return this.users.filter(u => !this.isSecured(u));
  }

  provisionTitle(): string {
    const email = this.provisioningUser?.email;
    return email ? 'Edit expiry: ' + email : 'Provision API key';
  }

  addNew(): void {
    this.showModal = true;
    this.adding = true;
    this.editing = null;
    this.fullName = '';
    this.email = '';
    this.phoneNumber = '';
    this.selectedRole = null;
    this.password = '';
    this.apiKeyExpiry = '';
    this.message = '';
    this.originalPayload = null;
  }

  edit(u: AppUser): void {
    this.showModal = true;
    this.adding = false;
    this.editing = u;
    this.fullName = u.fullName ?? '';
    this.email = u.email;
    this.phoneNumber = u.phoneNumber ?? '';
    this.selectedRole = u.roles?.[0] ?? null;
    this.password = '';
    this.message = '';
    this.originalPayload = {
      fullName: u.fullName ?? '',
      email: u.email,
      phoneNumber: u.phoneNumber ?? '',
      role: u.roles?.[0] ?? null,
      apiKeyExpiry: u.apiKey?.expiresAt ?? null
    };
  }

  closeModal(): void {
    this.showModal = false;
    this.adding = false;
    this.editing = null;
    this.fullName = '';
    this.email = '';
    this.phoneNumber = '';
    this.selectedRole = null;
    this.password = '';
    this.apiKeyExpiry = '';
    this.message = '';
  }

  openProvision(u: AppUser): void {
    this.provisioningUser = u;
    this.provisionExpiry = u.apiKey?.expiresAt ? new Date(u.apiKey.expiresAt).toISOString().slice(0, 16) : '';
    this.message = '';
    this.showProvisionModal = true;
  }

  closeProvision(): void {
    this.showProvisionModal = false;
    this.provisioningUser = null;
    this.provisionExpiry = '';
    this.message = '';
  }

  save(): void {
    this.message = '';
    const trimmedEmail = this.email.trim();
    const trimmedFullName = this.fullName.trim();
    if (!trimmedFullName) return this.setMessage('Full name is required.', this.errColor);
    if (!trimmedEmail) return this.setMessage('Email is required.', this.errColor);
    if (!this.selectedRole) return this.setMessage('Select a role.', this.errColor);

    const payload = {
      fullName: trimmedFullName,
      email: trimmedEmail,
      phoneNumber: this.phoneNumber.trim(),
      role: this.selectedRole,
      shareTenantWithUserId: undefined,
      isStandalone: false,
      apiKeyExpiry: this.apiKeyExpiry ? new Date(this.apiKeyExpiry).toISOString() : null,
      ...(this.adding ? { password: this.password || undefined } : {})
    } as any;

    if (this.adding) {
      this.api.createUser(payload).subscribe({
        next: (created: any) => {
          this.toast.show('User created.', 'success');
          const createdId = created?.id ?? created?.userId;
          if (createdId && this.apiKeyExpiry) {
            this.api.provisionUser(String(createdId), { expiresAtUtc: new Date(this.apiKeyExpiry).toISOString() }).subscribe({
              next: () => { this.closeModal(); },
              error: (err: any) => { this.toast.showError(err, 'User created, but key provisioning failed.'); this.closeModal(); }
            });
          } else {
            this.closeModal();
          }
        },
        error: (err: any) => this.toast.showError(err, 'Create failed.')
      });
    } else if (this.editing) {
      if (!this.isDirty(payload, this.originalPayload)) {
        this.setMessage('No changes detected.', this.errColor);
        return;
      }
      this.api.updateUser(this.editing.id, payload).subscribe({
        next: () => {
          this.toast.show('User updated.', 'success');
          this.closeModal();
          this.cdr.markForCheck();
        },
        error: (err: any) => this.toast.showError(err, 'Update failed.')
      });
    }
  }

  saveProvision(): void {
    this.message = '';
    if (!this.provisioningUser) return;
    const trimmed = this.provisionExpiry.trim();
    if (!trimmed) return this.setMessage('Expiry datetime is required.', this.errColor);

    this.api.provisionUser(this.provisioningUser.id, { expiresAtUtc: new Date(trimmed).toISOString() }).subscribe({
      next: () => { this.toast.show('API key saved.', 'success'); this.closeProvision(); },
      error: (err: any) => { this.toast.showError(err, 'Save failed.'); this.closeProvision(); }
    });
  }

  editKeyExpiry(u: AppUser): void {
    this.provisioningUser = u;
    this.provisionExpiry = u.apiKey?.expiresAt ? new Date(u.apiKey.expiresAt).toISOString().slice(0, 16) : '';
    this.message = '';
    this.showProvisionModal = true;
  }

  remove(id: string): void {
    const user = this.users.find(u => u.id === id);
    this.deleteTargetId = id;
    this.deleteTargetName = user?.fullName || user?.email || 'this user';
    this.showDeleteModal = true;
  }

  closeDelete(): void {
    this.showDeleteModal = false;
    this.deleteTargetId = null;
    this.deleteTargetName = '';
  }

  confirmDelete(): void {
    if (!this.deleteTargetId) return;
    const id = this.deleteTargetId;
    this.closeDelete();
    this.api.deleteUser(id).subscribe({
      next: () => { this.toast.show('User deleted.', 'success'); },
      error: (err: any) => { this.toast.showError(err, 'Delete failed.'); }
    });
  }

  openSettings(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.message = '';
    this.showSettingsModal = true;
  }

  saveSettings(): void {
    this.message = '';
    if (!this.newPassword || this.newPassword.length < 8) return this.setMessage('New password must be at least 8 characters.', this.errColor);
    if (this.newPassword !== this.confirmPassword) return this.setMessage('Passwords do not match.', this.errColor);
    if (!this.currentPassword) return this.setMessage('Current password is required.', this.errColor);

    this.api.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => { this.toast.show('Password changed.', 'success'); this.showSettingsModal = false; this.currentPassword = ''; this.newPassword = ''; this.confirmPassword = ''; },
      error: (err) => { this.toast.showError(err, 'Password change failed.'); }
    });
  }

  keyStatus(u: AppUser) {
    const key = u.apiKey;
    if (!key || !key.isActive) return { text: 'No active key', class: 'danger', meta: null };
    const expiresAt = key.expiresAt ? new Date(key.expiresAt) : null;
    if (!expiresAt) return { text: 'Active', class: 'ok', meta: 'No expiry' };
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffMs <= 0) return { text: 'Expired', class: 'danger', meta: `Expired ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago` };
    if (diffDays <= 7) return { text: 'Expiring soon', class: 'warn', meta: `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'}` };
    return { text: 'Active', class: 'ok', meta: `Expires in ${diffDays} days` };
  }

  keyExpiryText(u: AppUser): string | null {
    const expiresAt = u.apiKey?.expiresAt;
    if (!expiresAt) return null;
    return new Date(expiresAt).toLocaleString();
  }

  openProvisionForNewUser(email: string): void {
    this.provisioningUser = { id: '', email, fullName: email, roles: [] } as any;
    this.provisionExpiry = this.apiKeyExpiry ? new Date(this.apiKeyExpiry).toISOString().slice(0, 16) : '';
    this.showProvisionModal = true;
  }

  setMessage(text: string, color = this.errColor): void {
    this.message = text;
    this.messageColor = color;
  }
}
