/**
 * ResQNet Stage 4.1 — Geographic Data Model Unit Tests
 *
 * Covers:
 * - isValidCoordinate: boundary validation
 * - normalizeCoordinates: array and object forms
 * - validateGeographicLocation: schema enforcement, duplicate ID, all 7 types
 * - validateGeographicDataset: multi-record batch validation
 * - enrichLocationWithOperationalContext: inventory and demand projection
 * - Zustand store integration: addGeographicLocation / updateGeographicLocation / getGeographicEntities
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

// ─── Domain Under Test ────────────────────────────────────────────────────────
import {
  isValidCoordinate,
  normalizeCoordinates,
  validateGeographicLocation,
  validateGeographicDataset,
  enrichLocationWithOperationalContext,
  GEOGRAPHIC_LOCATION_TYPE,
  LOCATION_OPERATIONAL_STATUS,
} from '../src/domain/geographicModel.js';

// ─── Sample Demo Dataset ──────────────────────────────────────────────────────
import { DEMO_GEOGRAPHIC_LOCATIONS } from '../src/mock-data/geographicLocations.mock.js';

// ─── Zustand Store ────────────────────────────────────────────────────────────
import { useAppStore } from '../src/store/useAppStore.js';

// ─── Helper: minimal valid location ──────────────────────────────────────────
function makeLocation(overrides = {}) {
  return {
    id: `GEO-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'Test Location',
    type: GEOGRAPHIC_LOCATION_TYPE.WAREHOUSE,
    coordinates: [-19.832, 34.856],
    operationalStatus: LOCATION_OPERATIONAL_STATUS.OPERATIONAL,
    isDemo: true,
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. isValidCoordinate
// ═════════════════════════════════════════════════════════════════════════════
describe('isValidCoordinate', () => {
  it('accepts valid lat/lng well within bounds', () => {
    assert.equal(isValidCoordinate(0, 0), true);
    assert.equal(isValidCoordinate(-19.832, 34.856), true);
    assert.equal(isValidCoordinate(51.5074, -0.1278), true);
  });

  it('accepts exact boundary values', () => {
    assert.equal(isValidCoordinate(90, 180), true);
    assert.equal(isValidCoordinate(-90, -180), true);
  });

  it('rejects latitude > 90', () => {
    assert.equal(isValidCoordinate(90.001, 0), false);
    assert.equal(isValidCoordinate(100, 0), false);
  });

  it('rejects latitude < -90', () => {
    assert.equal(isValidCoordinate(-90.001, 0), false);
    assert.equal(isValidCoordinate(-100, 0), false);
  });

  it('rejects longitude > 180', () => {
    assert.equal(isValidCoordinate(0, 180.001), false);
    assert.equal(isValidCoordinate(0, 200), false);
  });

  it('rejects longitude < -180', () => {
    assert.equal(isValidCoordinate(0, -180.001), false);
    assert.equal(isValidCoordinate(0, -200), false);
  });

  it('rejects NaN', () => {
    assert.equal(isValidCoordinate(NaN, 0), false);
    assert.equal(isValidCoordinate(0, NaN), false);
  });

  it('rejects null and undefined', () => {
    assert.equal(isValidCoordinate(null, 0), false);
    assert.equal(isValidCoordinate(0, null), false);
    assert.equal(isValidCoordinate(undefined, 0), false);
    assert.equal(isValidCoordinate(0, undefined), false);
  });

  it('rejects non-numeric strings that do not coerce to valid numbers', () => {
    assert.equal(isValidCoordinate('abc', 0), false);
    assert.equal(isValidCoordinate(0, 'xyz'), false);
  });

  it('accepts numeric strings that coerce to valid numbers', () => {
    // Number('-19.832') is valid
    assert.equal(isValidCoordinate('-19.832', '34.856'), true);
  });

  it('rejects Infinity', () => {
    assert.equal(isValidCoordinate(Infinity, 0), false);
    assert.equal(isValidCoordinate(0, -Infinity), false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. normalizeCoordinates
// ═════════════════════════════════════════════════════════════════════════════
describe('normalizeCoordinates', () => {
  it('normalizes array [lat, lng] form', () => {
    const result = normalizeCoordinates([-19.832, 34.856]);
    assert.ok(result);
    assert.equal(result.latitude, -19.832);
    assert.equal(result.longitude, 34.856);
    assert.deepEqual(result.asArray, [-19.832, 34.856]);
    assert.deepEqual(result.asObject, { lat: -19.832, lng: 34.856 });
  });

  it('normalizes { lat, lng } object form', () => {
    const result = normalizeCoordinates({ lat: 51.5074, lng: -0.1278 });
    assert.ok(result);
    assert.equal(result.latitude, 51.5074);
    assert.equal(result.longitude, -0.1278);
  });

  it('normalizes { latitude, longitude } object form', () => {
    const result = normalizeCoordinates({ latitude: -19.745, longitude: 34.912 });
    assert.ok(result);
    assert.equal(result.latitude, -19.745);
    assert.equal(result.longitude, 34.912);
  });

  it('returns null for null or undefined input', () => {
    assert.equal(normalizeCoordinates(null), null);
    assert.equal(normalizeCoordinates(undefined), null);
  });

  it('returns null for empty array', () => {
    assert.equal(normalizeCoordinates([]), null);
    assert.equal(normalizeCoordinates([0]), null);
  });

  it('returns null for out-of-bounds coordinates', () => {
    assert.equal(normalizeCoordinates([91, 0]), null);
    assert.equal(normalizeCoordinates([0, 200]), null);
  });

  it('returns null for non-object, non-array input', () => {
    assert.equal(normalizeCoordinates('string'), null);
    assert.equal(normalizeCoordinates(42), null);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. validateGeographicLocation — schema enforcement
// ═════════════════════════════════════════════════════════════════════════════
describe('validateGeographicLocation', () => {
  it('accepts a fully valid location and returns normalized record', () => {
    const loc = makeLocation();
    const result = validateGeographicLocation(loc);
    assert.ok(result.ok, `Expected ok but got errors: ${result.errors?.join(', ')}`);
    assert.equal(result.value.id, loc.id);
    assert.equal(result.value.name, loc.name);
    assert.equal(result.value.type, loc.type);
    assert.equal(typeof result.value.latitude, 'number');
    assert.equal(typeof result.value.longitude, 'number');
  });

  it('normalizes coordinates from array to both asArray and object fields', () => {
    const loc = makeLocation({ coordinates: [-19.832, 34.856] });
    const result = validateGeographicLocation(loc);
    assert.ok(result.ok);
    assert.equal(result.value.latitude, -19.832);
    assert.equal(result.value.longitude, 34.856);
    assert.deepEqual(result.value.coordinates, [-19.832, 34.856]);
  });

  it('defaults operationalStatus to OPERATIONAL when omitted', () => {
    const loc = makeLocation();
    delete loc.operationalStatus;
    const result = validateGeographicLocation(loc);
    assert.ok(result.ok);
    assert.equal(result.value.operationalStatus, LOCATION_OPERATIONAL_STATUS.OPERATIONAL);
  });

  it('defaults isDemo to true when not provided', () => {
    const loc = makeLocation();
    delete loc.isDemo;
    const result = validateGeographicLocation(loc);
    assert.ok(result.ok);
    assert.equal(result.value.isDemo, true);
  });

  it('preserves isDemo: false when explicitly set', () => {
    const loc = makeLocation({ isDemo: false });
    const result = validateGeographicLocation(loc);
    assert.ok(result.ok);
    assert.equal(result.value.isDemo, false);
  });

  it('rejects location with no id', () => {
    const loc = makeLocation({ id: '' });
    const result = validateGeographicLocation(loc);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('ID')));
  });

  it('rejects location with no name', () => {
    const loc = makeLocation({ name: '   ' });
    const result = validateGeographicLocation(loc);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.toLowerCase().includes('name')));
  });

  it('rejects invalid location type', () => {
    const loc = makeLocation({ type: 'INVALID_TYPE' });
    const result = validateGeographicLocation(loc);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('type')));
  });

  it('rejects invalid coordinates (out of bounds)', () => {
    const loc = makeLocation({ coordinates: [91, 0] });
    const result = validateGeographicLocation(loc);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('coordinate')));
  });

  it('rejects invalid coordinates (NaN)', () => {
    const loc = makeLocation({ coordinates: [NaN, 0] });
    const result = validateGeographicLocation(loc);
    assert.equal(result.ok, false);
  });

  it('rejects invalid operationalStatus', () => {
    const loc = makeLocation({ operationalStatus: 'INVALID_STATUS' });
    const result = validateGeographicLocation(loc);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('status')));
  });

  it('rejects negative numeric capacity', () => {
    const loc = makeLocation({ capacity: -100 });
    const result = validateGeographicLocation(loc);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('capacity')));
  });

  it('rejects negative capacity.max in object form', () => {
    const loc = makeLocation({ capacity: { max: -50, unit: 'm³' } });
    const result = validateGeographicLocation(loc);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('Capacity max')));
  });

  it('rejects non-object input', () => {
    const result = validateGeographicLocation(null);
    assert.equal(result.ok, false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. validateGeographicLocation — duplicate ID enforcement
// ═════════════════════════════════════════════════════════════════════════════
describe('validateGeographicLocation — duplicate ID', () => {
  it('rejects a location whose ID already exists in existingLocations', () => {
    const existing = makeLocation({ id: 'GEO-DUP-01' });
    const { value: validatedExisting } = validateGeographicLocation(existing);

    const duplicate = makeLocation({ id: 'GEO-DUP-01' });
    const result = validateGeographicLocation(duplicate, [validatedExisting]);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('Duplicate')));
  });

  it('allows different IDs even with otherwise identical data', () => {
    const existing = validateGeographicLocation(makeLocation({ id: 'GEO-A-01' })).value;
    const second = makeLocation({ id: 'GEO-A-02' });
    const result = validateGeographicLocation(second, [existing]);
    assert.ok(result.ok);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. All 7 GEOGRAPHIC_LOCATION_TYPE values
// ═════════════════════════════════════════════════════════════════════════════
describe('GEOGRAPHIC_LOCATION_TYPE — all 7 types accepted', () => {
  const allTypes = [
    GEOGRAPHIC_LOCATION_TYPE.WAREHOUSE,
    GEOGRAPHIC_LOCATION_TYPE.DISTRIBUTION_CENTRE,
    GEOGRAPHIC_LOCATION_TYPE.FOOD_BANK,
    GEOGRAPHIC_LOCATION_TYPE.HOSPITAL,
    GEOGRAPHIC_LOCATION_TYPE.RELIEF_CAMP,
    GEOGRAPHIC_LOCATION_TYPE.BENEFICIARY_LOCATION,
    GEOGRAPHIC_LOCATION_TYPE.DISASTER_ZONE,
  ];

  for (const type of allTypes) {
    it(`accepts type: ${type}`, () => {
      const loc = makeLocation({ id: `GEO-TYPE-${type}`, type });
      const result = validateGeographicLocation(loc);
      assert.ok(result.ok, `Expected ok for type "${type}" but got: ${result.errors?.join(', ')}`);
      assert.equal(result.value.type, type);
    });
  }

  it('defines exactly 7 location types', () => {
    assert.equal(Object.keys(GEOGRAPHIC_LOCATION_TYPE).length, 7);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. validateGeographicDataset — batch validation
// ═════════════════════════════════════════════════════════════════════════════
describe('validateGeographicDataset', () => {
  it('validates all 7 DEMO_GEOGRAPHIC_LOCATIONS without errors', () => {
    const result = validateGeographicDataset(DEMO_GEOGRAPHIC_LOCATIONS);
    assert.ok(
      result.ok,
      `Demo dataset failed validation:\n${result.errors.join('\n')}`
    );
    assert.equal(result.validLocations.length, DEMO_GEOGRAPHIC_LOCATIONS.length);
    assert.equal(result.rejectedCount, 0);
  });

  it('reports errors for invalid entries and continues validating the rest', () => {
    const mixed = [
      makeLocation({ id: 'GEO-VALID-01' }),
      { id: '', name: 'Missing type', coordinates: [-19, 34] }, // invalid
      makeLocation({ id: 'GEO-VALID-02' }),
    ];
    const result = validateGeographicDataset(mixed);
    assert.equal(result.ok, false);
    assert.equal(result.validLocations.length, 2);
    assert.equal(result.rejectedCount, 1);
  });

  it('detects duplicate IDs within the batch', () => {
    const batch = [
      makeLocation({ id: 'GEO-DUP-BATCH-01' }),
      makeLocation({ id: 'GEO-DUP-BATCH-01' }), // duplicate
    ];
    const result = validateGeographicDataset(batch);
    assert.equal(result.ok, false);
    assert.equal(result.rejectedCount, 1);
  });

  it('returns ok:false for non-array input', () => {
    const result = validateGeographicDataset(null);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('array')));
  });

  it('returns ok:true for empty array', () => {
    const result = validateGeographicDataset([]);
    assert.ok(result.ok);
    assert.equal(result.validLocations.length, 0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. DEMO_GEOGRAPHIC_LOCATIONS — DEMO labeling
// ═════════════════════════════════════════════════════════════════════════════
describe('DEMO_GEOGRAPHIC_LOCATIONS — demo labeling and structure', () => {
  it('every demo location has isDemo: true', () => {
    for (const loc of DEMO_GEOGRAPHIC_LOCATIONS) {
      assert.equal(
        loc.isDemo,
        true,
        `Location ${loc.id} must have isDemo: true`
      );
    }
  });

  it('covers all 7 geographic entity types', () => {
    const coveredTypes = new Set(DEMO_GEOGRAPHIC_LOCATIONS.map((l) => l.type));
    for (const type of Object.values(GEOGRAPHIC_LOCATION_TYPE)) {
      assert.ok(
        coveredTypes.has(type),
        `Demo dataset missing required type: ${type}`
      );
    }
  });

  it('all demo locations have valid WGS-84 coordinates', () => {
    for (const loc of DEMO_GEOGRAPHIC_LOCATIONS) {
      const lat = loc.latitude ?? (Array.isArray(loc.coordinates) ? loc.coordinates[0] : null);
      const lng = loc.longitude ?? (Array.isArray(loc.coordinates) ? loc.coordinates[1] : null);
      assert.ok(
        isValidCoordinate(lat, lng),
        `Location ${loc.id} has invalid coordinates: [${lat}, ${lng}]`
      );
    }
  });

  it('all demo locations have unique IDs', () => {
    const ids = DEMO_GEOGRAPHIC_LOCATIONS.map((l) => l.id);
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length, 'Duplicate IDs found in DEMO_GEOGRAPHIC_LOCATIONS');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. enrichLocationWithOperationalContext — operational linking
// ═════════════════════════════════════════════════════════════════════════════
describe('enrichLocationWithOperationalContext', () => {
  it('returns null for null input', () => {
    const result = enrichLocationWithOperationalContext(null, {});
    assert.equal(result, null);
  });

  it('returns location with operationalContext when no matching records', () => {
    const loc = validateGeographicLocation(makeLocation()).value;
    const result = enrichLocationWithOperationalContext(loc, {
      inventoryLots: [],
      demandRecords: [],
      stockReservations: [],
      dispatchOrders: [],
    });
    assert.ok(result);
    assert.equal(result.id, loc.id);
    assert.ok('operationalContext' in result);
    assert.equal(result.operationalContext.liveInventory.lotCount, 0);
    assert.equal(result.operationalContext.liveDemand.demandCount, 0);
    assert.equal(result.operationalContext.hasLiveStock, false);
    assert.equal(result.operationalContext.hasActiveDemand, false);
  });

  it('projects inventory from inventoryLots linked by relatedFacilityId', () => {
    const facilityId = 'FAC-TEST-01';
    const { value: loc } = validateGeographicLocation(
      makeLocation({ id: 'GEO-ENR-01', relatedFacilityId: facilityId })
    );
    const fakeState = {
      inventoryLots: [
        {
          id: 'LOT-ENR-01',
          facilityId,
          commodityId: 'FOOD',
          unit: 'packets',
          quantityReceived: 500,
          qualityStatus: 'QC_PASSED',
          transactions: [
            {
              type: 'RECEIPT',
              quantity: 500,
              unit: 'packets',
              commodityId: 'FOOD',
              at: new Date().toISOString(),
            },
          ],
          reservations: [],
          expiryDate: '2027-12-31',
        },
      ],
      demandRecords: [],
      stockReservations: [],
      dispatchOrders: [],
    };

    const result = enrichLocationWithOperationalContext(loc, fakeState, null);
    assert.ok(result);
    assert.equal(result.operationalContext.liveInventory.lotCount, 1);
    assert.equal(result.operationalContext.hasLiveStock, true);
  });

  it('projects demand from demandRecords linked by relatedDemandIds', () => {
    const { value: loc } = validateGeographicLocation(
      makeLocation({ id: 'GEO-ENR-02', relatedDemandIds: ['DEM-01'] })
    );
    const fakeState = {
      inventoryLots: [],
      demandRecords: [
        {
          id: 'DEM-01',
          commodityId: 'WATER',
          quantity: 2000,
          fulfilledQuantity: 500,
          unit: 'containers',
          verificationStatus: 'VERIFIED',
          priority: 'HIGH',
        },
      ],
      stockReservations: [],
      dispatchOrders: [],
    };

    const result = enrichLocationWithOperationalContext(loc, fakeState);
    assert.ok(result);
    assert.equal(result.operationalContext.liveDemand.demandCount, 1);
    assert.equal(result.operationalContext.hasActiveDemand, true);
    // 2000 - 500 = 1500 unmet units for 'WATER (containers)'
    const unmetTotal = Object.values(
      result.operationalContext.liveDemand.unmetDeficitByCommodity
    ).reduce((s, v) => s + v, 0);
    assert.equal(unmetTotal, 1500);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. Zustand Store Integration
// ═════════════════════════════════════════════════════════════════════════════
describe('useAppStore — geographic location integration', () => {
  it('store initializes with DEMO_GEOGRAPHIC_LOCATIONS', () => {
    const state = useAppStore.getState();
    assert.ok(Array.isArray(state.geographicLocations));
    assert.ok(state.geographicLocations.length > 0);
    assert.equal(
      state.geographicLocations.length,
      DEMO_GEOGRAPHIC_LOCATIONS.length
    );
  });

  it('addGeographicLocation registers a valid location and writes audit event', () => {
    const store = useAppStore.getState();
    const before = store.geographicLocations.length;
    const beforeAudit = store.auditEvents.length;

    const newLoc = makeLocation({
      id: `GEO-STORE-${Date.now()}`,
      name: 'Integration Test Warehouse',
      type: GEOGRAPHIC_LOCATION_TYPE.WAREHOUSE,
    });

    const result = useAppStore.getState().addGeographicLocation(newLoc);
    assert.ok(result.ok, `addGeographicLocation failed: ${result.errors?.join(', ')}`);

    const after = useAppStore.getState();
    assert.equal(after.geographicLocations.length, before + 1);
    assert.ok(after.geographicLocations.some((l) => l.id === newLoc.id));
    assert.equal(after.auditEvents.length, beforeAudit + 1);
    assert.equal(
      after.auditEvents[after.auditEvents.length - 1].action,
      'GEOGRAPHIC_LOCATION_REGISTERED'
    );
  });

  it('addGeographicLocation rejects a duplicate ID without mutation', () => {
    const state = useAppStore.getState();
    const existing = state.geographicLocations[0];
    const beforeCount = state.geographicLocations.length;

    const duplicate = makeLocation({ id: existing.id });
    const result = useAppStore.getState().addGeographicLocation(duplicate);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('Duplicate')));
    assert.equal(useAppStore.getState().geographicLocations.length, beforeCount);
  });

  it('addGeographicLocation rejects invalid coordinates without mutation', () => {
    const beforeCount = useAppStore.getState().geographicLocations.length;
    const badLoc = makeLocation({ id: `GEO-BAD-${Date.now()}`, coordinates: [999, 0] });
    const result = useAppStore.getState().addGeographicLocation(badLoc);
    assert.equal(result.ok, false);
    assert.equal(useAppStore.getState().geographicLocations.length, beforeCount);
  });

  it('updateGeographicLocation updates an existing location', () => {
    // First add a fresh location
    const loc = makeLocation({ id: `GEO-UPD-${Date.now()}`, name: 'Original Name' });
    useAppStore.getState().addGeographicLocation(loc);

    const result = useAppStore.getState().updateGeographicLocation(loc.id, {
      name: 'Updated Name',
      operationalStatus: LOCATION_OPERATIONAL_STATUS.CONSTRAINED,
    });
    assert.ok(result.ok, `updateGeographicLocation failed: ${result.errors?.join(', ')}`);
    const updated = useAppStore
      .getState()
      .geographicLocations.find((l) => l.id === loc.id);
    assert.equal(updated.name, 'Updated Name');
    assert.equal(updated.operationalStatus, LOCATION_OPERATIONAL_STATUS.CONSTRAINED);
  });

  it('updateGeographicLocation returns error for non-existent ID', () => {
    const result = useAppStore.getState().updateGeographicLocation('GEO-NONEXISTENT-9999', {
      name: 'Ghost',
    });
    assert.equal(result.ok, false);
    assert.ok(result.error.includes('not found'));
  });

  it('getGeographicEntities returns enriched locations for all registered entries', () => {
    const entities = useAppStore.getState().getGeographicEntities();
    assert.ok(Array.isArray(entities));
    assert.ok(entities.length > 0);
    // Each entity should have an operationalContext block
    for (const entity of entities) {
      assert.ok('operationalContext' in entity, `Entity ${entity.id} missing operationalContext`);
      assert.ok(
        'liveInventory' in entity.operationalContext,
        `Entity ${entity.id} missing operationalContext.liveInventory`
      );
      assert.ok(
        'liveDemand' in entity.operationalContext,
        `Entity ${entity.id} missing operationalContext.liveDemand`
      );
    }
  });
});
