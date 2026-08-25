import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Product, Category, Transaction, Payment, InventoryReport, Alert, AppUser } from '../models/ims.models';
import { Subscription } from 'rxjs';

export type DashboardSection = 'products' | 'categories' | 'transactions' | 'payments' | 'alerts' | 'report' | 'users';

@Injectable({ providedIn: 'root' })
export class DashboardCacheService {
  // Private state
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private paymentsSubject = new BehaviorSubject<Payment[]>([]);
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  private reportSubject = new BehaviorSubject<InventoryReport | null>(null);
  private usersSubject = new BehaviorSubject<AppUser[]>([]);
  private userEmailSubject = new BehaviorSubject<string | null>(null);
  private userRoleSubject = new BehaviorSubject<string | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private reloadSub: Subscription | null = null;

  // Public observables
  products$ = this.productsSubject.asObservable();
  categories$ = this.categoriesSubject.asObservable();
  transactions$ = this.transactionsSubject.asObservable();
  payments$ = this.paymentsSubject.asObservable();
  alerts$ = this.alertsSubject.asObservable();
  report$ = this.reportSubject.asObservable();
  users$ = this.usersSubject.asObservable();
  userEmail$ = this.userEmailSubject.asObservable();
  userRole$ = this.userRoleSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor() {}

  loadAll(api: ApiService): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.userEmailSubject.next(api.userEmail);
    this.userRoleSubject.next(api.userRole);

    return forkJoin({
      products: api.getProducts(),
      categories: api.getCategories(),
      transactions: api.getTransactions(),
      payments: api.getPayments(),
      alerts: api.getAlerts(),
      report: api.getReport(),
      users: api.getUsers()
    }).pipe(
      tap(data => {
        this.productsSubject.next(data.products ?? []);
        this.categoriesSubject.next(data.categories ?? []);
        this.transactionsSubject.next(data.transactions ?? []);
        this.paymentsSubject.next(data.payments ?? []);
        this.alertsSubject.next(data.alerts ?? []);
        this.reportSubject.next(data.report ?? null);
        this.usersSubject.next(data.users ?? []);
      }),
      catchError(err => {
        this.errorSubject.next(err.message ?? 'Failed to load dashboard data');
        return of(null);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  invalidate(): void {
    this.productsSubject.next([]);
    this.categoriesSubject.next([]);
    this.transactionsSubject.next([]);
    this.paymentsSubject.next([]);
    this.alertsSubject.next([]);
    this.reportSubject.next(null);
    this.usersSubject.next([]);
    this.userEmailSubject.next(null);
    this.userRoleSubject.next(null);
    this.errorSubject.next(null);
  }

  refreshSection(api: ApiService, section: DashboardSection): Observable<any> {
    this.errorSubject.next(null);

    switch (section) {
      case 'products':
        return api.getProducts().pipe(
          tap(data => this.productsSubject.next(data ?? [])),
          catchError(err => { this.errorSubject.next(err.message ?? `Failed to refresh ${section}`); return of([]); })
        );
      case 'categories':
        return api.getCategories().pipe(
          tap(data => this.categoriesSubject.next(data ?? [])),
          catchError(err => { this.errorSubject.next(err.message ?? `Failed to refresh ${section}`); return of([]); })
        );
      case 'transactions':
        return api.getTransactions().pipe(
          tap(data => this.transactionsSubject.next(data ?? [])),
          catchError(err => { this.errorSubject.next(err.message ?? `Failed to refresh ${section}`); return of([]); })
        );
      case 'payments':
        return api.getPayments().pipe(
          tap(data => this.paymentsSubject.next(data ?? [])),
          catchError(err => { this.errorSubject.next(err.message ?? `Failed to refresh ${section}`); return of([]); })
        );
      case 'alerts':
        return api.getAlerts().pipe(
          tap(data => this.alertsSubject.next(data ?? [])),
          catchError(err => { this.errorSubject.next(err.message ?? `Failed to refresh ${section}`); return of([]); })
        );
      case 'report':
        return api.getReport().pipe(
          tap(data => this.reportSubject.next(data ?? null)),
          catchError(err => { this.errorSubject.next(err.message ?? `Failed to refresh ${section}`); return of(null); })
        );
      case 'users':
        return this.loadUsers(api);
      default:
        return of(null);
    }
  }

  reloadAll(api: ApiService): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.reloadSub?.unsubscribe();
    this.reloadSub = forkJoin({
      products: api.getProducts().pipe(catchError(() => of([]))),
      categories: api.getCategories().pipe(catchError(() => of([]))),
      transactions: api.getTransactions().pipe(catchError(() => of([]))),
      payments: api.getPayments().pipe(catchError(() => of([]))),
      alerts: api.getAlerts().pipe(catchError(() => of([]))),
      report: api.getReport().pipe(catchError(() => of(null))),
      users: this.loadUsers(api).pipe(catchError(() => of([])))
    }).pipe(
      tap(data => {
        this.productsSubject.next(data.products ?? []);
        this.categoriesSubject.next(data.categories ?? []);
        this.transactionsSubject.next(data.transactions ?? []);
        this.paymentsSubject.next(data.payments ?? []);
        this.alertsSubject.next(data.alerts ?? []);
        this.reportSubject.next(data.report ?? null);
        this.usersSubject.next(data.users ?? []);
      }),
      catchError(() => of(void 0)),
      finalize(() => this.loadingSubject.next(false))
    ).subscribe();
  }

  loadUsers(api: ApiService): Observable<AppUser[]> {
    return api.getUsers().pipe(
      tap(data => this.usersSubject.next(data ?? [])),
      catchError(err => {
        this.errorSubject.next(err.message ?? 'Failed to load users');
        return of([]);
      })
    );
  }

  updateAfterCreate(section: DashboardSection, item: any): void {
    switch (section) {
      case 'products':
        this.productsSubject.next([...this.productsSubject.value, item]);
        break;
      case 'categories':
        this.categoriesSubject.next([...this.categoriesSubject.value, item]);
        break;
      case 'transactions':
        this.transactionsSubject.next([...this.transactionsSubject.value, item]);
        break;
      case 'payments':
        this.paymentsSubject.next([...this.paymentsSubject.value, item]);
        break;
      case 'alerts':
        this.alertsSubject.next([...this.alertsSubject.value, item]);
        break;
      case 'users':
        this.usersSubject.next([...this.usersSubject.value, item]);
        break;
    }
  }

  updateAfterUpdate(section: DashboardSection, item: any): void {
    switch (section) {
      case 'products':
        this.productsSubject.next(this.productsSubject.value.map((p: Product) => (p.id === item.id ? item : p)));
        break;
      case 'categories':
        this.categoriesSubject.next(this.categoriesSubject.value.map((c: Category) => (c.id === item.id ? item : c)));
        break;
      case 'transactions':
        this.transactionsSubject.next(this.transactionsSubject.value.map((t: Transaction) => (t.id === item.id ? item : t)));
        break;
      case 'payments':
        this.paymentsSubject.next(this.paymentsSubject.value.map((p: Payment) => (p.id === item.id ? item : p)));
        break;
      case 'alerts':
        this.alertsSubject.next(this.alertsSubject.value.map((a: Alert) => (a.id === item.id ? item : a)));
        break;
      case 'users':
        this.usersSubject.next(this.usersSubject.value.map((u: AppUser) => (u.id === item.id ? item : u)));
        break;
    }
  }

  updateAfterDelete(section: DashboardSection, id: number): void {
    switch (section) {
      case 'products':
        this.productsSubject.next(this.productsSubject.value.filter((p: Product) => p.id !== id));
        break;
      case 'categories':
        this.categoriesSubject.next(this.categoriesSubject.value.filter((c: Category) => c.id !== id));
        break;
      case 'transactions':
        this.transactionsSubject.next(this.transactionsSubject.value.filter((t: Transaction) => t.id !== id));
        break;
      case 'payments':
        this.paymentsSubject.next(this.paymentsSubject.value.filter((p: Payment) => p.id !== id));
        break;
      case 'alerts':
        this.alertsSubject.next(this.alertsSubject.value.filter((a: Alert) => a.id !== id));
        break;
      case 'users':
        this.usersSubject.next(this.usersSubject.value.filter((u: AppUser) => u.id !== String(id)));
        break;
    }
  }
}
