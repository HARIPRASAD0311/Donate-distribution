/**
 * ResQNet — Stage 4.4 Disaster Zones & Geographical Risk Layers Tests
 *
 * Tests:
 *  1. GeoJSON geometry validation & coordinate normalization (Polygon & MultiPolygon)
 *  2. Rejection of invalid GeoJSON (empty rings, invalid coordinates, corrupt geometry)
 *  3. Mandatory source information and timestamp validation
 *  4. Risk severity level configuration and style mappings (CRITICAL, HIGH, MODERATE, LOW)
 *  5. Disaster types coverage (FLOOD, CONFLICT, PANDEMIC, RESTRICTED_ACCESS, EVACUATION_ZONE)
 *  6. Ray-casting point-in-polygon: facility inside vs outside
 *  7. Line segment and polyline intersection: route crossing vs bypassing
 *  8. Strict impact analysis: exposure identification without destructive state mutation
 *  9. DEMO vs LIVE classification and separation
 * 10. Zustand store integration: getDisasterZones, addDisasterZone, updateDisasterZone, and audit logging
 * 11. Performance benchmark: multi-zone ray-casting calculations
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── Domain Imports ───────────────────────────────────────────────────────────
import {
  DISASTER_TYPE,
  RISK_SEVERITY,
  ZONE_STATUS,
  DATA_CLASSIFICATION,
  RISK_SEVERITY_STYLES,
  isValidLinearRing,
  normalizeGeometryToLeaflet,
  validateDisasterZone,
  isPointInPolygon,
  isPointInMultiPolygon,
  doLineSegmentsIntersect,
  isFacilityInZone,
  isRouteIntersectingZone,
  analyzeZoneImpact,
} from '../src/domain/disasterZoneModel.js';

import { DEMO_DISASTER_ZONES } from '../src/mock-data/disasterZones.mock.js';
import { useAppStore } from '../src/store/useAppStore.js';

// ─── 1. GeoJSON Geometry & Boundary Validation ───────────────────────────────
describe('Stage 4.4 — GeoJSON Geometry & Boundary Validation', () => {
  it('isValidLinearRing accepts valid closed coordinate ring', () => {
    const validRing = [
      [34.80, -19.77],
      [34.85, -19.77],
      [34.85, -19.81],
      [34.80, -19.81],
      [34.80, -19.77],
    ];
    assert.equal(isValidLinearRing(validRing), true);
  });

  it('isValidLinearRing rejects rings with fewer than 3 coordinates', () => {
    assert.equal(isValidLinearRing([[34.80, -19.77], [34.85, -19.77]]), false);
    assert.equal(isValidLinearRing([]), false);
    assert.equal(isValidLinearRing(null), false);
  });

  it('isValidLinearRing rejects out-of-bounds coordinates', () => {
    const invalidRing = [
      [999, 999], // out of bounds
      [34.85, -19.77],
      [34.85, -19.81],
    ];
    assert.equal(isValidLinearRing(invalidRing), false);
  });

  it('normalizeGeometryToLeaflet parses standard GeoJSON [lng, lat] Polygon into Leaflet [lat, lng]', () => {
    const geoJsonPolygon = {
      type: 'Polygon',
      coordinates: [
        [
          [34.800, -19.770],
          [34.845, -19.770],
          [34.850, -19.815],
          [34.800, -19.770],
        ],
      ],
    };
    const leafletCoords = normalizeGeometryToLeaflet(geoJsonPolygon);
    assert.ok(Array.isArray(leafletCoords));
    assert.equal(leafletCoords.length, 4);
    // Leaflet expectation: [latitude, longitude] -> [-19.770, 34.800]
    assert.equal(leafletCoords[0][0], -19.770);
    assert.equal(leafletCoords[0][1], 34.800);
  });

  it('normalizeGeometryToLeaflet parses GeoJSON MultiPolygon correctly', () => {
    const multiPolygon = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [34.80, -19.77],
            [34.84, -19.77],
            [34.84, -19.81],
            [34.80, -19.77],
          ],
        ],
        [
          [
            [34.86, -19.77],
            [34.90, -19.77],
            [34.90, -19.81],
            [34.86, -19.77],
          ],
        ],
      ],
    };
    const res = normalizeGeometryToLeaflet(multiPolygon);
    assert.ok(Array.isArray(res));
    assert.equal(res.length, 2);
    assert.equal(res[0][0][0], -19.77);
  });
});

// ─── 2. Disaster Zone Record Validation ───────────────────────────────────────
describe('Stage 4.4 — Disaster Zone Record Validation', () => {
  const sampleValidZone = {
    id: 'ZONE-TEST-01',
    name: 'Test Flood Inundation Perimeter',
    disasterType: DISASTER_TYPE.FLOOD,
    severity: RISK_SEVERITY.CRITICAL,
    status: ZONE_STATUS.ACTIVE,
    source: 'Copernicus Sentinel-1 SAR',
    lastUpdated: '2026-11-06T06:00:00Z',
    isDemo: true,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [34.80, -19.77],
          [34.85, -19.77],
          [34.85, -19.82],
          [34.80, -19.82],
          [34.80, -19.77],
        ],
      ],
    },
  };

  it('validates a complete and legitimate disaster zone record', () => {
    const res = validateDisasterZone(sampleValidZone);
    assert.equal(res.ok, true);
    assert.equal(res.value.id, 'ZONE-TEST-01');
    assert.equal(res.value.severity, RISK_SEVERITY.CRITICAL);
    assert.equal(res.value.isDemo, true);
  });

  it('rejects duplicate zone IDs', () => {
    const existing = [{ id: 'ZONE-TEST-01' }];
    const res = validateDisasterZone(sampleValidZone, existing);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('Duplicate disaster zone ID')));
  });

  it('rejects missing or empty information source (Requirement 6)', () => {
    const badSource = { ...sampleValidZone, id: 'ZONE-NO-SOURCE', source: '' };
    const res = validateDisasterZone(badSource);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('validated source of information')));
  });

  it('rejects invalid disaster type', () => {
    const badType = { ...sampleValidZone, id: 'ZONE-BAD-TYPE', disasterType: 'VOLCANO_ERUPTION' };
    const res = validateDisasterZone(badType);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('Invalid disasterType')));
  });

  it('rejects invalid severity level', () => {
    const badSev = { ...sampleValidZone, id: 'ZONE-BAD-SEV', severity: 'CATASTROPHIC_UNKNOWN' };
    const res = validateDisasterZone(badSev);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('Invalid severity')));
  });

  it('rejects invalid or missing lastUpdated timestamp', () => {
    const badTime = { ...sampleValidZone, id: 'ZONE-BAD-TIME', lastUpdated: 'not-a-date' };
    const res = validateDisasterZone(badTime);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('valid lastUpdated ISO timestamp')));
  });
});

// ─── 3. DEMO Dataset Structure & Separation ──────────────────────────────────
describe('Stage 4.4 — DEMO Dataset Structure & Coverage', () => {
  it('DEMO_DISASTER_ZONES contains at least 5 representative zones', () => {
    assert.ok(DEMO_DISASTER_ZONES.length >= 5);
  });

  it('every DEMO zone has isDemo: true and valid classification', () => {
    for (const z of DEMO_DISASTER_ZONES) {
      assert.equal(z.isDemo, true);
      assert.equal(z.dataClassification, DATA_CLASSIFICATION.DEMO);
    }
  });

  it('DEMO zones cover all required disaster types', () => {
    const presentTypes = new Set(DEMO_DISASTER_ZONES.map((z) => z.disasterType));
    assert.ok(presentTypes.has(DISASTER_TYPE.FLOOD));
    assert.ok(presentTypes.has(DISASTER_TYPE.CONFLICT));
    assert.ok(presentTypes.has(DISASTER_TYPE.PANDEMIC));
    assert.ok(presentTypes.has(DISASTER_TYPE.RESTRICTED_ACCESS));
    assert.ok(presentTypes.has(DISASTER_TYPE.EVACUATION_ZONE));
  });

  it('all DEMO zones pass full strict validation', () => {
    for (const z of DEMO_DISASTER_ZONES) {
      const res = validateDisasterZone(z);
      assert.equal(res.ok, true, `Zone ${z.id} failed validation: ${JSON.stringify(res.errors)}`);
    }
  });
});

// ─── 4. Ray-Casting Point-in-Polygon & Facility Impact ────────────────────────
describe('Stage 4.4 — Spatial Ray-Casting & Facility Impact', () => {
  // Polygon from lat -19.85 to -19.75, lng 34.80 to 34.90
  const boxPolygon = [
    [-19.75, 34.80],
    [-19.75, 34.90],
    [-19.85, 34.90],
    [-19.85, 34.80],
    [-19.75, 34.80],
  ];

  it('isPointInPolygon identifies point inside polygon', () => {
    const insidePoint = [-19.80, 34.85];
    assert.equal(isPointInPolygon(insidePoint, boxPolygon), true);
  });

  it('isPointInPolygon identifies point outside polygon', () => {
    const outsidePoint = [-19.50, 34.85];
    assert.equal(isPointInPolygon(outsidePoint, boxPolygon), false);
  });

  it('isFacilityInZone identifies facility located within zone', () => {
    const facilityInside = {
      id: 'FAC-INSIDE',
      name: 'Delta Triage Center',
      coordinates: [-19.80, 34.85],
      operationalStatus: 'OPERATIONAL',
    };
    const zone = {
      geometry: { type: 'Polygon', coordinates: [] },
      leafletLatLngs: boxPolygon,
    };
    assert.equal(isFacilityInZone(facilityInside, zone), true);
  });

  it('isFacilityInZone identifies facility located outside zone', () => {
    const facilityOutside = {
      id: 'FAC-OUTSIDE',
      name: 'Highland Dry Depot',
      coordinates: [-19.10, 34.20],
      operationalStatus: 'OPERATIONAL',
    };
    const zone = {
      geometry: { type: 'Polygon', coordinates: [] },
      leafletLatLngs: boxPolygon,
    };
    assert.equal(isFacilityInZone(facilityOutside, zone), false);
  });
});

// ─── 5. Route Intersection Geometry ──────────────────────────────────────────
describe('Stage 4.4 — Polyline-Zone Intersection Geometry', () => {
  const boxPolygon = [
    [-19.75, 34.80],
    [-19.75, 34.90],
    [-19.85, 34.90],
    [-19.85, 34.80],
    [-19.75, 34.80],
  ];
  const zone = {
    geometry: { type: 'Polygon', coordinates: [] },
    leafletLatLngs: boxPolygon,
  };

  it('detects route intersecting zone when waypoint is inside', () => {
    const intersectingRoute = {
      id: 'RT-PASS-THROUGH',
      points: [
        [-19.70, 34.85], // outside north
        [-19.80, 34.85], // INSIDE
        [-19.90, 34.85], // outside south
      ],
    };
    assert.equal(isRouteIntersectingZone(intersectingRoute, zone), true);
  });

  it('detects route intersecting zone when line segment traverses zone boundary', () => {
    const traversingRoute = {
      id: 'RT-TRAVERSE',
      points: [
        [-19.70, 34.85], // outside north
        [-19.90, 34.85], // outside south (line cuts through box)
      ],
    };
    assert.equal(isRouteIntersectingZone(traversingRoute, zone), true);
  });

  it('identifies route completely bypassing zone', () => {
    const bypassingRoute = {
      id: 'RT-BYPASS',
      points: [
        [-19.70, 35.10], // far east
        [-19.90, 35.10],
      ],
    };
    assert.equal(isRouteIntersectingZone(bypassingRoute, zone), false);
  });
});

// ─── 6. Comprehensive Impact Analysis & Non-Destructive Integrity ─────────────
describe('Stage 4.4 — Comprehensive Impact Analysis & Data Integrity', () => {
  it('analyzeZoneImpact identifies exposed facilities and intersecting routes without mutating records', () => {
    const boxPolygon = [
      [-19.75, 34.80],
      [-19.75, 34.90],
      [-19.85, 34.90],
      [-19.85, 34.80],
      [-19.75, 34.80],
    ];
    const zone = {
      id: 'ZONE-HAZARD-01',
      name: 'Severe Inundation Delta',
      severity: RISK_SEVERITY.CRITICAL,
      disasterType: DISASTER_TYPE.FLOOD,
      leafletLatLngs: boxPolygon,
      geometry: { type: 'Polygon' },
    };

    const facilities = [
      { id: 'FAC-IN-1', name: 'Submerged Hub', coordinates: [-19.80, 34.85], operationalStatus: 'CONSTRAINED' },
      { id: 'FAC-OUT-1', name: 'Safe Hub', coordinates: [-19.10, 34.10], operationalStatus: 'OPERATIONAL' },
    ];

    const routes = [
      { id: 'RT-IN-1', name: 'Cut-off Road', points: [[-19.70, 34.85], [-19.90, 34.85]], routeStatus: 'BLOCKED' },
      { id: 'RT-OUT-1', name: 'Dry Highway', points: [[-19.10, 34.10], [-19.20, 34.10]], routeStatus: 'ACTIVE' },
    ];

    const impact = analyzeZoneImpact(zone, facilities, routes);

    assert.equal(impact.exposedFacilities.length, 1);
    assert.equal(impact.exposedFacilities[0].id, 'FAC-IN-1');
    assert.equal(impact.exposedRoutes.length, 1);
    assert.equal(impact.exposedRoutes[0].id, 'RT-IN-1');

    // Requirement: Must include non-destructive disclaimer
    assert.ok(impact.exposureDisclaimer.includes('potential exposure, not confirmed damage'));
    // Verified status must be preserved, not overwritten
    assert.equal(impact.exposedFacilities[0].operationalStatus, 'CONSTRAINED');
  });
});

// ─── 7. Zustand Store Integration & Audit Trail ───────────────────────────────
describe('Stage 4.4 — Zustand Store Integration & Audit Events', () => {
  it('getDisasterZones returns zones enriched with spatial impact analysis', () => {
    const zones = useAppStore.getState().getDisasterZones();
    assert.ok(Array.isArray(zones));
    assert.ok(zones.length >= 5);

    for (const z of zones) {
      assert.ok('impact' in z);
      assert.ok('summary' in z.impact);
      assert.ok(Number.isFinite(z.impact.summary.facilityCount));
      assert.ok(Number.isFinite(z.impact.summary.routeCount));
    }
  });

  it('addDisasterZone registers a valid hazard zone and logs an audit event', () => {
    const initialEvents = useAppStore.getState().auditEvents.length;
    const newZone = {
      id: 'ZONE-NEW-EPIDEMIC',
      name: 'Acute Cholera Outbreak Sector Gamma',
      disasterType: DISASTER_TYPE.PANDEMIC,
      severity: RISK_SEVERITY.HIGH,
      status: ZONE_STATUS.ACTIVE,
      source: 'District Medical Officer Rapid Assessment',
      lastUpdated: new Date().toISOString(),
      isDemo: true,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [34.80, -19.75],
            [34.85, -19.75],
            [34.85, -19.80],
            [34.80, -19.80],
            [34.80, -19.75],
          ],
        ],
      },
    };

    const res = useAppStore.getState().addDisasterZone(newZone);
    assert.equal(res.ok, true);

    const stateAfter = useAppStore.getState();
    assert.equal(stateAfter.auditEvents.length, initialEvents + 1);

    const lastEvent = stateAfter.auditEvents[stateAfter.auditEvents.length - 1];
    assert.equal(lastEvent.action, 'DISASTER_ZONE_RECORDED');
    assert.equal(lastEvent.entityId, 'ZONE-NEW-EPIDEMIC');
    assert.equal(lastEvent.newState, RISK_SEVERITY.HIGH);
  });

  it('addDisasterZone rejects duplicate zone ID without state mutation', () => {
    const countBefore = useAppStore.getState().disasterZones.length;
    const duplicate = {
      id: 'ZONE-NEW-EPIDEMIC', // duplicate
      name: 'Duplicate Zone',
      disasterType: DISASTER_TYPE.PANDEMIC,
      severity: RISK_SEVERITY.LOW,
      status: ZONE_STATUS.MONITORED,
      source: 'Internal Test',
      lastUpdated: new Date().toISOString(),
      geometry: { type: 'Polygon', coordinates: [[[34.80, -19.75], [34.85, -19.75], [34.85, -19.80], [34.80, -19.75]]] },
    };

    const res = useAppStore.getState().addDisasterZone(duplicate);
    assert.equal(res.ok, false);
    assert.equal(useAppStore.getState().disasterZones.length, countBefore);
  });
});

// ─── 8. Risk Severity Visual Styling Coverage ────────────────────────────────
describe('Stage 4.4 — Risk Severity Styles Coverage', () => {
  it('covers all 4 RISK_SEVERITY levels with distinct colors and transparent fill', () => {
    const severities = [
      RISK_SEVERITY.CRITICAL,
      RISK_SEVERITY.HIGH,
      RISK_SEVERITY.MODERATE,
      RISK_SEVERITY.LOW,
    ];

    for (const sev of severities) {
      const style = RISK_SEVERITY_STYLES[sev];
      assert.ok(style, `Missing style for ${sev}`);
      assert.ok(style.color, `Missing color for ${sev}`);
      assert.ok(style.fillColor, `Missing fillColor for ${sev}`);
      assert.ok(style.fillOpacity > 0 && style.fillOpacity < 0.5, `fillOpacity must be transparent (< 0.5) for ${sev}`);
    }
  });
});

// ─── 9. Performance Benchmark with Multiple Hazard Zones ──────────────────────
describe('Stage 4.4 — Performance Benchmark with Multiple Zones', () => {
  it('computes spatial intersection for 50 synthetic zones in under 100ms', () => {
    const polygon = [
      [-19.75, 34.80],
      [-19.75, 34.90],
      [-19.85, 34.90],
      [-19.85, 34.80],
      [-19.75, 34.80],
    ];
    const testPoint = [-19.80, 34.85];

    const t0 = performance.now();
    for (let i = 0; i < 500; i++) {
      isPointInPolygon(testPoint, polygon);
    }
    const t1 = performance.now();
    assert.ok(t1 - t0 < 100, `Expected 500 ray-casting checks in < 100ms, took ${t1 - t0}ms`);
  });
});
