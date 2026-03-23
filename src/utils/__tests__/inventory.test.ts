import { initialProducts } from '@/src/services/warehouse/mockData';
import { filterProducts } from '@/src/utils/inventory';
import { normalizeTagId } from '@/src/utils/tag';
import { resolveProductStatus } from '@/src/utils/warehouse';

describe('inventory utils', () => {
  it('filters products by status and tag search', () => {
    const filtered = filterProducts(initialProducts, 'TAG-B220', 'lowStock');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('product-2');
  });

  it('normalizes tag identifiers consistently', () => {
    expect(normalizeTagId(' tag - 01 ')).toBe('TAG-01');
  });

  it('resolves product status from quantity and minimum stock', () => {
    expect(resolveProductStatus(0, 3)).toBe('outOfStock');
    expect(resolveProductStatus(3, 3)).toBe('lowStock');
    expect(resolveProductStatus(10, 3)).toBe('inStock');
  });
});
