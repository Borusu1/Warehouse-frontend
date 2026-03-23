import { render, waitFor } from '@testing-library/react-native';

import { DashboardScreen } from '@/src/features/dashboard/screens/DashboardScreen';
import { useI18n } from '@/src/providers/LocaleProvider';
import { useWarehouseService } from '@/src/providers/WarehouseServiceProvider';
import { createMockI18n } from '@/test-utils/mockI18n';

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
}));

jest.mock('@/src/providers/LocaleProvider', () => ({
  useI18n: jest.fn(),
}));

jest.mock('@/src/providers/WarehouseServiceProvider', () => ({
  useWarehouseService: jest.fn(),
}));

const mockedUseI18n = jest.mocked(useI18n);
const mockedUseWarehouseService = jest.mocked(useWarehouseService);

describe('DashboardScreen', () => {
  it('renders metrics and recent activity', async () => {
    mockedUseI18n.mockReturnValue(createMockI18n() as never);
    mockedUseWarehouseService.mockReturnValue({
      getDashboardSummary: jest.fn().mockResolvedValue({
        totalProducts: 4,
        totalUnits: 58,
        lowStockCount: 1,
        outOfStockCount: 1,
        recentOperations: [
          {
            id: 'op-1',
            type: 'stock-in',
            productId: 'product-1',
            quantityDelta: 10,
            quantityAfter: 18,
            note: 'Нове надходження партії сенсорів.',
            actor: 'Warehouse Manager',
            createdAt: '2026-03-22T09:00:00.000Z',
          },
        ],
        syncStatus: 'local',
        lastUpdatedAt: '2026-03-22T09:00:00.000Z',
      }),
      getProducts: jest.fn().mockResolvedValue([
        {
          id: 'product-1',
          name: 'Температурний сенсор',
          sku: 'SNS-1001',
          category: 'Сенсори',
          quantity: 18,
          unit: 'шт',
          location: 'A-01',
          minStock: 6,
          status: 'inStock',
          notes: '',
          tags: [],
          updatedAt: '2026-03-22T09:00:00.000Z',
        },
      ]),
    } as never);

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText('Локальний mock-режим')).toBeTruthy();
      expect(getByText('Товарів')).toBeTruthy();
      expect(getByText('Нове надходження партії сенсорів.')).toBeTruthy();
    });
  });
});
