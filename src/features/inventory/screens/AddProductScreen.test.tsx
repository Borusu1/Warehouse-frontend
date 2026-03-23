import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AddProductScreen } from '@/src/features/inventory/screens/AddProductScreen';
import { useI18n } from '@/src/providers/LocaleProvider';
import { useWarehouseService } from '@/src/providers/WarehouseServiceProvider';
import { createMockI18n } from '@/test-utils/mockI18n';

const mockPush = jest.fn();

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

describe('AddProductScreen', () => {
  it('validates required fields', async () => {
    mockedUseI18n.mockReturnValue(createMockI18n() as never);
    mockedUseWarehouseService.mockReturnValue({
      createProduct: jest.fn(),
    } as never);

    const { getByText, findAllByText } = render(<AddProductScreen />);

    fireEvent.press(getByText('Створити товар'));

    expect(await findAllByText('Поле є обов’язковим.')).toHaveLength(4);
  });

  it('creates a product and opens the product card', async () => {
    const createProduct = jest.fn().mockResolvedValue({ id: 'created-1' });
    mockedUseI18n.mockReturnValue(createMockI18n() as never);
    mockedUseWarehouseService.mockReturnValue({
      createProduct,
    } as never);

    const { getByPlaceholderText, getByText } = render(<AddProductScreen />);

    fireEvent.changeText(getByPlaceholderText('Наприклад, Температурний сенсор'), 'Новий товар');
    fireEvent.changeText(getByPlaceholderText('Наприклад, SNS-1001'), 'NEW-001');
    fireEvent.changeText(getByPlaceholderText('Сенсори'), 'Тести');
    fireEvent.changeText(getByPlaceholderText('A-01'), 'Z-09');

    fireEvent.press(getByText('Створити товар'));

    await waitFor(() => {
      expect(createProduct).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it('shows a backend style duplicate sku error', async () => {
    const createProduct = jest.fn().mockRejectedValue(new Error('SKU_ALREADY_EXISTS'));
    mockedUseI18n.mockReturnValue(createMockI18n() as never);
    mockedUseWarehouseService.mockReturnValue({
      createProduct,
    } as never);

    const { getByPlaceholderText, getByText, findByText } = render(<AddProductScreen />);

    fireEvent.changeText(getByPlaceholderText('Наприклад, Температурний сенсор'), 'Новий товар');
    fireEvent.changeText(getByPlaceholderText('Наприклад, SNS-1001'), 'NEW-001');
    fireEvent.changeText(getByPlaceholderText('Сенсори'), 'Тести');
    fireEvent.changeText(getByPlaceholderText('A-01'), 'Z-09');

    fireEvent.press(getByText('Створити товар'));

    expect(await findByText('Товар з таким SKU вже існує.')).toBeTruthy();
  });
});
