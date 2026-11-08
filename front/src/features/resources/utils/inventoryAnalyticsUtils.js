/**
 * ResQNet Resources & Inventory Visual Analytics Calculations
 * Enforces strict unit separation, FEFO expiry risk tiering, quality state classification,
 * and operational stock eligibility rules.
 */

/**
 * Groups quantities strictly by commodity and unit to prevent incompatible unit aggregation.
 * E.g., never combines packets with liters or containers with kits.
 */
export function groupQuantitiesByUnit(items = [], quantityField = 'totalQty') {
  const map = new Map();

  for (const item of items) {
    const qty = Number(item[quantityField] ?? 0);
    if (qty <= 0) continue;

    const commodity = String(item.commodity || item.commodityId || 'OTHER').toUpperCase();
    const unit = String(item.unit || item.unitOfMeasure || 'units').toLowerCase();
    const key = `${commodity}|${unit}`;

    if (!map.has(key)) {
      map.set(key, {
        commodity,
        unit: item.unit || item.unitOfMeasure || 'units',
        quantity: 0,
        batchCount: 0,
      });
    }

    const entry = map.get(key);
    entry.quantity += qty;
    entry.batchCount += 1;
  }

  return [...map.values()];
}

/**
 * Formats a list of unit-grouped quantities into a compact, human-readable summary string.
 * e.g. "8,600 packets • 3,400 containers"
 */
export function formatUnitBreakdown(unitGroups = []) {
  if (!unitGroups || unitGroups.length === 0) return '0 units';
  return unitGroups
    .map(g => `${new Intl.NumberFormat().format(g.quantity)} ${g.unit}`)
    .join(' · ');
}

/**
 * Computes high-level KPI metrics for the Visual Analytics Overview.
 */
export function getInventorySummaryMetrics(items = []) {
  const totalItemCount = items.length;

  // Filter batches by operational status
  const usableLots = items.filter(i => (i.usableQty || 0) > 0 && i.qualityStatus === 'VERIFIED_USABLE');
  const reservedLots = items.filter(i => (i.reservedQty || 0) > 0);
  const pendingLots = items.filter(i =>
    ['AWAITING_QC', 'PENDING_QC', 'PENDING_VERIFICATION'].includes(i.qualityStatus)
  );
  const quarantinedLots = items.filter(i => i.qualityStatus === 'QUARANTINED');
  const expiredLots = items.filter(i => {
    if (i.qualityStatus === 'EXPIRED') return true;
    if (i.daysToExpiry !== null && i.daysToExpiry !== undefined && i.daysToExpiry <= 0) return true;
    return false;
  });
  const damagedLots = items.filter(i => i.qualityStatus === 'DAMAGED' || (i.damagedQty || 0) > 0);
  const expiringSoonLots = items.filter(i =>
    i.daysToExpiry !== null && i.daysToExpiry !== undefined && i.daysToExpiry > 0 && i.daysToExpiry <= 30
  );

  // Grouped physical, usable, and reserved quantities by unit
  const physicalByUnit = groupQuantitiesByUnit(items, 'totalQty');
  const usableByUnit = groupQuantitiesByUnit(items, 'usableQty');
  const reservedByUnit = groupQuantitiesByUnit(items, 'reservedQty');
  const pendingByUnit = groupQuantitiesByUnit(pendingLots, 'totalQty');

  return {
    totalItemCount,
    usableLotsCount: usableLots.length,
    reservedLotsCount: reservedLots.length,
    pendingLotsCount: pendingLots.length,
    quarantinedLotsCount: quarantinedLots.length,
    expiredLotsCount: expiredLots.length,
    damagedLotsCount: damagedLots.length,
    expiringSoonLotsCount: expiringSoonLots.length,
    physicalByUnit,
    usableByUnit,
    reservedByUnit,
    pendingByUnit,
  };
}

/**
 * Analyzes inventory category breakdown (Food, Water, Medical)
 * Returns lot counts, percentages, and strictly separated unit totals.
 */
export function getCategoryDistribution(items = []) {
  const categories = [
    { key: 'FOOD', label: 'Food Supplies', color: '#27856F' },
    { key: 'WATER', label: 'Safe Water', color: '#60758A' },
    { key: 'MEDICAL', label: 'Medical Supplies', color: '#152B45' },
  ];

  const total = items.length || 1;

  return categories.map(cat => {
    const categoryItems = items.filter(i => String(i.commodity || i.commodityId).toUpperCase() === cat.key);
    const count = categoryItems.length;
    const percentage = Number(((count / total) * 100).toFixed(1));
    const units = groupQuantitiesByUnit(categoryItems, 'totalQty');
    const usableUnits = groupQuantitiesByUnit(categoryItems, 'usableQty');
    const reservedUnits = groupQuantitiesByUnit(categoryItems, 'reservedQty');

    return {
      category: cat.key,
      label: cat.label,
      color: cat.color,
      count,
      percentage,
      units,
      usableUnits,
      reservedUnits,
    };
  });
}

/**
 * Computes stacked stock availability breakdown per batch/resource:
 * - Usable stock (Green)
 * - Reserved stock (Steel Blue)
 * - Pending verification (Amber)
 * - Unavailable / Quarantined / Expired / Damaged (Red)
 */
export function getStockAvailabilityByResource(items = []) {
  return items.map(item => {
    const total = Number(item.totalQty || item.receivedQty || 0);
    const reserved = Number(item.reservedQty || 0);
    const isPending = ['AWAITING_QC', 'PENDING_QC', 'PENDING_VERIFICATION'].includes(item.qualityStatus);
    const isRestricted = item.qualityStatus === 'QUARANTINED' ||
      item.qualityStatus === 'EXPIRED' ||
      item.qualityStatus === 'DAMAGED' ||
      (item.daysToExpiry !== null && item.daysToExpiry <= 0);

    let usable = 0;
    let pending = 0;
    let unavailable = 0;

    if (isPending) {
      pending = total;
    } else if (isRestricted) {
      unavailable = total;
    } else {
      usable = Number(item.usableQty || Math.max(0, total - reserved));
      unavailable = Math.max(0, total - usable - reserved);
    }

    return {
      id: item.id,
      batchId: item.batchId,
      name: item.name || item.id,
      shortName: item.name ? (item.name.length > 22 ? `${item.name.slice(0, 22)}…` : item.name) : item.id,
      commodity: item.commodity,
      facilityName: item.facilityName || item.facilityId,
      unit: item.unit,
      total,
      usable,
      reserved,
      pending,
      unavailable,
      rawItem: item,
    };
  });
}

/**
 * Analyzes quality and verification status distribution.
 */
export function getQualityDistribution(items = []) {
  const statusDefinitions = [
    { key: 'VERIFIED_USABLE', label: 'Verified Usable', color: '#27856F' },
    { key: 'AWAITING_QC', label: 'Awaiting QC', color: '#D99A35' },
    { key: 'PENDING_VERIFICATION', label: 'Pending Verification', color: '#60758A' },
    { key: 'QUARANTINED', label: 'Quarantined', color: '#C94C4C' },
    { key: 'DAMAGED', label: 'Damaged', color: '#E53E3E' },
    { key: 'EXPIRED', label: 'Expired', color: '#9B2C2C' },
  ];

  const total = items.length || 1;

  return statusDefinitions.map(stat => {
    const matching = items.filter(i => {
      if (stat.key === 'EXPIRED') {
        return i.qualityStatus === 'EXPIRED' || (i.daysToExpiry !== null && i.daysToExpiry <= 0);
      }
      return i.qualityStatus === stat.key;
    });

    const count = matching.length;
    const percentage = Number(((count / total) * 100).toFixed(1));

    return {
      status: stat.key,
      name: stat.label,
      color: stat.color,
      count,
      percentage,
      batches: matching.map(m => m.batchId),
    };
  }).filter(s => s.count > 0 || ['VERIFIED_USABLE', 'AWAITING_QC', 'QUARANTINED'].includes(s.status));
}

/**
 * Analyzes expiry risk timeline by organizing batches into distinct risk horizons.
 */
export function getExpiryRiskTimeline(items = []) {
  const tiers = [
    { key: 'EXPIRED', label: 'Already Expired', color: '#C94C4C', daysLabel: '<= 0d' },
    { key: 'CRITICAL_7D', label: 'Expiring <= 7 Days', color: '#E53E3E', daysLabel: '1–7d' },
    { key: 'URGENT_30D', label: 'Expiring <= 30 Days', color: '#D99A35', daysLabel: '8–30d' },
    { key: 'MEDIUM_90D', label: 'Expiring <= 90 Days', color: '#60758A', daysLabel: '31–90d' },
    { key: 'STABLE', label: 'Beyond 90 Days', color: '#27856F', daysLabel: '> 90d' },
    { key: 'UNKNOWN', label: 'Missing / Unknown Expiry', color: '#A0AEC0', daysLabel: 'N/A' },
  ];

  return tiers.map(tier => {
    const matching = items.filter(item => {
      const days = item.daysToExpiry;
      if (days === null || days === undefined || !item.expiryDate) {
        return tier.key === 'UNKNOWN';
      }
      if (days <= 0) return tier.key === 'EXPIRED';
      if (days <= 7) return tier.key === 'CRITICAL_7D';
      if (days <= 30) return tier.key === 'URGENT_30D';
      if (days <= 90) return tier.key === 'MEDIUM_90D';
      return tier.key === 'STABLE';
    });

    return {
      tier: tier.key,
      label: tier.label,
      daysLabel: tier.daysLabel,
      color: tier.color,
      count: matching.length,
      items: matching,
      unitsBreakdown: groupQuantitiesByUnit(matching, 'totalQty'),
    };
  });
}

/**
 * Computes facility-wise inventory analysis comparing batches and quality issues.
 */
export function getFacilityInventoryAnalysis(items = []) {
  const facilityMap = new Map();

  for (const item of items) {
    const id = item.facilityId || 'UNKNOWN';
    const name = item.facilityName || id;

    if (!facilityMap.has(id)) {
      facilityMap.set(id, {
        facilityId: id,
        facilityName: name,
        shortName: name.length > 20 ? `${name.slice(0, 18)}…` : name,
        totalBatches: 0,
        usableBatches: 0,
        reservedBatches: 0,
        qualityIssueBatches: 0,
        foodBatches: 0,
        waterBatches: 0,
        medicalBatches: 0,
        items: [],
      });
    }

    const fac = facilityMap.get(id);
    fac.totalBatches += 1;
    fac.items.push(item);

    const isUsable = item.qualityStatus === 'VERIFIED_USABLE' && (item.usableQty || 0) > 0;
    const hasIssues = item.qualityStatus === 'QUARANTINED' ||
      item.qualityStatus === 'EXPIRED' ||
      item.qualityStatus === 'DAMAGED' ||
      (item.daysToExpiry !== null && item.daysToExpiry <= 0);

    if (isUsable) fac.usableBatches += 1;
    if ((item.reservedQty || 0) > 0) fac.reservedBatches += 1;
    if (hasIssues) fac.qualityIssueBatches += 1;

    const comm = String(item.commodity || item.commodityId).toUpperCase();
    if (comm === 'FOOD') fac.foodBatches += 1;
    else if (comm === 'WATER') fac.waterBatches += 1;
    else if (comm === 'MEDICAL') fac.medicalBatches += 1;
  }

  return [...facilityMap.values()];
}

/**
 * Computes individual resource SKU variation analysis.
 */
export function getResourceVariationAnalysis(items = [], categoryFilter = 'ALL') {
  let filtered = items;
  if (categoryFilter !== 'ALL') {
    filtered = items.filter(i => String(i.commodity || i.commodityId).toUpperCase() === categoryFilter);
  }

  const resourceMap = new Map();

  for (const item of filtered) {
    const name = item.name || item.id;
    const key = `${name}|${item.unit}`;

    if (!resourceMap.has(key)) {
      resourceMap.set(key, {
        name,
        shortName: name.length > 22 ? `${name.slice(0, 20)}…` : name,
        commodity: item.commodity,
        unit: item.unit,
        batchCount: 0,
        totalQty: 0,
        usableQty: 0,
        reservedQty: 0,
        quarantinedQty: 0,
        qualityStatus: item.qualityStatus,
        coldChainRequired: item.coldChainRequired || false,
        facilityName: item.facilityName,
        items: [],
      });
    }

    const r = resourceMap.get(key);
    r.batchCount += 1;
    r.totalQty += Number(item.totalQty || item.receivedQty || 0);
    r.usableQty += Number(item.usableQty || 0);
    r.reservedQty += Number(item.reservedQty || 0);
    r.quarantinedQty += Number(item.quarantinedQty || 0);
    r.items.push(item);
  }

  return [...resourceMap.values()];
}

