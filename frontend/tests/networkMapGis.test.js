/**
 * ResQNet — Stage 4.2 GIS Map Tests
 *
 * Tests:
 *  1. GEO_TYPE_STYLES covers all 7 GEOGRAPHIC_LOCATION_TYPE values
 *  2. isValidCoordinate rejects invalid boundary values
 *  3. isValidCoordinate accepts valid boundary values
 *  4. DEMO_GEOGRAPHIC_LOCATIONS — all 7 locations have valid coordinates
 *  5. DEMO_GEOGRAPHIC_LOCATIONS — all 7 locations are marked isDemo: true
 *  6. DEMO_GEOGRAPHIC_LOCATIONS — covers all 7 geographic entity types
 *  7. Zustand getGeographicEntities returns enriched locations with operationalContext
 *  8. Zustand getGeographicEntities returns at least 7 DEMO locations
 *  9. geoVisibleTypes filter logic — includes/excludes types correctly
 * 10. geoLocations coordinate boundary filter — rejects out-of-range lat/lng
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── Domain imports ───────────────────────────────────────────────────────────
import {
  GEOGRAPHIC_LOCATION_TYPE,
  isValidCoordinate,
} from '../src/domain/geographicModel.js';

// ─── Mock data import ─────────────────────────────────────────────────────────
import { DEMO_GEOGRAPHIC_LOCATIONS } from '../src/mock-data/geographicLocations.mock.js';

// ─── GEO_TYPE_STYLES — parsed from source (avoids DOM/Leaflet requirement) ────
// We read GEO_TYPE_STYLES directly by parsing the source file
// rather than importing the JSX component (which requires DOM + Leaflet).
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const markerLayerSrc = readFileSync(
  path.resolve(__dirname, '../src/features/network-map/components/GeoModelMarkerLayer.jsx'),
  'utf-8'
);

/**
 * Extract GEO_TYPE_STYLES keys from source text.
 * The object is defined as: export const GEO_TYPE_STYLES = { KEY: { ... }, ... }
 */
function extractGeoTypeStyleKeys(src) {
  const match = src.match(/export const GEO_TYPE_STYLES\s*=\s*\{([\s\S]*?)\};/m);
  if (!match) return [];
  const body = match[1];
  const keys = [];
  // Match either [GEOGRAPHIC_LOCATION_TYPE.TYPE_NAME] or TYPE_NAME:
  const keyPattern = /^\s+(?:\[GEOGRAPHIC_LOCATION_TYPE\.([A-Z_]+)\]|([A-Z_]+))\s*:/gm;
  let m;
  while ((m = keyPattern.exec(body)) !== null) {
    keys.push(m[1] || m[2]);
  }
  return keys;
}

// ─── Zustand store import ─────────────────────────────────────────────────────
import { useAppStore } from '../src/store/useAppStore.js';

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Stage 4.2 — GIS Map: GEO_TYPE_STYLES coverage', () => {
  it('GEO_TYPE_STYLES covers all 7 GEOGRAPHIC_LOCATION_TYPE values', () => {
    const styleKeys = extractGeoTypeStyleKeys(markerLayerSrc);
    const expectedTypes = Object.values(GEOGRAPHIC_LOCATION_TYPE);

    for (const type of expectedTypes) {
      assert.ok(
        styleKeys.includes(type),
        `GEO_TYPE_STYLES is missing entry for GEOGRAPHIC_LOCATION_TYPE.${type}`
      );
    }
    assert.equal(styleKeys.length, 7, `Expected 7 style keys, got ${styleKeys.length}`);
  });
});

describe('Stage 4.2 — GIS Map: Coordinate Validation', () => {
  it('rejects null latitude', () => {
    assert.equal(isValidCoordinate(null, 34.856), false);
  });

  it('rejects null longitude', () => {
    assert.equal(isValidCoordinate(-19.832, null), false);
  });

  it('rejects undefined latitude', () => {
    assert.equal(isValidCoordinate(undefined, 34.856), false);
  });

  it('rejects undefined longitude', () => {
    assert.equal(isValidCoordinate(-19.832, undefined), false);
  });

  it('rejects NaN latitude', () => {
    assert.equal(isValidCoordinate(NaN, 34.856), false);
  });

  it('rejects NaN longitude', () => {
    assert.equal(isValidCoordinate(-19.832, NaN), false);
  });

  it('rejects latitude > 90', () => {
    assert.equal(isValidCoordinate(90.001, 0), false);
  });

  it('rejects latitude < -90', () => {
    assert.equal(isValidCoordinate(-90.001, 0), false);
  });

  it('rejects longitude > 180', () => {
    assert.equal(isValidCoordinate(0, 180.001), false);
  });

  it('rejects longitude < -180', () => {
    assert.equal(isValidCoordinate(0, -180.001), false);
  });

  it('accepts valid mid-range coordinates', () => {
    assert.equal(isValidCoordinate(-19.832, 34.856), true);
  });

  it('accepts boundary latitude exactly 90', () => {
    assert.equal(isValidCoordinate(90, 0), true);
  });

  it('accepts boundary latitude exactly -90', () => {
    assert.equal(isValidCoordinate(-90, 0), true);
  });

  it('accepts boundary longitude exactly 180', () => {
    assert.equal(isValidCoordinate(0, 180), true);
  });

  it('accepts boundary longitude exactly -180', () => {
    assert.equal(isValidCoordinate(0, -180), true);
  });

  it('accepts zero/zero coordinates (Gulf of Guinea)', () => {
    assert.equal(isValidCoordinate(0, 0), true);
  });
});

describe('Stage 4.2 — GIS Map: DEMO_GEOGRAPHIC_LOCATIONS dataset', () => {
  it('contains exactly 7 DEMO locations', () => {
    assert.equal(
      DEMO_GEOGRAPHIC_LOCATIONS.length,
      7,
      `Expected 7 DEMO locations, got ${DEMO_GEOGRAPHIC_LOCATIONS.length}`
    );
  });

  it('all 7 DEMO locations have valid WGS-84 coordinates', () => {
    for (const loc of DEMO_GEOGRAPHIC_LOCATIONS) {
      assert.ok(
        isValidCoordinate(loc.latitude, loc.longitude),
        `Location ${loc.id} has invalid coordinates: lat=${loc.latitude}, lng=${loc.longitude}`
      );
    }
  });

  it('all 7 DEMO locations are marked isDemo: true', () => {
    for (const loc of DEMO_GEOGRAPHIC_LOCATIONS) {
      assert.equal(
        loc.isDemo,
        true,
        `Location ${loc.id} is not marked isDemo: true`
      );
    }
  });

  it('all 7 DEMO locations have a unique ID', () => {
    const ids = DEMO_GEOGRAPHIC_LOCATIONS.map((l) => l.id);
    const unique = new Set(ids);
    assert.equal(unique.size, 7, `Duplicate IDs found in DEMO_GEOGRAPHIC_LOCATIONS`);
  });

  it('DEMO locations cover all 7 GEOGRAPHIC_LOCATION_TYPE values', () => {
    const presentTypes = new Set(DEMO_GEOGRAPHIC_LOCATIONS.map((l) => l.type));
    const expectedTypes = Object.values(GEOGRAPHIC_LOCATION_TYPE);
    for (const type of expectedTypes) {
      assert.ok(
        presentTypes.has(type),
        `DEMO_GEOGRAPHIC_LOCATIONS is missing a location of type ${type}`
      );
    }
  });

  it('no DEMO location has a latitude outside [-90, 90]', () => {
    for (const loc of DEMO_GEOGRAPHIC_LOCATIONS) {
      assert.ok(
        loc.latitude >= -90 && loc.latitude <= 90,
        `Location ${loc.id} latitude ${loc.latitude} is out of bounds`
      );
    }
  });

  it('no DEMO location has a longitude outside [-180, 180]', () => {
    for (const loc of DEMO_GEOGRAPHIC_LOCATIONS) {
      assert.ok(
        loc.longitude >= -180 && loc.longitude <= 180,
        `Location ${loc.id} longitude ${loc.longitude} is out of bounds`
      );
    }
  });
});

describe('Stage 4.2 — GIS Map: Zustand store getGeographicEntities', () => {
  it('getGeographicEntities is a function on the store', () => {
    assert.equal(typeof useAppStore.getState().getGeographicEntities, 'function');
  });

  it('returns at least 7 entries (DEMO locations seeded at init)', () => {
    const locations = useAppStore.getState().getGeographicEntities();
    assert.ok(
      Array.isArray(locations),
      'getGeographicEntities should return an array'
    );
    assert.ok(
      locations.length >= 7,
      `Expected at least 7 geographic locations, got ${locations.length}`
    );
  });

  it('every returned location has an operationalContext property', () => {
    const locations = useAppStore.getState().getGeographicEntities();
    for (const loc of locations) {
      assert.ok(
        'operationalContext' in loc,
        `Location ${loc.id} is missing operationalContext`
      );
    }
  });

  it('operationalContext contains liveInventory and liveDemand', () => {
    const locations = useAppStore.getState().getGeographicEntities();
    for (const loc of locations) {
      const ctx = loc.operationalContext;
      assert.ok(
        ctx !== null && typeof ctx === 'object',
        `Location ${loc.id} operationalContext is not an object`
      );
      assert.ok(
        'liveInventory' in ctx,
        `Location ${loc.id} operationalContext missing liveInventory`
      );
      assert.ok(
        'liveDemand' in ctx,
        `Location ${loc.id} operationalContext missing liveDemand`
      );
    }
  });

  it('all returned locations have valid coordinates', () => {
    const locations = useAppStore.getState().getGeographicEntities();
    for (const loc of locations) {
      assert.ok(
        isValidCoordinate(loc.latitude, loc.longitude),
        `Zustand location ${loc.id} has invalid coordinates lat=${loc.latitude} lng=${loc.longitude}`
      );
    }
  });
});

describe('Stage 4.2 — GIS Map: geoVisibleTypes filter logic', () => {
  it('type filter: a location whose type is in visibleTypes should be included', () => {
    const location = { id: 'TEST-01', type: GEOGRAPHIC_LOCATION_TYPE.WAREHOUSE, latitude: 10, longitude: 20 };
    const visibleTypes = [GEOGRAPHIC_LOCATION_TYPE.WAREHOUSE, GEOGRAPHIC_LOCATION_TYPE.HOSPITAL];
    const passes = visibleTypes.includes(location.type);
    assert.equal(passes, true);
  });

  it('type filter: a location whose type is NOT in visibleTypes should be excluded', () => {
    const location = { id: 'TEST-02', type: GEOGRAPHIC_LOCATION_TYPE.DISASTER_ZONE, latitude: 10, longitude: 20 };
    const visibleTypes = [GEOGRAPHIC_LOCATION_TYPE.WAREHOUSE, GEOGRAPHIC_LOCATION_TYPE.HOSPITAL];
    const passes = visibleTypes.includes(location.type);
    assert.equal(passes, false);
  });

  it('type filter: empty visibleTypes array excludes all locations', () => {
    const locations = [
      { id: 'L1', type: GEOGRAPHIC_LOCATION_TYPE.WAREHOUSE },
      { id: 'L2', type: GEOGRAPHIC_LOCATION_TYPE.HOSPITAL },
    ];
    const visibleTypes = [];
    const filtered = locations.filter((l) => visibleTypes.includes(l.type));
    assert.equal(filtered.length, 0);
  });

  it('type filter: visibleTypes with all types includes all locations', () => {
    const allTypes = Object.values(GEOGRAPHIC_LOCATION_TYPE);
    const locations = DEMO_GEOGRAPHIC_LOCATIONS;
    const filtered = locations.filter((l) => allTypes.includes(l.type));
    assert.equal(filtered.length, locations.length);
  });

  it('coordinate boundary filter: excludes location with lat > 90', () => {
    const invalid = { id: 'BAD-LAT', type: GEOGRAPHIC_LOCATION_TYPE.WAREHOUSE, latitude: 91, longitude: 0 };
    const passed = isValidCoordinate(invalid.latitude, invalid.longitude);
    assert.equal(passed, false);
  });

  it('coordinate boundary filter: excludes location with lng > 180', () => {
    const invalid = { id: 'BAD-LNG', type: GEOGRAPHIC_LOCATION_TYPE.WAREHOUSE, latitude: 0, longitude: 181 };
    const passed = isValidCoordinate(invalid.latitude, invalid.longitude);
    assert.equal(passed, false);
  });

  it('coordinate boundary filter: excludes location with null lat', () => {
    const invalid = { id: 'NULL-LAT', type: GEOGRAPHIC_LOCATION_TYPE.HOSPITAL, latitude: null, longitude: 34.0 };
    const passed = isValidCoordinate(invalid.latitude, invalid.longitude);
    assert.equal(passed, false);
  });

  it('coordinate boundary filter: accepts all 7 DEMO locations', () => {
    const allTypes = Object.values(GEOGRAPHIC_LOCATION_TYPE);
    const valid = DEMO_GEOGRAPHIC_LOCATIONS.filter(
      (l) => allTypes.includes(l.type) && isValidCoordinate(l.latitude, l.longitude)
    );
    assert.equal(valid.length, 7, `Expected all 7 DEMO locations to pass filter, got ${valid.length}`);
  });
});
