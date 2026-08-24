import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { DashboardCacheService } from '../../core/services/dashboard-cache.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  email = '';
  password = '';
  error = '';
  loading = false;
  postLoginLoading = false;
  ticketNo = '';

  constructor(private api: ApiService, private router: Router, private el: ElementRef, private toast: ToastService, private dashboardCache: DashboardCacheService) {}

  ngOnInit() {
    this.ticketNo = String(Math.floor(1000 + Math.random() * 9000));
  }

  ngAfterViewInit() {
    // non-interactive login animation handled by CSS
  }

  submit() {
    this.error = '';
    this.loading = true;
    this.api.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        // Verify token was stored
        const storedToken = localStorage.getItem('ims_token');
        if (!storedToken) {
          this.error = 'Login failed: Token not stored. Please try again.';
          this.loading = false;
          this.toast.show('Login failed: token not stored.', 'error');
          return;
        }
        this.loading = false;
        this.postLoginLoading = true;
        this.dashboardCache.loadAll(this.api).subscribe({
          next: () => {
            this.postLoginLoading = false;
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.postLoginLoading = false;
            this.toast.show('We couldn’t load your workspace data. You can still open the app, but some sections may appear empty until they refresh.', 'error');
            this.router.navigate(['/dashboard']);
          }
        });
      },
      error: (err) => {
        this.error = err?.error?.Message || 'Invalid email or password';
        this.loading = false;
        this.toast.showError(err, 'Invalid email or password');
      },
      complete: () => (this.loading = false)
    });
  }
}