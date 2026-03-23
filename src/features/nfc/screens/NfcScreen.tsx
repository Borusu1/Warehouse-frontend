import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppScreen } from '@/src/components/AppScreen';
import { EmptyState } from '@/src/components/EmptyState';
import { StatusBadge } from '@/src/components/StatusBadge';
import { useI18n } from '@/src/providers/LocaleProvider';
import { useWarehouseService } from '@/src/providers/WarehouseServiceProvider';
import { scanNfcTagId } from '@/src/services/nfc/nfcScanner';
import { colors, spacing } from '@/src/theme';
import { Product } from '@/src/types/warehouse';
import { formatQuantity } from '@/src/utils/format';

export function NfcScreen() {
  const { t } = useI18n();
  const warehouseService = useWarehouseService();
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastTagId, setLastTagId] = useState<string | null>(null);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);

  async function handleScan() {
    setScanError(null);
    setFoundProduct(null);

    try {
      setIsScanning(true);
      const tagId = await scanNfcTagId();
      const product = await warehouseService.findProductByTagId(tagId);

      setLastTagId(tagId);
      setFoundProduct(product);

      if (!product) {
        setScanError(t('nfcUnknownTag'));
      }
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';

      if (code === 'NFC_DISABLED') {
        setScanError(t('nfcDisabled'));
      } else if (code === 'NFC_NOT_SUPPORTED') {
        setScanError(t('nfcNotSupported'));
      } else if (code === 'NFC_TAG_ID_NOT_FOUND') {
        setScanError(t('nfcTagIdMissing'));
      } else if (code === 'NFC_WEB_UNAVAILABLE') {
        setScanError(t('nfcWebOnlyMessage'));
      } else {
        setScanError(t('genericError'));
      }
    } finally {
      setIsScanning(false);
    }
  }

  if (Platform.OS === 'web') {
    return (
      <AppScreen subtitle={t('nfcSubtitle')} title={t('nfcTitle')}>
        <EmptyState description={t('nfcWebOnlyDescription')} title={t('nfcWebOnlyTitle')} />
      </AppScreen>
    );
  }

  return (
    <AppScreen subtitle={t('nfcSubtitle')} title={t('nfcTitle')}>
      <AppCard>
        <Text style={styles.sectionTitle}>{t('nfcReadyTitle')}</Text>
        <Text style={styles.description}>{t('nfcReadyDescription')}</Text>
        <AppButton
          disabled={isScanning}
          label={isScanning ? t('nfcScanningAction') : t('nfcScanAction')}
          onPress={handleScan}
        />
      </AppCard>

      {scanError ? (
        <AppCard>
          <Text style={styles.errorText}>{scanError}</Text>
          {lastTagId ? <Text style={styles.metaText}>{t('nfcLastTag')}: {lastTagId}</Text> : null}
        </AppCard>
      ) : null}

      {foundProduct ? (
        <AppCard>
          <Text style={styles.sectionTitle}>{t('nfcFoundProductTitle')}</Text>
          <View style={styles.productHeader}>
            <View style={styles.productHeaderText}>
              <Text style={styles.productName}>{foundProduct.name}</Text>
              <Text style={styles.metaText}>{foundProduct.sku}</Text>
            </View>
            <StatusBadge status={foundProduct.status} />
          </View>
          <Text style={styles.metaText}>
            {formatQuantity(foundProduct.quantity, foundProduct.unit)} • {foundProduct.location}
          </Text>
          {lastTagId ? <Text style={styles.metaText}>{t('nfcLastTag')}: {lastTagId}</Text> : null}
          <AppButton
            label={t('nfcOpenProduct')}
            onPress={() =>
              router.push({
                pathname: '/(app)/product/[productId]',
                params: { productId: foundProduct.id },
              })
            }
          />
        </AppCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  errorText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  productHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  productHeaderText: {
    flex: 1,
    gap: spacing.xs,
  },
  productName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
