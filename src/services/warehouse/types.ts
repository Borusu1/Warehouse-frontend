import { AppSettings, UserSession } from '@/src/types/app';
import { DashboardSummary, Operation, Product } from '@/src/types/warehouse';

export type CreateProductInput = {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  minStock: number;
  notes: string;
  tags: string[];
};

export type ChangeStockInput = {
  productId: string;
  type: 'stock-in' | 'stock-out' | 'adjustment';
  quantity: number;
  note: string;
  actor: string;
  tagId?: string;
};

export interface WarehouseDataService {
  login(username: string, password: string): Promise<UserSession>;
  logout(): Promise<void>;
  getSession(): Promise<UserSession | null>;
  getSettings(): Promise<AppSettings>;
  updateSettings(input: Partial<AppSettings>): Promise<AppSettings>;
  getDashboardSummary(): Promise<DashboardSummary>;
  getProducts(): Promise<Product[]>;
  getProductById(productId: string): Promise<Product | null>;
  createProduct(input: CreateProductInput): Promise<Product>;
  changeStock(input: ChangeStockInput): Promise<Product>;
  getOperations(): Promise<Operation[]>;
  findProductByTagId(tagId: string): Promise<Product | null>;
}
