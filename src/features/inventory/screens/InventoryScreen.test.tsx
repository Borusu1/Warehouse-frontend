import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { InventoryScreen } from '@/src/features/inventory/screens/InventoryScreen';
import { useI18n } from '@/src/providers/LocaleProvider';
import { useWarehouseService } from '@/src/providers/WarehouseServiceProvider';
import { createMockI18n } from '@/test-utils/mockI18n';

const mockPush = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
}));

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

jest.mock('@/src/providers/LocaleProvider', () => ({
  useI18n: jest.fn(),
}));

jest.mock('@/src/providers/WarehouseServiceProvider', () => ({
  useWarehouseService: jest.fn(),
}));

const mockedUseI18n = jest.mocked(useI18n);
const mockedUseWarehouseService = jest.mocked(useWarehouseService);

describe('InventoryScreen', () => {
  it('filters products by tag search and opens a card', async () => {
    mockedUseI18n.mockReturnValue(createMockI18n() as never);
    mockedUseWarehouseService.mockReturnValue({
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
          tags: [{ id: 'TAG-A100', boundAt: '2026-03-15T08:30:00.000Z' }],
          updatedAt: '2026-03-22T09:00:00.000Z',
        },
        {
          id: 'product-2',
          name: 'Контролер шлюзу',
          sku: 'CTL-2200',
          category: 'Контролери',
          quantity: 4,
          unit: 'шт',
          location: 'B-04',
          minStock: 5,
          status: 'lowStock',
          notes: '',
          tags: [{ id: 'TAG-B220', boundAt: '2026-03-10T12:00:00.000Z' }],
          updatedAt: '2026-03-22T10:15:00.000Z',
        },
      ]),
    } as never);

    const { getByPlaceholderText, getByText, queryByText } = render(<InventoryScreen />);

    await waitFor(() => {
      expect(getByText('Температурний сенсор')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Пошук за назвою, SKU або ID мітки'), 'TAG-B220');

    await waitFor(() => {
      expect(getByText('Контролер шлюзу')).toBeTruthy();
      expect(queryByText('Температурний сенсор')).toBeNull();
    });

    fireEvent.press(getByText('Контролер шлюзу'));
    expect(mockPush).toHaveBeenCalled();
  });
});
