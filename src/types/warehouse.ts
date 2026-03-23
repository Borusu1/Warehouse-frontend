export type ProductStatus = 'inStock' | 'lowStock' | 'outOfStock';

export type ProductTag = {
  id: string;
  boundAt: string;
  note?: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  minStock: number;
  status: ProductStatus;
  notes: string;
  tags: ProductTag[];
  updatedAt: string;
};

export type OperationType = 'created' | 'stock-in' | 'stock-out' | 'adjustment';

export type Operation = {
  id: string;
  type: OperationType;
  productId: string;
  quantityDelta: number;
  quantityAfter: number;
  note: string;
  actor: string;
  createdAt: string;
  tagId?: string;
};

export type DashboardSummary = {
  totalProducts: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentOperations: Operation[];
  syncStatus: 'local';
  lastUpdatedAt: string;
};
