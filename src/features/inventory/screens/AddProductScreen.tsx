import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppInput } from '@/src/components/AppInput';
import { AppScreen } from '@/src/components/AppScreen';
import { useI18n } from '@/src/providers/LocaleProvider';
import { useWarehouseService } from '@/src/providers/WarehouseServiceProvider';
import { colors, spacing } from '@/src/theme';
import { CreateProductFormErrors, CreateProductFormValues, validateCreateProductForm } from '@/src/utils/forms';

const initialValues: CreateProductFormValues = {
  name: '',
  sku: '',
  category: '',
  quantity: '0',
  unit: 'шт',
  location: '',
  minStock: '0',
  tagsInput: '',
  notes: '',
};

export function AddProductScreen() {
  const { t } = useI18n();
  const warehouseService = useWarehouseService();
  const [values, setValues] = useState<CreateProductFormValues>(initialValues);
  const [errors, setErrors] = useState<CreateProductFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof CreateProductFormValues>(field: K, value: CreateProductFormValues[K]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resolveError(code?: string) {
    if (!code) {
      return undefined;
    }

    if (code === 'required') {
      return t('validationRequired');
    }

    if (code === 'nonNegative') {
      return t('validationNonNegative');
    }

    if (code === 'duplicateTag') {
      return t('validationDuplicateTags');
    }

    return undefined;
  }

  async function handleSubmit() {
    const nextErrors = validateCreateProductForm(values);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      setIsSubmitting(true);
      const createdProduct = await warehouseService.createProduct({
        name: values.name,
        sku: values.sku,
        category: values.category,
        quantity: Number(values.quantity),
        unit: values.unit,
        location: values.location,
        minStock: Number(values.minStock),
        notes: values.notes,
        tags: values.tagsInput
          .split(/[\n,]/)
          .map((value) => value.trim())
          .filter(Boolean),
      });

      setValues(initialValues);
      router.push({
        pathname: '/(app)/product/[productId]',
        params: { productId: createdProduct.id },
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';

      if (code === 'SKU_ALREADY_EXISTS') {
        setSubmitError(t('createProductSkuExists'));
        return;
      }

      if (code === 'TAG_ALREADY_EXISTS') {
        setSubmitError(t('createProductTagExists'));
        return;
      }

      setSubmitError(t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppScreen subtitle={t('addProductSubtitle')} title={t('addProductTitle')}>
      <AppCard>
        <AppInput
          error={resolveError(errors.name)}
          label={t('fieldName')}
          onChangeText={(value) => setField('name', value)}
          placeholder={t('fieldNamePlaceholder')}
          value={values.name}
        />
        <AppInput
          autoCapitalize="characters"
          error={resolveError(errors.sku)}
          label={t('fieldSku')}
          onChangeText={(value) => setField('sku', value)}
          placeholder={t('fieldSkuPlaceholder')}
          value={values.sku}
        />
        <AppInput
          error={resolveError(errors.category)}
          label={t('fieldCategory')}
          onChangeText={(value) => setField('category', value)}
          placeholder={t('fieldCategoryPlaceholder')}
          value={values.category}
        />
        <AppInput
          error={resolveError(errors.quantity)}
          keyboardType="number-pad"
          label={t('fieldQuantity')}
          onChangeText={(value) => setField('quantity', value)}
          placeholder="0"
          value={values.quantity}
        />
        <AppInput
          error={resolveError(errors.unit)}
          label={t('fieldUnit')}
          onChangeText={(value) => setField('unit', value)}
          placeholder={t('fieldUnitPlaceholder')}
          value={values.unit}
        />
        <AppInput
          error={resolveError(errors.location)}
          label={t('fieldLocation')}
          onChangeText={(value) => setField('location', value)}
          placeholder={t('fieldLocationPlaceholder')}
          value={values.location}
        />
        <AppInput
          error={resolveError(errors.minStock)}
          keyboardType="number-pad"
          label={t('fieldMinStock')}
          onChangeText={(value) => setField('minStock', value)}
          placeholder="0"
          value={values.minStock}
        />
        <AppInput
          error={resolveError(errors.tagsInput)}
          label={t('fieldTags')}
          multiline
          numberOfLines={3}
          onChangeText={(value) => setField('tagsInput', value)}
          placeholder={t('fieldTagsPlaceholder')}
          value={values.tagsInput}
        />
        <AppInput
          label={t('fieldNotes')}
          multiline
          numberOfLines={4}
          onChangeText={(value) => setField('notes', value)}
          placeholder={t('fieldNotesPlaceholder')}
          value={values.notes}
        />
        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
        <AppButton
          disabled={isSubmitting}
          label={isSubmitting ? t('saving') : t('createProductAction')}
          onPress={handleSubmit}
        />
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  submitError: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
