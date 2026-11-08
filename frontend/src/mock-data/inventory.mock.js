import { COMMODITY_CATEGORY } from '../types/constants.js';

/**
 * Simulated FEFO Inventory Items
 * Demonstrates First-Expiry-First-Out time horizons.
 */
export const MOCK_INVENTORY = [
  {
    id: 'INV-001',
    warehouseId: 'FAC-01',
    itemCode: 'BP-5-FOOD',
    itemName: 'High-Energy Food Biscuits (BP-5)',
    category: COMMODITY_CATEGORY.FOOD,
    batchNumber: 'BATCH-24045',
    quantityOnHand: 4500,
    unitOfMeasure: 'packets',
    expiryDate: '2026-11-20',
    daysToExpiry: 15,
    fefoPriority: 'CRITICAL',
    isSimulated: true,
  },
  {
    id: 'INV-002',
    warehouseId: 'FAC-01',
    itemCode: 'WTR-BLAD-10L',
    itemName: 'Clean Drinking Water Bladders (10L)',
    category: COMMODITY_CATEGORY.WATER,
    batchNumber: 'BATCH-24089',
    quantityOnHand: 3500,
    unitOfMeasure: 'containers',
    expiryDate: '2027-05-15',
    daysToExpiry: 191,
    fefoPriority: 'STABLE',
    isSimulated: true,
  },
  {
    id: 'INV-003',
    warehouseId: 'FAC-02',
    itemCode: 'MED-CHOL-KIT',
    itemName: 'Cholera Rapid Response Kits',
    category: COMMODITY_CATEGORY.MEDICAL,
    batchNumber: 'BATCH-24012',
    quantityOnHand: 180,
    unitOfMeasure: 'kits',
    expiryDate: '2026-12-05',
    daysToExpiry: 30,
    fefoPriority: 'ELEVATED',
    isSimulated: true,
  },
  {
    id: 'INV-004',
    warehouseId: 'FAC-03',
    itemCode: 'MED-TRAUMA-01',
    itemName: 'Trauma First Aid Response Kits',
    category: COMMODITY_CATEGORY.MEDICAL,
    batchNumber: 'BATCH-24019',
    quantityOnHand: 240,
    unitOfMeasure: 'kits',
    expiryDate: '2027-02-10',
    daysToExpiry: 97,
    fefoPriority: 'STABLE',
    isSimulated: true,
  },
];
