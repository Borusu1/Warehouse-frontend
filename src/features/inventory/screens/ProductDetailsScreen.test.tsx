import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { ProductDetailsScreen } from '@/src/features/inventory/screens/ProductDetailsScreen';
import { useAuth } from '@/src/providers/AuthProvider';
import { useI18n } from '@/src/providers/LocaleProvider';
import { useWarehouseService } from '@/src/providers/WarehouseServiceProvider';
import { createMockI18n } from '@/test-utils/mockI18n';

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ productId: 'product-1' }),
}));

jest.mock('@/src/providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/src/providers/LocaleProvider', () => ({
  useI18n: jest.fn(),
}));

jest.mock('@/src/providers/WarehouseServiceProvider', () => ({
  useWarehouseService: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseI18n = jest.mocked(useI18n);
const mockedUseWarehouseService = jest.mocked(useWarehouseService);

describe('ProductDetailsScreen', () => {
  it('loads product details and submits stock actions', async () => {
    const changeStock = jest.fn().mockResolvedValue({
      id: 'product-1',
      name: 'Температурний сенсор',
      sku: 'SNS-1001',
      category: 'Сенсори',
      quantity: 16,
      unit: 'шт',
      location: 'A-01',
      minStock: 6,
      status: 'inStock',
      notes: 'Основний склад',
      tags: [{ id: 'TAG-A100', boundAt: '2026-03-15T08:30:00.000Z' }],
      updatedAt: '2026-03-23T10:00:00.000Z',
    });

    mockedUseAuth.mockReturnValue({
      session: { displayName: 'Warehouse Manager' },
    } as never);
    mockedUseI18n.mockReturnValue(createMockI18n() as never);
    mockedUseWarehouseService.mockReturnValue({
      getProductById: jest.fn().mockResolvedValue({
        id: 'product-1',
        name: 'Температурний сенсор',
        sku: 'SNS-1001',
        category: 'Сенсори',
        quantity: 18,
        unit: 'шт',
        location: 'A-01',
        minStock: 6,
        status: 'inStock',
        notes: 'Основний склад',
        tags: [{ id: 'TAG-A100', boundAt: '2026-03-15T08:30:00.000Z' }],
        updatedAt: '2026-03-22T09:00:00.000Z',
      }),
      getOperations: jest
        .fn()
        .mockResolvedValueOnce([
          {
            id: 'op-1',
            type: 'stock-in',
            productId: 'product-1',
            quantityDelta: 10,
            quantityAfter: 18,
            note: 'Надходження',
            actor: 'Warehouse Manager',
            createdAt: '2026-03-22T09:00:00.000Z',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'op-2',
            type: 'stock-out',
            productId: 'product-1',
            quantityDelta: -1,
            quantityAfter: 16,
            note: 'Часткове відвантаження',
            actor: 'Warehouse Manager',
            createdAt: '2026-03-23T10:00:00.000Z',
          },
        ]),
      changeStock,
    } as never);

    const { getAllByText, getByDisplayValue, getByText } = render(<ProductDetailsScreen />);

    await waitFor(() => {
      expect(getAllByText('Температурний сенсор').length).toBeGreaterThan(0);
    });

    fireEvent.changeText(getByDisplayValue('1'), '1');
    fireEvent.press(getByText('Застосувати'));

    await waitFor(() => {
      expect(changeStock).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'product-1',
          type: 'stock-out',
          quantity: 1,
        })
      );
    });
  });
});
