export type ValidationErrorCode = 'required' | 'nonNegative' | 'duplicateTag';

export type LoginFormValues = {
  username: string;
  password: string;
};

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, ValidationErrorCode>>;

export type CreateProductFormValues = {
  name: string;
  sku: string;
  category: string;
  quantity: string;
  unit: string;
  location: string;
  minStock: string;
  tagsInput: string;
  notes: string;
};

export type CreateProductFormErrors = Partial<
  Record<Exclude<keyof CreateProductFormValues, 'notes'>, ValidationErrorCode>
>;

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.username.trim()) {
    errors.username = 'required';
  }

  if (!values.password.trim()) {
    errors.password = 'required';
  }

  return errors;
}

export function parseTagInput(input: string) {
  return input
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function validateCreateProductForm(values: CreateProductFormValues): CreateProductFormErrors {
  const errors: CreateProductFormErrors = {};
  const quantity = Number(values.quantity);
  const minStock = Number(values.minStock);
  const tags = parseTagInput(values.tagsInput).map((value) => value.toUpperCase());

  if (!values.name.trim()) {
    errors.name = 'required';
  }

  if (!values.sku.trim()) {
    errors.sku = 'required';
  }

  if (!values.category.trim()) {
    errors.category = 'required';
  }

  if (!values.quantity.trim() || Number.isNaN(quantity) || quantity < 0) {
    errors.quantity = 'nonNegative';
  }

  if (!values.unit.trim()) {
    errors.unit = 'required';
  }

  if (!values.location.trim()) {
    errors.location = 'required';
  }

  if (!values.minStock.trim() || Number.isNaN(minStock) || minStock < 0) {
    errors.minStock = 'nonNegative';
  }

  if (new Set(tags).size !== tags.length) {
    errors.tagsInput = 'duplicateTag';
  }

  return errors;
}
