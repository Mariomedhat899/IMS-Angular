import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, Product, Category, Transaction, Payment, InventoryReport, Alert } from '../models/ims.models';

export const API_BASE = 'https://ims-api.runasp.net';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http: HttpClient;
  private router: Router;
  private tokenSubject = new BehaviorSubject<string | null>(null);
  token$ = this.tokenSubject.asObservable();
  private emailSubject = new BehaviorSubject<string | null>(null);
  private roleSubject = new BehaviorSubject<string | null>(null);
  userEmail$ = this.emailSubject.asObservable();
  userRole$ = this.roleSubject.asObservable();
  private logoutLoadingSubject = new BehaviorSubject<boolean>(false);
  get logoutLoading$() { return this.logoutLoadingSubject.asObservable(); }
  get userEmail(): string | null { return this.emailSubject.value; }
  get userRole(): string | null { return this.roleSubject.value; }

  constructor(http: HttpClient, router: Router) {
    this.http = http;
    this.router = router;
    const saved = localStorage.getItem('ims_token');
    if (saved) this.tokenSubject.next(saved);
    const savedEmail = localStorage.getItem('ims_email');
    if (savedEmail) this.emailSubject.next(savedEmail);
    const savedRole = localStorage.getItem('ims_role');
    if (savedRole) this.roleSubject.next(savedRole);
  }

  private authHeaders(): HttpHeaders {
    const token = this.tokenSubject.value;
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
  }

  logout() {
    this.logoutLoadingSubject.next(true);
    this.tokenSubject.next(null);
    this.emailSubject.next(null);
    this.roleSubject.next(null);
    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_email');
    localStorage.removeItem('ims_role');
    setTimeout(() => {
      this.logoutLoadingSubject.next(false);
      this.router.navigate(['/login']);
    }, 2000);
  }

  login(payload: LoginRequest) {
    return this.http.post<LoginResponse>(`${API_BASE}/api/Auth/Login`, payload).pipe(
      tap(res => {
        this.tokenSubject.next(res.Token);
        localStorage.setItem('ims_token', res.Token);
        if (res.Email) {
          this.emailSubject.next(res.Email);
          localStorage.setItem('ims_email', res.Email);
        }
        const role = Array.isArray(res.Roles) && res.Roles.length ? res.Roles[0] : 'Admin';
        this.roleSubject.next(role);
        localStorage.setItem('ims_role', role);
      }),
      catchError(err => throwError(() => err))
    );
  }

  getProducts() {
    return this.http.get<Product[]>(`${API_BASE}/api/Products`, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  createProduct(payload: { name: string; description?: string; price: number; quantityInStock: number; supplier?: string; categoryId: number }) {
    return this.http.post<Product>(`${API_BASE}/api/Products`, payload, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  updateProduct(id: number, payload: { name: string; description?: string; price: number; quantityInStock: number; supplier?: string; categoryId: number }) {
    return this.http.put<Product>(`${API_BASE}/api/Products/${id}`, payload, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  deleteProduct(id: number) {
    return this.http.delete(`${API_BASE}/api/Products/${id}`, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  getCategories() {
    return this.http.get<Category[]>(`${API_BASE}/api/Categories`, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  createCategory(payload: { name: string; description?: string }) {
    return this.http.post<Category>(`${API_BASE}/api/Categories`, payload, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  updateCategory(id: number, payload: { name: string; description?: string }) {
    return this.http.put<Category>(`${API_BASE}/api/Categories/${id}`, payload, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  deleteCategory(id: number) {
    return this.http.delete(`${API_BASE}/api/Categories/${id}`, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  getTransactions() {
    return this.http.get<Transaction[]>(`${API_BASE}/api/Transactions`, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  createTransaction(tx: { productId: number; quantity: number; type: string }) {
    return this.http.post<Transaction>(`${API_BASE}/api/Transactions`, tx, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  getPayments() {
    return this.http.get<Payment[]>(`${API_BASE}/api/Payments`, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  createPayment(payload: { amount: number; paymentMethod: string; transactionReference: string }) {
    return this.http.post<Payment>(`${API_BASE}/api/Payments`, payload, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  updatePayment(id: number, payload: { amount: number; status: string; paymentMethod: string; transactionReference: string }) {
    return this.http.put<Payment>(`${API_BASE}/api/Payments/${id}`, payload, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  deletePayment(id: number) {
    return this.http.delete(`${API_BASE}/api/Payments/${id}`, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  getReport() {
    return this.http.get<InventoryReport>(`${API_BASE}/api/Reports`, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  getAlerts() {
    return this.http.get<Alert[]>(`${API_BASE}/api/LowStockAlerts`, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  setAlert(payload: { productId: number; threshold: number }) {
    return this.http.post(`${API_BASE}/api/LowStockAlerts`, payload, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  createUser(payload: { fullName: string; email: string; role: string; phoneNumber?: string; shareTenantWithUserId?: string; isStandalone: boolean; apiKeyExpiry?: string | null }) {
    return this.http.post<ApiUser>(`${API_BASE}/api/Users`, payload, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  updateUser(id: string, payload: { fullName: string; email: string; role: string; phoneNumber?: string; shareTenantWithUserId?: string; isStandalone: boolean }) {
    return this.http.put<ApiUser>(`${API_BASE}/api/Users/${id}`, payload, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  deleteUser(id: string) {
    return this.http.delete(`${API_BASE}/api/Users/${id}`, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  provisionUser(id: string, payload: { expiresAtUtc: string }) {
    return this.http.post(`${API_BASE}/api/Users/${id}/provision`, payload, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  changePassword(payload: { currentPassword: string; newPassword: string; targetUserId?: string }) {
    return this.http.put(`${API_BASE}/api/AdminSettings/profile`, payload, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  getUsers() {
    return this.http.get<ApiUser[]>(`${API_BASE}/api/users`, { headers: this.authHeaders() }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  exportProductsCsv() {
    return this.http.get(`${API_BASE}/api/Products/export`, { headers: this.authHeaders(), responseType: 'text' }).pipe(
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }

  importProductsCsv(csv: string) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const form = new FormData();
    form.append('file', blob, 'products_import.csv');
    return this.http.post(`${API_BASE}/api/Products/import`, form, { headers: this.authHeaders() }).pipe(
      map(() => true),
      catchError(err => { if (err.status === 401) this.logout(); return throwError(() => err); })
    );
  }
}

interface ApiUser {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  roles: string[];
  apiKey?: { isActive?: boolean; expiresAt?: string };
}
