import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/AppCard';
import { StatusBadge } from '@/src/components/StatusBadge';
import { useI18n } from '@/src/providers/LocaleProvider';
import { colors, spacing } from '@/src/theme';
import { Product } from '@/src/types/warehouse';
import { formatDateTime, formatQuantity } from '@/src/utils/format';

type ProductListItemProps = {
  product: Product;
  onPress?: () => void;
};

export function ProductListItem({ product, onPress }: ProductListItemProps) {
  const { locale, t } = useI18n();

  const content = (
    <AppCard>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.sku}>{product.sku}</Text>
        </View>
        <StatusBadge status={product.status} />
      </View>
      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>{t('inventoryQuantityLabel')}</Text>
          <Text style={styles.metaValue}>{formatQuantity(product.quantity, product.unit)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>{t('inventoryLocationLabel')}</Text>
          <Text style={styles.metaValue}>{product.location}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>{t('inventoryTagsLabel')}</Text>
          <Text style={styles.metaValue}>{product.tags.length}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>{t('inventoryUpdatedLabel')}</Text>
          <Text style={styles.metaValue}>{formatDateTime(product.updatedAt, locale)}</Text>
        </View>
      </View>
    </AppCard>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sku: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    minWidth: '46%',
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  metaValue: {
    color: colors.text,
    fontSize: 14,
  },
});
