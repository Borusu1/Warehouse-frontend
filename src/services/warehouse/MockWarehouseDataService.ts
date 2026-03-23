import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import { initialOperations, initialProducts } from '@/src/services/warehouse/mockData';
import {
  ChangeStockInput,
  CreateProductInput,
  WarehouseDataService,
} from '@/src/services/warehouse/types';
import { AppSettings, LocaleCode, UserSession } from '@/src/types/app';
import { DashboardSummary, Operation, Product } from '@/src/types/warehouse';
import { normalizeTagId } from '@/src/utils/tag';
import { resolveProductStatus } from '@/src/utils/warehouse';

const SESSION_STORAGE_KEY = 'warehouse.session';
const SETTINGS_STORAGE_KEY = 'warehouse.settings';
const SERVICE_LATENCY_MS = 180;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function wait(durationMs = SERVICE_LATENCY_MS) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function getDefaultLanguage(): LocaleCode {
  return getLocales()[0]?.languageCode === 'en' ? 'en' : 'uk';
}

function buildDashboardSummary(products: Product[], operations: Operation[]): DashboardSummary {
  const totalUnits = products.reduce((sum, product) => sum + product.quantity, 0);
  const lowStockCount = products.filter((product) => product.status === 'lowStock').length;
  const outOfStockCount = products.filter((product) => product.status === 'outOfStock').length;
  const lastUpdatedAt = [...products]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0]
    ?.updatedAt ?? new Date().toISOString();

  return {
    totalProducts: products.length,
    totalUnits,
    lowStockCount,
    outOfStockCount,
    recentOperations: clone(
      [...operations]
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 5)
    ),
    syncStatus: 'local',
    lastUpdatedAt,
  };
}

export class MockWarehouseDataService implements WarehouseDataService {
  private sessionCache: UserSession | null = null;

  private settingsCache: AppSettings | null = null;

  private products = clone(initialProducts);

  private operations = clone(initialOperations);

  async login(username: string, password: string): Promise<UserSession> {
    await wait();

    const normalizedUsername = username.trim().toLowerCase();

    if (normalizedUsername !== 'demo' || password !== 'demo123') {
      throw new Error('INVALID_CREDENTIALS');
    }

    const session: UserSession = {
      id: 'demo-manager',
      displayName: 'Warehouse Manager',
      username: normalizedUsername,
    };

    this.sessionCache = session;
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    return clone(session);
  }

  async logout(): Promise<void> {
    await wait();
    this.sessionCache = null;
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  }

  async getSession(): Promise<UserSession | null> {
    await wait();

    if (this.sessionCache) {
      return clone(this.sessionCache);
    }

    const rawSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    const session = JSON.parse(rawSession) as UserSession;
    this.sessionCache = session;

    return clone(session);
  }

  async getSettings(): Promise<AppSettings> {
    await wait();

    if (this.settingsCache) {
      return clone(this.settingsCache);
    }

    const rawSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    const settings =
      rawSettings !== null
        ? (JSON.parse(rawSettings) as AppSettings)
        : {
            language: getDefaultLanguage(),
          };

    this.settingsCache = settings;

    return clone(settings);
  }

  async updateSettings(input: Partial<AppSettings>): Promise<AppSettings> {
    await wait();

    const current = await this.getSettings();
    const nextSettings: AppSettings = {
      ...current,
      ...input,
    };

    this.settingsCache = nextSettings;
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));

    return clone(nextSettings);
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    await wait();

    return buildDashboardSummary(this.products, this.operations);
  }

  async getProducts(): Promise<Product[]> {
    await wait();

    return clone(
      [...this.products].sort((left, right) =>
        left.name.localeCompare(right.name, 'uk', { sensitivity: 'base' })
      )
    );
  }

  async getProductById(productId: string): Promise<Product | null> {
    await wait();

    const product = this.products.find((candidate) => candidate.id === productId);

    return product ? clone(product) : null;
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    await wait();

    const normalizedSku = input.sku.trim().toUpperCase();
    const normalizedTags = input.tags
      .map((tagId) => normalizeTagId(tagId))
      .filter(Boolean);

    if (this.products.some((product) => product.sku.toUpperCase() === normalizedSku)) {
      throw new Error('SKU_ALREADY_EXISTS');
    }

    for (const tagId of normalizedTags) {
      const taken = this.products.some((product) =>
        product.tags.some((tag) => normalizeTagId(tag.id) === tagId)
      );

      if (taken) {
        throw new Error('TAG_ALREADY_EXISTS');
      }
    }

    const createdAt = new Date().toISOString();
    const product: Product = {
      id: `product-${Date.now()}`,
      name: input.name.trim(),
      sku: normalizedSku,
      category: input.category.trim(),
      quantity: input.quantity,
      unit: input.unit.trim(),
      location: input.location.trim(),
      minStock: input.minStock,
      status: resolveProductStatus(input.quantity, input.minStock),
      notes: input.notes.trim(),
      tags: normalizedTags.map((tagId) => ({
        id: tagId,
        boundAt: createdAt,
      })),
      updatedAt: createdAt,
    };

    this.products = [product, ...this.products];
    this.operations = [
      {
        id: `op-${Date.now()}`,
        type: 'created',
        productId: product.id,
        quantityDelta: product.quantity,
        quantityAfter: product.quantity,
        note: 'Товар створено в застосунку.',
        actor: 'Warehouse Manager',
        createdAt,
        tagId: product.tags[0]?.id,
      },
      ...this.operations,
    ];

    return clone(product);
  }

  async changeStock(input: ChangeStockInput): Promise<Product> {
    await wait();

    const index = this.products.findIndex((product) => product.id === input.productId);

    if (index === -1) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    const target = this.products[index];
    let nextQuantity = target.quantity;
    let quantityDelta = input.quantity;

    if (input.type === 'stock-in') {
      nextQuantity = target.quantity + input.quantity;
      quantityDelta = input.quantity;
    }

    if (input.type === 'stock-out') {
      if (input.quantity > target.quantity) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      nextQuantity = target.quantity - input.quantity;
      quantityDelta = -input.quantity;
    }

    if (input.type === 'adjustment') {
      nextQuantity = input.quantity;
      quantityDelta = input.quantity - target.quantity;
    }

    const updatedAt = new Date().toISOString();
    const updatedProduct: Product = {
      ...target,
      quantity: nextQuantity,
      status: resolveProductStatus(nextQuantity, target.minStock),
      updatedAt,
    };

    this.products[index] = updatedProduct;
    this.operations = [
      {
        id: `op-${Date.now()}`,
        type: input.type,
        productId: updatedProduct.id,
        quantityDelta,
        quantityAfter: nextQuantity,
        note: input.note.trim(),
        actor: input.actor,
        createdAt: updatedAt,
        tagId: input.tagId,
      },
      ...this.operations,
    ];

    return clone(updatedProduct);
  }

  async getOperations(): Promise<Operation[]> {
    await wait();

    return clone(
      [...this.operations].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )
    );
  }

  async findProductByTagId(tagId: string): Promise<Product | null> {
    await wait();

    const normalizedTagId = normalizeTagId(tagId);
    const product = this.products.find((candidate) =>
      candidate.tags.some((tag) => normalizeTagId(tag.id) === normalizedTagId)
    );

    return product ? clone(product) : null;
  }
}
