import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppInput } from '@/src/components/AppInput';
import { AppScreen } from '@/src/components/AppScreen';
import { EmptyState } from '@/src/components/EmptyState';
import { StatusBadge } from '@/src/components/StatusBadge';
import { OperationListItem } from '@/src/features/history/components/OperationListItem';
import { useAuth } from '@/src/providers/AuthProvider';
import { useI18n } from '@/src/providers/LocaleProvider';
import { useWarehouseService } from '@/src/providers/WarehouseServiceProvider';
import { colors, radius, spacing } from '@/src/theme';
import { Operation, Product } from '@/src/types/warehouse';
import { formatDateTime, formatQuantity } from '@/src/utils/format';

type StockActionType = 'stock-in' | 'stock-out' | 'adjustment';

const stockActions: StockActionType[] = ['stock-in', 'stock-out', 'adjustment'];

export function ProductDetailsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { session } = useAuth();
  const { locale, t } = useI18n();
  const warehouseService = useWarehouseService();
  const isFocused = useIsFocused();
  const [product, setProduct] = useState<Product | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionType, setActionType] = useState<StockActionType>('stock-out');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!isFocused || !productId) {
        return;
      }

      setIsLoading(true);

      try {
        const [nextProduct, allOperations] = await Promise.all([
          warehouseService.getProductById(productId),
          warehouseService.getOperations(),
        ]);

        if (isMounted) {
          setProduct(nextProduct);
          setOperations(allOperations.filter((operation) => operation.productId === productId));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [isFocused, productId, warehouseService]);

  const summaryRows = useMemo(
    () =>
      product
        ? [
            { label: t('fieldSku'), value: product.sku },
            { label: t('fieldCategory'), value: product.category },
            { label: t('fieldLocation'), value: product.location },
            { label: t('fieldMinStock'), value: String(product.minStock) },
            { label: t('inventoryTagsLabel'), value: String(product.tags.length) },
            { label: t('inventoryUpdatedLabel'), value: formatDateTime(product.updatedAt, locale) },
          ]
        : [],
    [locale, product, t]
  );

  async function submitStockAction() {
    if (!product) {
      return;
    }

    const numericQuantity = Number(quantity);

    if (!quantity.trim() || Number.isNaN(numericQuantity) || numericQuantity < 0) {
      setFormError(t('validationNonNegative'));
      return;
    }

    setFormError(null);

    try {
      const updatedProduct = await warehouseService.changeStock({
        productId: product.id,
        type: actionType,
        quantity: numericQuantity,
        note: note.trim() || t('stockActionDefaultNote'),
        actor: session?.displayName ?? 'Warehouse Manager',
      });

      const nextOperations = await warehouseService.getOperations();
      setProduct(updatedProduct);
      setOperations(nextOperations.filter((operation) => operation.productId === product.id));
      setQuantity('1');
      setNote('');
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';
      setFormError(code === 'INSUFFICIENT_STOCK' ? t('stockActionInsufficientStock') : t('genericError'));
    }
  }

  if (isLoading) {
    return <AppScreen subtitle={t('productLoadingSubtitle')} title={t('productLoadingTitle')}><Text style={styles.helperText}>{t('loading')}</Text></AppScreen>;
  }

  if (!product) {
    return (
      <AppScreen subtitle={t('productMissingSubtitle')} title={t('productMissingTitle')}>
        <EmptyState description={t('productMissingDescription')} title={t('productMissingTitle')} />
      </AppScreen>
    );
  }

  return (
    <AppScreen subtitle={product.sku} title={product.name}>
      <AppCard>
        <View style={styles.header}>
          <Text style={styles.quantity}>{formatQuantity(product.quantity, product.unit)}</Text>
          <StatusBadge status={product.status} />
        </View>
        {summaryRows.map((row) => (
          <View key={row.label} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{row.label}</Text>
            <Text style={styles.summaryValue}>{row.value}</Text>
          </View>
        ))}
        <View style={styles.notesBlock}>
          <Text style={styles.summaryLabel}>{t('fieldNotes')}</Text>
          <Text style={styles.summaryValue}>{product.notes || t('productNoNotes')}</Text>
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>{t('productTagsTitle')}</Text>
        {product.tags.length ? (
          product.tags.map((tag) => (
            <View key={tag.id} style={styles.tagRow}>
              <Text style={styles.tagId}>{tag.id}</Text>
              <Text style={styles.tagMeta}>{formatDateTime(tag.boundAt, locale)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.helperText}>{t('productNoTags')}</Text>
        )}
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>{t('stockActionTitle')}</Text>
        <View style={styles.actionRow}>
          {stockActions.map((type) => {
            const isActive = actionType === type;

            return (
              <Pressable
                key={type}
                onPress={() => setActionType(type)}
                style={[styles.actionChip, isActive ? styles.actionChipActive : styles.actionChipInactive]}
              >
                <Text
                  style={[
                    styles.actionChipLabel,
                    isActive ? styles.actionChipLabelActive : styles.actionChipLabelInactive,
                  ]}
                >
                  {t(`operationType.${type}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <AppInput
          keyboardType="number-pad"
          label={t('stockActionQuantityLabel')}
          onChangeText={setQuantity}
          placeholder="1"
          value={quantity}
        />
        <AppInput
          label={t('stockActionNoteLabel')}
          multiline
          numberOfLines={3}
          onChangeText={setNote}
          placeholder={t('stockActionNotePlaceholder')}
          value={note}
        />
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        <AppButton label={t('stockActionSubmit')} onPress={submitStockAction} />
      </AppCard>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>{t('productHistoryTitle')}</Text>
        {operations.length ? (
          operations.map((operation) => (
            <OperationListItem
              key={operation.id}
              operation={operation}
              productName={product.name}
              productUnit={product.unit}
            />
          ))
        ) : (
          <EmptyState description={t('productHistoryEmptyDescription')} title={t('productHistoryEmptyTitle')} />
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  helperText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantity: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  summaryRow: {
    gap: spacing.xs,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    color: colors.text,
    fontSize: 15,
  },
  notesBlock: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  tagRow: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  tagId: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  tagMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionChipActive: {
    backgroundColor: colors.primary,
  },
  actionChipInactive: {
    backgroundColor: colors.primarySoft,
  },
  actionChipLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionChipLabelActive: {
    color: colors.surface,
  },
  actionChipLabelInactive: {
    color: colors.primary,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  historySection: {
    gap: spacing.md,
  },
});
