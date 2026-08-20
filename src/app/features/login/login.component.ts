import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

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

  constructor(private api: ApiService, private router: Router, private el: ElementRef) {}

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
      next: () => {
        this.loading = false;
        this.postLoginLoading = true;
        setTimeout(() => this.router.navigate(['/dashboard']), 2000);
      },
      error: (err) => {
        this.error = err?.error?.Message || 'Invalid email or password';
        this.loading = false;
      },
      complete: () => (this.loading = false)
    });
  }
}
