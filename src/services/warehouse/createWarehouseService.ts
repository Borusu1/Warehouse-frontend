import { MockWarehouseDataService } from '@/src/services/warehouse/MockWarehouseDataService';
import { WarehouseDataService } from '@/src/services/warehouse/types';

let warehouseDataService: WarehouseDataService | null = null;

export function getWarehouseDataService(): WarehouseDataService {
  if (!warehouseDataService) {
    warehouseDataService = new MockWarehouseDataService();
  }

  return warehouseDataService;
}
