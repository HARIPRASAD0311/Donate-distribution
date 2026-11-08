/**
 * ResQNet Resources & Inventory Telemetry Data Module
 * Demonstrates strict unit separation (packets, containers, kits, vials),
 * FEFO First-Expiry-First-Out queuing, quality verification states, and cold-chain monitoring.
 * All records labeled as SIMULATED.
 */

export const MOCK_INVENTORY_ITEMS = [
  // --- FOOD COMMODITIES (pkts, MT, cartons) ---
  {
    id: 'RES-F01',
    name: 'High-Energy Emergency Food Biscuits (BP-5)',
    commodity: 'FOOD',
    category: 'Ready-to-Use Food',
    batchId: 'BATCH-24045',
    facilityId: 'CSD-01',
    facilityName: 'Central Staging Depot',
    totalQty: 4500,
    reservedQty: 800,
    usableQty: 3700,
    quarantinedQty: 0,
    unit: 'packets',
    expiryDate: '2026-11-20',
    daysToExpiry: 15,
    qualityStatus: 'VERIFIED_USABLE',
    storageLocation: 'Dry Storage Bay A-04',
    source: 'Beira Agro-Milling (SUP-01)',
    receivedDate: '2026-10-15',
    receivedQty: 5000,
    fefoEligible: true,
    qualityRecord: {
      testId: 'QC-F-9921',
      testedAt: '2026-10-16T09:00:00Z',
      testedBy: 'UN WFP Food Safety Officer',
      result: 'Packaging intact, moisture content 2.4% (PASS)',
    },
    movementHistory: [
      { date: '2026-10-15', action: 'INBOUND_RECEIVE', qty: 5000, user: 'Logistics Intake Unit' },
      { date: '2026-10-28', action: 'DISPATCH_ALLOCATION', qty: -500, user: 'Coordinator S. Vance' },
      { date: '2026-11-04', action: 'RESERVE_HOLD', qty: 800, user: 'Emergency Corridor Stage' },
    ],
    isSimulated: true,
  },
  {
    id: 'RES-F02',
    name: 'Fortified Maize Flour (Super Cereal Plus)',
    commodity: 'FOOD',
    category: 'Fortified Blended Foods',
    batchId: 'BATCH-24018',
    facilityId: 'NLB-02',
    facilityName: 'North Logistics Base',
    totalQty: 2200,
    reservedQty: 400,
    usableQty: 1800,
    quarantinedQty: 0,
    unit: 'packets',
    expiryDate: '2026-12-10',
    daysToExpiry: 35,
    qualityStatus: 'VERIFIED_USABLE',
    storageLocation: 'Silo Bay N-02',
    source: 'USAID Food For Peace (DNR-01)',
    receivedDate: '2026-09-20',
    receivedQty: 3000,
    fefoEligible: true,
    qualityRecord: {
      testId: 'QC-F-9844',
      testedAt: '2026-09-21T11:00:00Z',
      testedBy: 'Government Grain Inspection Bureau',
      result: 'Aflatoxin below 5ppb threshold (PASS)',
    },
    movementHistory: [
      { date: '2026-09-20', action: 'INBOUND_RECEIVE', qty: 3000, user: 'Port Intake Unit' },
      { date: '2026-10-12', action: 'DISPATCH_ALLOCATION', qty: -800, user: 'Coordinator S. Vance' },
      { date: '2026-11-02', action: 'RESERVE_HOLD', qty: 400, user: 'Manga Camp Reserve' },
    ],
    isSimulated: true,
  },
  {
    id: 'RES-F03',
    name: 'Ready-to-Use Supplementary Food (RUSF Plumpy Sup)',
    commodity: 'FOOD',
    category: 'Therapeutic Nutrition',
    batchId: 'BATCH-24012',
    facilityId: 'CSD-01',
    facilityName: 'Central Staging Depot',
    totalQty: 1800,
    reservedQty: 0,
    usableQty: 1800,
    quarantinedQty: 0,
    unit: 'packets',
    expiryDate: '2027-04-15',
    daysToExpiry: 161,
    qualityStatus: 'VERIFIED_USABLE',
    storageLocation: 'Controlled Ambient Room C-01',
    source: 'UNICEF Supply Division (DNR-02)',
    receivedDate: '2026-10-25',
    receivedQty: 1800,
    fefoEligible: true,
    qualityRecord: {
      testId: 'QC-F-1002',
      testedAt: '2026-10-26T14:00:00Z',
      testedBy: 'UNICEF Nutrition QA',
      result: 'Microbiological purity confirmed (PASS)',
    },
    movementHistory: [
      { date: '2026-10-25', action: 'INBOUND_RECEIVE', qty: 1800, user: 'Air Cargo Transfer Unit' },
    ],
    isSimulated: true,
  },
  {
    id: 'RES-F04',
    name: 'Infant Formula Powder (Emergency Rations)',
    commodity: 'FOOD',
    category: 'Infant Nutrition',
    batchId: 'BATCH-23990',
    facilityId: 'SRD-03',
    facilityName: 'Southern Reserve Depot',
    totalQty: 300,
    reservedQty: 0,
    usableQty: 0,
    quarantinedQty: 300,
    unit: 'packets',
    expiryDate: '2026-11-12',
    daysToExpiry: 7,
    qualityStatus: 'QUARANTINED',
    storageLocation: 'Quarantine Section Q-01',
    source: 'Local NGO Donation',
    receivedDate: '2026-10-01',
    receivedQty: 300,
    fefoEligible: false, // Quarantined cannot be issued
    qualityRecord: {
      testId: 'QC-F-9710',
      testedAt: '2026-10-02T10:30:00Z',
      testedBy: 'Ministry of Health Inspector',
      result: 'Failed seal vacuum check, humidity exposure (QUARANTINED)',
    },
    movementHistory: [
      { date: '2026-10-01', action: 'INBOUND_RECEIVE', qty: 300, user: 'Southern Desk' },
      { date: '2026-10-02', action: 'QUARANTINE_FLAG', qty: 300, user: 'QA Lead' },
    ],
    isSimulated: true,
  },

  // --- SAFE WATER COMMODITIES (10L containers, liters, purification tablets) ---
  {
    id: 'RES-W01',
    name: 'Clean Drinking Water Bladders (10L Containers)',
    commodity: 'WATER',
    category: 'Pre-Packaged Potable Water',
    batchId: 'BATCH-24089',
    facilityId: 'CSD-01',
    facilityName: 'Central Staging Depot',
    totalQty: 3500,
    reservedQty: 600,
    usableQty: 2900,
    quarantinedQty: 0,
    unit: 'containers (10L)',
    expiryDate: '2027-05-15',
    daysToExpiry: 191,
    qualityStatus: 'VERIFIED_USABLE',
    storageLocation: 'Water Staging Platform W-01',
    source: 'Southern Coast Water Tech (SUP-02)',
    receivedDate: '2026-10-20',
    receivedQty: 4000,
    fefoEligible: true,
    qualityRecord: {
      testId: 'QC-W-8812',
      testedAt: '2026-10-20T16:00:00Z',
      testedBy: 'WHO Water Quality Laboratory',
      result: 'Free residual chlorine 0.5 mg/L, Turbidity < 1 NTU, E.coli 0/100mL (PASS)',
    },
    movementHistory: [
      { date: '2026-10-20', action: 'INBOUND_RECEIVE', qty: 4000, user: 'Water Fleet Logistics' },
      { date: '2026-10-29', action: 'DISPATCH_ALLOCATION', qty: -500, user: 'Coordinator S. Vance' },
      { date: '2026-11-04', action: 'RESERVE_HOLD', qty: 600, user: 'East Coastal Reserve' },
    ],
    isSimulated: true,
  },
  {
    id: 'RES-W02',
    name: 'Bulk Tanker Treated Water (Raw Supply)',
    commodity: 'WATER',
    category: 'Bulk Potable Supply',
    batchId: 'BATCH-24110',
    facilityId: 'NLB-02',
    facilityName: 'North Logistics Base',
    totalQty: 18000,
    reservedQty: 0,
    usableQty: 0,
    quarantinedQty: 0,
    unit: 'liters',
    expiryDate: '2026-11-08',
    daysToExpiry: 3,
    qualityStatus: 'AWAITING_QC',
    storageLocation: 'Reservoir Tank T-04',
    source: 'Municipal Water Intake Pipeline',
    receivedDate: '2026-11-04',
    receivedQty: 18000,
    fefoEligible: false, // Awaiting verification cannot be issued
    qualityRecord: {
      testId: 'QC-W-PND-03',
      testedAt: 'Pending Lab Run (2h remaining)',
      testedBy: 'Field Water Testing Unit',
      result: 'Chlorination contact time underway; turbidity test pending',
    },
    movementHistory: [
      { date: '2026-11-04', action: 'INBOUND_RECEIVE', qty: 18000, user: 'Tanker FLT-08 Driver' },
    ],
    isSimulated: true,
  },
  {
    id: 'RES-W03',
    name: 'Water Purification Disinfection Tablets (Aquatabs 67mg)',
    commodity: 'WATER',
    category: 'Water Treatment Chemical',
    batchId: 'BATCH-24031',
    facilityId: 'SRD-03',
    facilityName: 'Southern Reserve Depot',
    totalQty: 12000,
    reservedQty: 2000,
    usableQty: 10000,
    quarantinedQty: 0,
    unit: 'tablets',
    expiryDate: '2028-09-30',
    daysToExpiry: 694,
    qualityStatus: 'VERIFIED_USABLE',
    storageLocation: 'Chemical Dry Locker B-08',
    source: 'UNICEF Supply Warehouse (DNR-02)',
    receivedDate: '2026-08-10',
    receivedQty: 15000,
    fefoEligible: true,
    qualityRecord: {
      testId: 'QC-W-7740',
      testedAt: '2026-08-11T12:00:00Z',
      testedBy: 'Chemical Safety Board',
      result: 'Active NaDCC content 67mg/tab certified (PASS)',
    },
    movementHistory: [
      { date: '2026-08-10', action: 'INBOUND_RECEIVE', qty: 15000, user: 'Intake Staff' },
      { date: '2026-10-15', action: 'TRANSFER_OUT', qty: -3000, user: 'Logistics Fleet' },
      { date: '2026-11-03', action: 'RESERVE_HOLD', qty: 2000, user: 'Buzi Sector Reserve' },
    ],
    isSimulated: true,
  },

  // --- MEDICAL SUPPLIES (kits, vials, surgical packs) ---
  {
    id: 'RES-M01',
    name: 'Cholera Rapid Response Treatment Kits (Per 100 Patients)',
    commodity: 'MEDICAL',
    category: 'Epidemic Response Kits',
    batchId: 'BATCH-24012',
    facilityId: 'NLB-02',
    facilityName: 'North Logistics Base',
    totalQty: 180,
    reservedQty: 50,
    usableQty: 130,
    quarantinedQty: 0,
    unit: 'kits',
    expiryDate: '2026-12-05',
    daysToExpiry: 30,
    qualityStatus: 'VERIFIED_USABLE',
    storageLocation: 'Pharma Cleanroom M-01',
    source: 'WHO Emergency Supply Depot (DNR-01)',
    receivedDate: '2026-10-10',
    receivedQty: 250,
    fefoEligible: true,
    coldChainRequired: false,
    qualityRecord: {
      testId: 'QC-M-5520',
      testedAt: '2026-10-11T15:00:00Z',
      testedBy: 'WHO Pharmacist Inspector',
      result: 'Ringer lactate, IV giving sets, antibiotics sealed (PASS)',
    },
    movementHistory: [
      { date: '2026-10-10', action: 'INBOUND_RECEIVE', qty: 250, user: 'Medical Cargo Team' },
      { date: '2026-10-25', action: 'DISPATCH_ALLOCATION', qty: -70, user: 'Coordinator S. Vance' },
      { date: '2026-11-04', action: 'RESERVE_HOLD', qty: 50, user: 'Riverdale Clinic Reserve' },
    ],
    isSimulated: true,
  },
  {
    id: 'RES-M02',
    name: 'Oral Cholera Vaccines (Euvichol-Plus Vials)',
    commodity: 'MEDICAL',
    category: 'Cold-Chain Biologicals',
    batchId: 'BATCH-24099',
    facilityId: 'CSD-01',
    facilityName: 'Central Staging Depot',
    totalQty: 2400,
    reservedQty: 400,
    usableQty: 2000,
    quarantinedQty: 0,
    unit: 'vials',
    expiryDate: '2027-02-28',
    daysToExpiry: 115,
    qualityStatus: 'VERIFIED_USABLE',
    storageLocation: 'Cold Room 02 (+4.2°C)',
    source: 'Global Vaccine Alliance Gavi',
    receivedDate: '2026-10-22',
    receivedQty: 2400,
    fefoEligible: true,
    coldChainRequired: true,
    currentTempCelsius: 4.2,
    tempExcursionFlag: false,
    qualityRecord: {
      testId: 'QC-M-6610',
      testedAt: '2026-10-22T18:00:00Z',
      testedBy: 'Cold Chain Specialist',
      result: 'Continuous logger log: +3.8°C to +4.5°C during transit (PASS)',
    },
    movementHistory: [
      { date: '2026-10-22', action: 'INBOUND_RECEIVE', qty: 2400, user: 'Cold Chain Intake' },
      { date: '2026-11-03', action: 'RESERVE_HOLD', qty: 400, user: 'Manga Camp Campaign' },
    ],
    isSimulated: true,
  },
  {
    id: 'RES-M03',
    name: 'Trauma Surgical Packs & Wound Dressing Sets',
    commodity: 'MEDICAL',
    category: 'Emergency Surgical Supplies',
    batchId: 'BATCH-24019',
    facilityId: 'SRD-03',
    facilityName: 'Southern Reserve Depot',
    totalQty: 240,
    reservedQty: 60,
    usableQty: 180,
    quarantinedQty: 0,
    unit: 'kits',
    expiryDate: '2027-02-10',
    daysToExpiry: 97,
    qualityStatus: 'VERIFIED_USABLE',
    storageLocation: 'Medical Bay S-04',
    source: 'ICRC Geneva Warehouse (DNR-02)',
    receivedDate: '2026-09-15',
    receivedQty: 300,
    fefoEligible: true,
    coldChainRequired: false,
    qualityRecord: {
      testId: 'QC-M-4418',
      testedAt: '2026-09-16T11:00:00Z',
      testedBy: 'ICRC Biomedical Engineer',
      result: 'Gamma sterilized, autoclave seals valid (PASS)',
    },
    movementHistory: [
      { date: '2026-09-15', action: 'INBOUND_RECEIVE', qty: 300, user: 'Intake Staff' },
      { date: '2026-10-18', action: 'DISPATCH_ALLOCATION', qty: -60, user: 'Coordinator S. Vance' },
      { date: '2026-11-04', action: 'RESERVE_HOLD', qty: 60, user: 'Buzi Clinic Buffer' },
    ],
    isSimulated: true,
  },
  {
    id: 'RES-M04',
    name: 'Tetanus Toxoid Vaccine Vials',
    commodity: 'MEDICAL',
    category: 'Cold-Chain Biologicals',
    batchId: 'BATCH-23880',
    facilityId: 'CSD-01',
    facilityName: 'Central Staging Depot',
    totalQty: 150,
    reservedQty: 0,
    usableQty: 0,
    quarantinedQty: 150,
    unit: 'vials',
    expiryDate: '2026-11-18',
    daysToExpiry: 13,
    qualityStatus: 'QUARANTINED',
    storageLocation: 'Cold Room Quarantine Shelf',
    source: 'Ministry of Health Transfer',
    receivedDate: '2026-10-28',
    receivedQty: 150,
    fefoEligible: false,
    coldChainRequired: true,
    currentTempCelsius: 11.5,
    tempExcursionFlag: true,
    qualityRecord: {
      testId: 'QC-M-EXC-01',
      testedAt: '2026-10-29T08:00:00Z',
      testedBy: 'Cold Chain Monitor',
      result: 'Temperature logger recorded +11.5°C excursion for 6 hours (FAILED - QUARANTINED)',
    },
    movementHistory: [
      { date: '2026-10-28', action: 'INBOUND_RECEIVE', qty: 150, user: 'Intake Staff' },
      { date: '2026-10-29', action: 'QUARANTINE_FLAG', qty: 150, user: 'Cold Chain Lead' },
    ],
    isSimulated: true,
  },
];

/**
 * Filtered helper computing KPIs and Analytics for selected commodity & facility
 */
export function getResourcesModuleData(commodityFilter = 'ALL', facilityFilter = 'ALL') {
  // Filter base items
  let items = MOCK_INVENTORY_ITEMS;

  if (commodityFilter !== 'ALL') {
    items = items.filter((i) => i.commodity === commodityFilter);
  }

  if (facilityFilter !== 'ALL') {
    items = items.filter((i) => i.facilityId === facilityFilter);
  }

  // Compute Metrics
  const totalItemCount = items.length;
  const totalUsableLots = items.filter((i) => i.qualityStatus === 'VERIFIED_USABLE').length;
  const totalQuarantinedLots = items.filter((i) => i.qualityStatus === 'QUARANTINED').length;
  const totalExpiringLots = items.filter((i) => i.daysToExpiry <= 30 && i.daysToExpiry > 0).length;
  const totalLowStockLots = items.filter((i) => Number.isFinite(i.lowStockThreshold) && i.unit === i.lowStockThresholdUnit && i.usableQty < i.lowStockThreshold).length;
  const totalReservedLots = items.filter((i) => i.reservedQty > 0).length;

  // FEFO Priority Queue: Filter out expired or quarantined, sort by earliest expiry date!
  const fefoQueue = items
    .filter((i) => i.fefoEligible && i.qualityStatus === 'VERIFIED_USABLE' && i.daysToExpiry > 0)
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
    .map((item, idx) => ({
      ...item,
      fefoRank: idx + 1,
      urgencyTier: item.daysToExpiry <= 15 ? 'CRITICAL_DISPATCH' : item.daysToExpiry <= 45 ? 'HIGH_PRIORITY' : 'STABLE',
    }));

  // Analytics datasets
  // 1. Food Analytics
  const foodAnalytics = {
    categories: [
      { name: 'Ready-to-Use BP-5', count: 4500, unit: 'pkts' },
      { name: 'Fortified Maize Flour', count: 2200, unit: 'pkts' },
      { name: 'Therapeutic RUSF', count: 1800, unit: 'pkts' },
      { name: 'Infant Formula (Quar)', count: 300, unit: 'pkts' },
    ],
    expiryDistribution: [
      { range: '< 30 Days (Urgent)', count: 4500, fill: '#C94C4C' },
      { range: '30-90 Days', count: 2200, fill: '#D99A35' },
      { range: '90-180 Days', count: 1800, fill: '#176B76' },
      { range: '> 180 Days', count: 0, fill: '#60758A' },
    ],
    fefoCompliancePct: 98.4,
    facilityStorageM3: [
      { facility: 'Central Depot', utilized: 3850, capacity: 5000 },
      { facility: 'North Base', utilized: 3100, capacity: 3500 },
      { facility: 'South Depot', utilized: 1200, capacity: 4000 },
    ],
    stockMovements: [
      { day: 'Mon', inbound: 1200, outbound: 800 },
      { day: 'Tue', inbound: 1800, outbound: 1500 },
      { day: 'Wed', inbound: 600, outbound: 900 },
      { day: 'Thu', inbound: 2200, outbound: 1400 },
      { day: 'Fri', inbound: 1500, outbound: 1800 },
    ],
  };

  // 2. Water Analytics
  const waterAnalytics = {
    verifiedPotableCount: 3500, // strictly verified potable
    awaitingQcCount: 18000,     // awaiting lab verification (cannot be issued)
    waterByFacility: [
      { facility: 'Central Depot', verified: 3500, unit: 'containers (10L)' },
      { facility: 'North Base', verified: 0, awaiting: 18000, unit: 'liters (raw)' },
      { facility: 'South Depot', verified: 12000, unit: 'Aquatabs' },
    ],
    qualityStatusBreakdown: [
      { name: 'Verified Potable (WHO PASS)', value: 85, color: '#27856F' },
      { name: 'Awaiting Lab Verification', value: 15, color: '#D99A35' },
      { name: 'Turbidity Failed', value: 0, color: '#C94C4C' },
    ],
    distributionTrend: [
      { date: 'Day -4', delivered: 1200 },
      { date: 'Day -3', delivered: 1800 },
      { date: 'Day -2', delivered: 2400 },
      { date: 'Yesterday', delivered: 3100 },
      { date: 'Today', delivered: 1950 },
    ],
  };

  // 3. Medical Analytics
  const medicalAnalytics = {
    coldChainCompliancePct: 99.1,
    temperatureExcursionCount: 1, // flagged lot: Tetanus toxoid
    expiryDistribution: [
      { range: '< 30 Days', count: 180, fill: '#C94C4C' },
      { range: '30-90 Days', count: 0, fill: '#D99A35' },
      { range: '90-180 Days', count: 2640, fill: '#176B76' },
      { range: '> 180 Days', count: 0, fill: '#60758A' },
    ],
    quarantinedLots: [
      {
        batchId: 'BATCH-23880',
        name: 'Tetanus Toxoid Vaccine Vials',
        qty: 150,
        unit: 'vials',
        reason: 'Temperature logger excursion: +11.5°C breach for 6 hrs',
      },
    ],
    coldStorageCapacityM3: {
      total: 80,
      utilized: 62,
      utilizationPct: 77.5,
    },
  };

  return {
    items,
    fefoQueue,
    metrics: {
      totalItemCount,
      totalUsableLots,
      totalQuarantinedLots,
      totalExpiringLots,
      totalLowStockLots,
      totalReservedLots,
    },
    foodAnalytics,
    waterAnalytics,
    medicalAnalytics,
  };
}
