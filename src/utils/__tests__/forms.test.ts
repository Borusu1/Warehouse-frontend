import {
  parseTagInput,
  validateCreateProductForm,
  validateLoginForm,
} from '@/src/utils/forms';

describe('forms utils', () => {
  it('validates required login fields', () => {
    expect(validateLoginForm({ username: '', password: '' })).toEqual({
      username: 'required',
      password: 'required',
    });
  });

  it('parses tags from commas and line breaks', () => {
    expect(parseTagInput('TAG-1,\n TAG-2 ,TAG-3')).toEqual(['TAG-1', 'TAG-2', 'TAG-3']);
  });

  it('validates product form numbers and duplicate tags', () => {
    expect(
      validateCreateProductForm({
        name: '',
        sku: '',
        category: '',
        quantity: '-1',
        unit: '',
        location: '',
        minStock: '-5',
        tagsInput: 'TAG-1, tag-1',
        notes: '',
      })
    ).toEqual({
      name: 'required',
      sku: 'required',
      category: 'required',
      quantity: 'nonNegative',
      unit: 'required',
      location: 'required',
      minStock: 'nonNegative',
      tagsInput: 'duplicateTag',
    });
  });
});
