import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { router } from 'expo-router';

import { NfcScreen } from '@/src/features/nfc/screens/NfcScreen';
import { useI18n } from '@/src/providers/LocaleProvider';
import { useWarehouseService } from '@/src/providers/WarehouseServiceProvider';
import { scanNfcTagId } from '@/src/services/nfc/nfcScanner';
import { createMockI18n } from '@/test-utils/mockI18n';

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

jest.mock('@/src/services/nfc/nfcScanner', () => ({
  scanNfcTagId: jest.fn(),
}));

const mockedUseI18n = jest.mocked(useI18n);
const mockedUseWarehouseService = jest.mocked(useWarehouseService);
const mockedScanNfcTagId = jest.mocked(scanNfcTagId);

describe('NfcScreen', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatform,
    });
  });

  it('shows a clear fallback on web', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });

    mockedUseI18n.mockReturnValue(createMockI18n() as never);
    mockedUseWarehouseService.mockReturnValue({} as never);

    const { getByText } = render(<NfcScreen />);

    expect(getByText('Функція доступна лише на мобільному застосунку')).toBeTruthy();
  });

  it('scans a native tag and opens the linked product', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });

    mockedUseI18n.mockReturnValue(createMockI18n() as never);
    mockedScanNfcTagId.mockResolvedValue('TAG-A100');
    mockedUseWarehouseService.mockReturnValue({
      findProductByTagId: jest.fn().mockResolvedValue({
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
      }),
    } as never);

    const { getByText } = render(<NfcScreen />);

    fireEvent.press(getByText('Сканувати мітку'));

    await waitFor(() => {
      expect(getByText('Товар знайдено')).toBeTruthy();
    });

    fireEvent.press(getByText('Відкрити картку товару'));
    expect(router.push).toHaveBeenCalled();
  });

  it('shows an error when the scanned tag is not linked to a product', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });

    mockedUseI18n.mockReturnValue(createMockI18n() as never);
    mockedScanNfcTagId.mockResolvedValue('TAG-UNKNOWN');
    mockedUseWarehouseService.mockReturnValue({
      findProductByTagId: jest.fn().mockResolvedValue(null),
    } as never);

    const { getByText, findByText } = render(<NfcScreen />);

    fireEvent.press(getByText('Сканувати мітку'));

    expect(await findByText('Мітка прочитана, але товар із таким ID не знайдено.')).toBeTruthy();
  });

  it('shows a device error when NFC is disabled', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });

    mockedUseI18n.mockReturnValue(createMockI18n() as never);
    mockedScanNfcTagId.mockRejectedValue(new Error('NFC_DISABLED'));
    mockedUseWarehouseService.mockReturnValue({
      findProductByTagId: jest.fn(),
    } as never);

    const { getByText, findByText } = render(<NfcScreen />);

    fireEvent.press(getByText('Сканувати мітку'));

    expect(await findByText('NFC вимкнено на пристрої. Увімкніть його і спробуйте ще раз.')).toBeTruthy();
  });
});
