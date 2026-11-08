/**
 * ResQNet Geographic Intelligence & Location Data Model
 * Stage 4.1 Implementation: Multi-echelon humanitarian spatial data model,
 * strict coordinate boundary validation, and operational ledger entity linking.
 */

/**
 * Standardized Geographic Location Types
 */
export const GEOGRAPHIC_LOCATION_TYPE = {
  WAREHOUSE: 'WAREHOUSE',
  DISTRIBUTION_CENTRE: 'DISTRIBUTION_CENTRE',
  FOOD_BANK: 'FOOD_BANK',
  HOSPITAL: 'HOSPITAL',
  RELIEF_CAMP: 'RELIEF_CAMP',
  BENEFICIARY_LOCATION: 'BENEFICIARY_LOCATION',
  DISASTER_ZONE: 'DISASTER_ZONE',
};

/**
 * Standardized Location Operational Statuses
 */
export const LOCATION_OPERATIONAL_STATUS = {
  OPERATIONAL: 'OPERATIONAL',
  CONSTRAINED: 'CONSTRAINED',
  CRITICAL: 'CRITICAL',
  OFFLINE: 'OFFLINE',
  AFFECTED: 'AFFECTED',
};

/**
 * Validates latitude and longitude within physical WGS-84 coordinate bounds.
 * Latitude must be within [-90, +90].
 * Longitude must be within [-180, +180].
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {boolean} true if valid physical coordinates
 */
export function isValidCoordinate(latitude, longitude) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return false;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  if (lat < -90 || lat > 90) {
    return false;
  }

  if (lng < -180 || lng > 180) {
    return false;
  }

  return true;
}

/**
 * Normalizes coordinates from array [lat, lng] or object { lat, lng } / { latitude, longitude }.
 *
 * @param {Array<number>|Object} input
 * @returns {Object|null} { latitude, longitude, asArray: [lat, lng], asObject: { lat, lng } } or null
 */
export function normalizeCoordinates(input) {
  if (!input) return null;

  let lat;
  let lng;

  if (Array.isArray(input)) {
    if (input.length < 2) return null;
    lat = input[0];
    lng = input[1];
  } else if (typeof input === 'object') {
    lat = input.latitude ?? input.lat;
    lng = input.longitude ?? input.lng;
  } else {
    return null;
  }

  lat = Number(lat);
  lng = Number(lng);

  if (!isValidCoordinate(lat, lng)) {
    return null;
  }

  return {
    latitude: lat,
    longitude: lng,
    asArray: [lat, lng],
    asObject: { lat, lng },
  };
}

/**
 * Validates a single geographic entity record against the ResQNet schema.
 *
 * @param {Object} location
 * @param {Array<Object>} [existingLocations=[]] - To enforce unique ID constraints
 * @returns {Object} { ok: boolean, value?: Object, errors?: Array<string> }
 */
export function validateGeographicLocation(location, existingLocations = []) {
  const errors = [];

  if (!location || typeof location !== 'object') {
    return { ok: false, errors: ['Location record must be an object'] };
  }

  // 1. Unique ID
  if (!location.id || typeof location.id !== 'string' || !location.id.trim()) {
    errors.push('Location must have a non-empty string unique ID');
  } else if (existingLocations.some((loc) => loc.id === location.id.trim())) {
    errors.push(`Duplicate location ID: "${location.id}" is already registered`);
  }

  // 2. Name
  if (!location.name || typeof location.name !== 'string' || !location.name.trim()) {
    errors.push('Location must have a non-empty string name');
  }

  // 3. Location Type
  const validTypes = Object.values(GEOGRAPHIC_LOCATION_TYPE);
  if (!location.type || !validTypes.includes(location.type)) {
    errors.push(`Location type must be one of: ${validTypes.join(', ')}`);
  }

  // 4. Coordinates
  const normCoords = normalizeCoordinates(
    location.coordinates ??
      (location.latitude !== undefined && location.longitude !== undefined
        ? [location.latitude, location.longitude]
        : null)
  );

  if (!normCoords) {
    errors.push('Location must have valid physical coordinates (lat: [-90, 90], lng: [-180, 180])');
  }

  // 5. Operational Status
  const validStatuses = Object.values(LOCATION_OPERATIONAL_STATUS);
  if (location.operationalStatus && !validStatuses.includes(location.operationalStatus)) {
    errors.push(`Operational status must be one of: ${validStatuses.join(', ')}`);
  }

  // 6. Optional Capacity Validation
  if (location.capacity !== undefined && location.capacity !== null) {
    if (typeof location.capacity === 'number') {
      if (!Number.isFinite(location.capacity) || location.capacity < 0) {
        errors.push('Numeric capacity must be a non-negative number');
      }
    } else if (typeof location.capacity === 'object') {
      if (
        location.capacity.max !== undefined &&
        (!Number.isFinite(location.capacity.max) || location.capacity.max < 0)
      ) {
        errors.push('Capacity max must be a non-negative number');
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Normalized geographic entity record
  const validated = {
    id: location.id.trim(),
    name: location.name.trim(),
    code: location.code || location.id.trim(),
    type: location.type,
    latitude: normCoords.latitude,
    longitude: normCoords.longitude,
    coordinates: normCoords.asArray,
    region: location.region || location.address || 'Operational Area',
    address: location.address || location.region || 'Operational Area',
    operationalStatus: location.operationalStatus || LOCATION_OPERATIONAL_STATUS.OPERATIONAL,
    capacity: location.capacity ?? null,
    // Explicit operational entity relationships
    relatedFacilityId: location.relatedFacilityId || null,
    relatedBeneficiaryGroupId: location.relatedBeneficiaryGroupId || null,
    relatedDemandIds: Array.isArray(location.relatedDemandIds) ? location.relatedDemandIds : [],
    radiusMeters: Number.isFinite(location.radiusMeters) ? location.radiusMeters : null,
    notes: location.notes || '',
    isDemo: location.isDemo !== undefined ? Boolean(location.isDemo) : true,
  };

  return { ok: true, value: validated };
}

/**
 * Validates an entire collection of geographic locations.
 * Rejects collections with duplicate IDs or invalid entities.
 *
 * @param {Array<Object>} locations
 * @returns {Object} { ok: boolean, validLocations: Array<Object>, rejectedCount: number, errors: Array<string> }
 */
export function validateGeographicDataset(locations) {
  if (!Array.isArray(locations)) {
    return { ok: false, validLocations: [], rejectedCount: 0, errors: ['Dataset must be an array'] };
  }

  const validLocations = [];
  const errors = [];
  let rejectedCount = 0;

  for (let i = 0; i < locations.length; i++) {
    const candidate = locations[i];
    const validation = validateGeographicLocation(candidate, validLocations);

    if (validation.ok) {
      validLocations.push(validation.value);
    } else {
      rejectedCount++;
      errors.push(`Location at index ${i} (${candidate?.id || 'unnamed'}): ${validation.errors.join('; ')}`);
    }
  }

  return {
    ok: errors.length === 0,
    validLocations,
    rejectedCount,
    errors,
  };
}

/**
 * Projects live operational records onto a geographic entity without duplicating records.
 *
 * @param {Object} location - Normalized geographic entity
 * @param {Object} operationalState - { inventoryLots, demandRecords, stockReservations, dispatchOrders }
 * @param {Function} [lotBalancesFn] - Domain lotBalances function
 * @returns {Object} Location enriched with live operational context
 */
export function enrichLocationWithOperationalContext(
  location,
  operationalState = {},
  lotBalancesFn = null
) {
  if (!location) return null;

  const {
    inventoryLots = [],
    demandRecords = [],
    dispatchOrders = [],
  } = operationalState;

  // 1. Resolve live inventory (if location is a warehouse, depot, or linked facility)
  let liveInventory = {
    lotCount: 0,
    usableByCommodity: {},
    availableByCommodity: {},
    reservedByCommodity: {},
    totalUsableUnits: 0,
  };

  const facilityKey = location.relatedFacilityId || location.code || location.id;
  const matchingLots = inventoryLots.filter(
    (lot) => lot.facilityId === facilityKey || lot.facilityId === location.id || lot.facilityId === location.code
  );

  if (matchingLots.length > 0) {
    liveInventory.lotCount = matchingLots.length;

    for (const lot of matchingLots) {
      const comm = lot.commodityId || lot.commodity;
      const unit = lot.unit;
      const key = `${comm} (${unit})`;

      let usable = lot.usableQty || 0;
      let available = lot.availableQty || 0;
      let reserved = lot.reservedQty || 0;

      if (typeof lotBalancesFn === 'function') {
        const bal = lotBalancesFn(lot);
        usable = bal.usable;
        available = bal.available;
        reserved = bal.reserved;
      }

      liveInventory.usableByCommodity[key] = (liveInventory.usableByCommodity[key] || 0) + usable;
      liveInventory.availableByCommodity[key] = (liveInventory.availableByCommodity[key] || 0) + available;
      liveInventory.reservedByCommodity[key] = (liveInventory.reservedByCommodity[key] || 0) + reserved;
      liveInventory.totalUsableUnits += usable;
    }
  }

  // 2. Resolve live distress demand (if location is a camp, hospital, or beneficiary site)
  let liveDemand = {
    demandCount: 0,
    unmetDeficitByCommodity: {},
    fulfilledByCommodity: {},
    hasCriticalUnmet: false,
  };

  const groupKey = location.relatedBeneficiaryGroupId || location.code || location.id;
  const directDemandIds = new Set(location.relatedDemandIds || []);

  const matchingDemands = demandRecords.filter(
    (d) =>
      directDemandIds.has(d.id) ||
      d.beneficiaryGroupId === groupKey ||
      d.location === location.name ||
      d.location === location.region
  );

  if (matchingDemands.length > 0) {
    liveDemand.demandCount = matchingDemands.length;

    for (const d of matchingDemands) {
      const comm = d.commodityId || d.commodity;
      const unit = d.unit;
      const key = `${comm} (${unit})`;
      const unmet = Math.max(0, Number(d.quantity || 0) - Number(d.fulfilledQuantity || 0));

      liveDemand.unmetDeficitByCommodity[key] = (liveDemand.unmetDeficitByCommodity[key] || 0) + unmet;
      liveDemand.fulfilledByCommodity[key] =
        (liveDemand.fulfilledByCommodity[key] || 0) + Number(d.fulfilledQuantity || 0);

      if (d.priority === 'CRITICAL' && unmet > 0) {
        liveDemand.hasCriticalUnmet = true;
      }
    }
  }

  // 3. Resolve active dispatch shipments targeting or departing this location
  const inboundDispatches = dispatchOrders.filter(
    (dsp) =>
      ['READY', 'IN_TRANSIT', 'ARRIVED_AWAITING_POD'].includes(dsp.status) &&
      (dsp.destinationFacilityId === location.id ||
        dsp.destinationFacilityId === location.code ||
        dsp.destination === location.name)
  );

  return {
    ...location,
    operationalContext: {
      liveInventory,
      liveDemand,
      activeInboundConvoys: inboundDispatches.length,
      hasLiveStock: liveInventory.lotCount > 0,
      hasActiveDemand: liveDemand.demandCount > 0,
    },
  };
}

