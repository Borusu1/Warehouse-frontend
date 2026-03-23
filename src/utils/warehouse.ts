import { ProductStatus } from '@/src/types/warehouse';

export function resolveProductStatus(quantity: number, minStock: number): ProductStatus {
  if (quantity <= 0) {
    return 'outOfStock';
  }

  if (quantity <= minStock) {
    return 'lowStock';
  }

  return 'inStock';
}
