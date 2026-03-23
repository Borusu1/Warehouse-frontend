import { render, waitFor } from '@testing-library/react-native';

import { HistoryScreen } from '@/src/features/history/screens/HistoryScreen';
import { useI18n } from '@/src/providers/LocaleProvider';
import { useWarehouseService } from '@/src/providers/WarehouseServiceProvider';
import { createMockI18n } from '@/test-utils/mockI18n';

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
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

describe('HistoryScreen', () => {
  it('shows operations from the service', async () => {
    mockedUseI18n.mockReturnValue(createMockI18n() as never);
    mockedUseWarehouseService.mockReturnValue({
      getOperations: jest.fn().mockResolvedValue([
        {
          id: 'op-1',
          type: 'stock-out',
          productId: 'product-1',
          quantityDelta: -2,
          quantityAfter: 16,
          note: 'Відвантаження на об’єкт.',
          actor: 'Warehouse Manager',
          createdAt: '2026-03-22T10:15:00.000Z',
        },
      ]),
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

    const { getAllByText, getByText } = render(<HistoryScreen />);

    await waitFor(() => {
      expect(getByText('Температурний сенсор')).toBeTruthy();
      expect(getAllByText('Відвантаження').length).toBeGreaterThan(0);
    });
  });
});
