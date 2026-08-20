export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  Token: string;
  Email: string;
  Roles: string[];
  Expiration: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantityInStock: number;
  supplier?: string;
  categoryId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  productCount: number;
}

export interface Transaction {
  id: number;
  productId: number;
  productName?: string;
  quantity: number;
  type: 'payment' | 'receipt';
  date: string;
  totalAmount: number;
  userId?: string;
}

export interface Payment {
  id: number;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  paymentDate: string;
  status: string;
}

export interface InventoryReport {
  totalStockValue: number;
  totalProducts: number;
  payments: ReportSummary;
  receipts: ReportSummary;
  topSellingProducts: TopProduct[];
}

export interface ReportSummary {
  count: number;
  totalAmount: number;
}

export interface TopProduct {
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface Alert {
  id: number;
  productId: number;
  productName: string;
  currentStock: number;
  threshold: number;
  alertDate: string;
}

export interface ApiUser {
  id: string;
  email: string;
  roles: string[];
}
