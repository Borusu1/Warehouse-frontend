import { Product, ProductStatus } from '@/src/types/warehouse';
import { normalizeTagId } from '@/src/utils/tag';

export type InventoryFilter = 'all' | ProductStatus;

export function filterProducts(products: Product[], search: string, filter: InventoryFilter) {
  const normalizedSearch = normalizeTagId(search);

  return products.filter((product) => {
    const matchesFilter = filter === 'all' ? true : product.status === filter;
    const matchesSearch =
      !normalizedSearch ||
      normalizeTagId(product.name).includes(normalizedSearch) ||
      normalizeTagId(product.sku).includes(normalizedSearch) ||
      product.tags.some((tag) => normalizeTagId(tag.id).includes(normalizedSearch));

    return matchesFilter && matchesSearch;
  });
}
