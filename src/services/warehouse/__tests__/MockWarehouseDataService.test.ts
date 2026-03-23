import AsyncStorage from '@react-native-async-storage/async-storage';

import { MockWarehouseDataService } from '@/src/services/warehouse/MockWarehouseDataService';

describe('MockWarehouseDataService', () => {
  let service: MockWarehouseDataService;

  beforeEach(() => {
    service = new MockWarehouseDataService();
  });

  it('stores session after login and clears it on logout', async () => {
    const session = await service.login('demo', 'demo123');

    expect(session.username).toBe('demo');
    expect(await service.getSession()).toEqual(session);

    await service.logout();

    expect(await service.getSession()).toBeNull();
  });

  it('reads and updates settings through persistent storage', async () => {
    const initialSettings = await service.getSettings();
    expect(initialSettings.language).toBe('uk');

    const updatedSettings = await service.updateSettings({ language: 'en' });
    expect(updatedSettings.language).toBe('en');

    const storedSettings = await AsyncStorage.getItem('warehouse.settings');
    expect(storedSettings).toContain('"language":"en"');
  });

  it('creates a product with multiple tags and exposes it in search', async () => {
    const product = await service.createProduct({
      name: 'Тестовий товар',
      sku: 'TEST-01',
      category: 'Тести',
      quantity: 12,
      unit: 'шт',
      location: 'T-01',
      minStock: 3,
      notes: 'Новий товар',
      tags: ['tag-11', 'tag-12'],
    });

    expect(product.tags).toHaveLength(2);
    expect(product.status).toBe('inStock');

    const found = await service.findProductByTagId('TAG-12');
    expect(found?.id).toBe(product.id);
  });

  it('updates stock after partial shipment and writes operation history', async () => {
    const products = await service.getProducts();
    const targetProduct = products[0];

    const updatedProduct = await service.changeStock({
      productId: targetProduct.id,
      type: 'stock-out',
      quantity: 2,
      note: 'Часткове відвантаження',
      actor: 'Tester',
    });

    expect(updatedProduct.quantity).toBe(targetProduct.quantity - 2);

    const operations = await service.getOperations();
    expect(operations[0]).toMatchObject({
      productId: targetProduct.id,
      type: 'stock-out',
      quantityDelta: -2,
    });
  });

  it('throws when stock out exceeds the available quantity', async () => {
    const product = await service.getProductById('product-2');

    await expect(
      service.changeStock({
        productId: 'product-2',
        type: 'stock-out',
        quantity: (product?.quantity ?? 0) + 10,
        note: 'Неможлива операція',
        actor: 'Tester',
      })
    ).rejects.toThrow('INSUFFICIENT_STOCK');
  });

  it('builds dashboard summary from the current in-memory dataset', async () => {
    const summary = await service.getDashboardSummary();

    expect(summary.totalProducts).toBeGreaterThanOrEqual(4);
    expect(summary.lowStockCount).toBeGreaterThanOrEqual(1);
    expect(summary.outOfStockCount).toBeGreaterThanOrEqual(1);
    expect(summary.recentOperations.length).toBeGreaterThan(0);
  });
});
