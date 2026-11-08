import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GEOGRAPHIC_ALERT_CATEGORY,
  ALERT_SEVERITY,
  ALERT_STATUS,
  ALERT_SEVERITY_STYLES,
  generateGeographicAlerts,
  applyCombinedMapFilters,
} from '../src/domain/geographicAlertsModel.js';
import { useAppStore } from '../src/store/useAppStore.js';

describe('Stage 4.5 — Geographic Alerts Synthesis & Data Integrity', () => {
  const mockFacilities = [
    {
      id: 'FAC-01',
      code: 'WH-BEIRA',
      name: 'Beira Main Supply Depot',
      latitude: -19.825,
      longitude: 34.86,
      category: 'TIER_1_FOODBANK',
      operationalStatus: 'OPERATIONAL',
      isDemo: true,
    },
    {
      id: 'FAC-02',
      code: 'DC-DND',
      name: 'Dondo Forward Hub',
      latitude: -19.615,
      longitude: 34.745,
      category: 'DISTRIBUTION_CENTRE',
      operationalStatus: 'CONSTRAINED',
      isDemo: true,
    },
    {
      id: 'FAC-03',
      code: 'CAMP-INVAL',
      name: 'Unmapped Field Hospital',
      latitude: 999, // invalid coordinates
      longitude: 999,
      category: 'RELIEF_CAMP',
      operationalStatus: 'OPERATIONAL',
      isDemo: true,
    },
  ];

  const mockZones = [
    {
      id: 'ZONE-FL-01',
      name: 'Pungwe River Surge Sector',
      disasterType: 'FLOOD',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      source: 'Copernicus EMS Rapid Mapping',
      lastUpdated: '2026-11-06T12:00:00Z',
      isDemo: true,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [34.80, -19.80],
            [34.90, -19.80],
            [34.90, -19.85],
            [34.80, -19.85],
            [34.80, -19.80],
          ],
        ],
      },
    },
  ];

  const mockRoutes = [
    {
      id: 'RT-01',
      name: 'Beira to Dondo Arterial',
      origin: 'WH-BEIRA',
      destination: 'DC-DND',
      routeStatus: 'BLOCKED',
      disruptionReason: 'EN6 Highway washed out at bridge km 14',
      transportMode: 'HEAVY_TRUCK',
      isDemo: true,
      points: [
        [-19.825, 34.86],
        [-19.72, 34.8],
        [-19.615, 34.745],
      ],
    },
    {
      id: 'RT-02',
      name: 'Buzi River Waterway Corridor',
      origin: 'WH-BEIRA',
      destination: 'CAMP-BUZI',
      routeStatus: 'ACTIVE',
      transportMode: 'RIVER_BARGE',
      isDemo: true,
      points: [
        [-19.825, 34.86],
        [-19.88, 34.75],
        [-19.95, 34.60],
      ],
    },
  ];

  it('synthesizes potential exposure alert for facility inside hazard zone', () => {
    const alerts = generateGeographicAlerts(mockFacilities, [], mockZones, []);
    const facAlert = alerts.find(
      (a) => a.category === GEOGRAPHIC_ALERT_CATEGORY.FACILITY_IN_DISASTER_ZONE
    );

    assert.ok(facAlert, 'Must synthesize a facility hazard zone alert');
    assert.equal(facAlert.relatedEntityId, 'FAC-01');
    assert.equal(facAlert.relatedZoneId, 'ZONE-FL-01');
    assert.equal(facAlert.isPotentialExposure, true, 'Must be marked as potential exposure');
    assert.equal(facAlert.isConfirmedIncident, false, 'Must NOT be automatically marked as confirmed damage');
    assert.equal(facAlert.severity, ALERT_SEVERITY.CRITICAL);
    assert.ok(Array.isArray(facAlert.coordinates), 'Must include facility coordinates for map centering');
  });

  it('synthesizes confirmed disruption alert for blocked transportation corridor', () => {
    const alerts = generateGeographicAlerts([], mockRoutes, [], []);
    const blockedAlert = alerts.find(
      (a) => a.category === GEOGRAPHIC_ALERT_CATEGORY.BLOCKED_ROUTE
    );

    assert.ok(blockedAlert, 'Must synthesize blocked route alert');
    assert.equal(blockedAlert.relatedEntityId, 'RT-01');
    assert.equal(blockedAlert.isConfirmedIncident, true, 'Confirmed impassability must be marked as confirmed incident');
    assert.equal(blockedAlert.isPotentialExposure, false);
    assert.equal(blockedAlert.severity, ALERT_SEVERITY.CRITICAL);
    assert.ok(blockedAlert.description.includes('EN6 Highway washed out'), 'Must include disruption reason');
  });

  it('synthesizes capacity constraint alert for constrained facility', () => {
    const alerts = generateGeographicAlerts(mockFacilities, [], [], []);
    const constrAlert = alerts.find(
      (a) => a.category === GEOGRAPHIC_ALERT_CATEGORY.RESTRICTED_ACCESS
    );

    assert.ok(constrAlert, 'Must synthesize restricted access alert');
    assert.equal(constrAlert.relatedEntityId, 'FAC-02');
    assert.equal(constrAlert.severity, ALERT_SEVERITY.WARNING);
  });

  it('synthesizes data notice alert for facility with invalid coordinates', () => {
    const alerts = generateGeographicAlerts(mockFacilities, [], [], []);
    const missingAlert = alerts.find(
      (a) => a.category === GEOGRAPHIC_ALERT_CATEGORY.STALE_OR_MISSING_GEO
    );

    assert.ok(missingAlert, 'Must synthesize data integrity alert for invalid coordinates');
    assert.equal(missingAlert.relatedEntityId, 'FAC-03');
    assert.equal(missingAlert.coordinates, null);
  });

  it('excludes dismissed alert IDs from synthesized active alerts', () => {
    const initialAlerts = generateGeographicAlerts(mockFacilities, mockRoutes, mockZones, []);
    assert.ok(initialAlerts.length >= 3, 'Initial alerts must be generated');

    const firstId = initialAlerts[0].id;
    const remainingAlerts = generateGeographicAlerts(mockFacilities, mockRoutes, mockZones, [firstId]);

    assert.equal(
      remainingAlerts.some((a) => a.id === firstId),
      false,
      'Dismissed alert ID must be excluded from active alerts'
    );
    assert.equal(remainingAlerts.length, initialAlerts.length - 1);
  });
});

describe('Stage 4.5 — Multi-Criteria Map Filtering Engine', () => {
  const dataset = {
    entities: [
      { id: 'E1', name: 'Beira Depot', code: 'WH-BEI', category: 'TIER_1_FOODBANK', status: 'OPERATIONAL' },
      { id: 'E2', name: 'Dondo DC', code: 'DC-DND', category: 'DISTRIBUTION_CENTRE', status: 'CONSTRAINED' },
    ],
    geoLocations: [
      { id: 'G1', name: 'Central Hospital', code: 'HOSP-01', type: 'HOSPITAL', operationalStatus: 'OPERATIONAL', isDemo: true },
      { id: 'G2', name: 'Samora Machel Camp', code: 'CAMP-01', type: 'RELIEF_CAMP', operationalStatus: 'CRITICAL', isDemo: true },
      { id: 'G3', name: 'Satellite Health Post', code: 'HOSP-LIVE', type: 'HOSPITAL', operationalStatus: 'OPERATIONAL', isDemo: false },
    ],
    routes: [
      { id: 'R1', name: 'Beira-Dondo Road', routeStatus: 'ACTIVE', transportMode: 'HEAVY_TRUCK', isDemo: true },
      { id: 'R2', name: 'Buzi Barge Canal', routeStatus: 'BLOCKED', transportMode: 'RIVER_BARGE', isDemo: true },
      { id: 'R3', name: 'Chimoio Airlift', routeStatus: 'PLANNED', transportMode: 'AIR_CARGO', isDemo: false },
    ],
    disasterZones: [
      { id: 'Z1', name: 'Coastal Surge', disasterType: 'FLOOD', severity: 'CRITICAL', isDemo: true },
      { id: 'Z2', name: 'Northern Inundation', disasterType: 'FLOOD', severity: 'HIGH', isDemo: true },
      { id: 'Z3', name: 'Border Security Sector', disasterType: 'CONFLICT', severity: 'MODERATE', isDemo: false },
    ],
  };

  it('filters datasets by facility type', () => {
    const res = applyCombinedMapFilters(dataset, { facilityType: 'HOSPITAL' });
    assert.equal(res.filteredGeoLocations.length, 2);
    assert.ok(res.filteredGeoLocations.every((g) => g.type === 'HOSPITAL'));
  });

  it('filters datasets by facility operational status', () => {
    const res = applyCombinedMapFilters(dataset, { facilityStatus: 'CRITICAL' });
    assert.equal(res.filteredGeoLocations.length, 1);
    assert.equal(res.filteredGeoLocations[0].id, 'G2');
  });

  it('filters datasets by route status', () => {
    const res = applyCombinedMapFilters(dataset, { routeStatus: 'BLOCKED' });
    assert.equal(res.filteredRoutes.length, 1);
    assert.equal(res.filteredRoutes[0].id, 'R2');
  });

  it('filters datasets by transportation mode', () => {
    const res = applyCombinedMapFilters(dataset, { transportMode: 'RIVER_BARGE' });
    assert.equal(res.filteredRoutes.length, 1);
    assert.equal(res.filteredRoutes[0].id, 'R2');
  });

  it('filters datasets by disaster type and severity', () => {
    const res = applyCombinedMapFilters(dataset, {
      disasterType: 'FLOOD',
      disasterSeverity: 'CRITICAL',
    });
    assert.equal(res.filteredDisasterZones.length, 1);
    assert.equal(res.filteredDisasterZones[0].id, 'Z1');
  });

  it('filters datasets by DEMO vs LIVE classification', () => {
    const demoOnly = applyCombinedMapFilters(dataset, { dataClassification: 'DEMO' });
    assert.ok(demoOnly.filteredGeoLocations.every((g) => g.isDemo === true));
    assert.ok(demoOnly.filteredRoutes.every((r) => r.isDemo === true));
    assert.ok(demoOnly.filteredDisasterZones.every((z) => z.isDemo === true));

    const liveOnly = applyCombinedMapFilters(dataset, { dataClassification: 'LIVE' });
    assert.ok(liveOnly.filteredGeoLocations.every((g) => g.isDemo === false));
    assert.ok(liveOnly.filteredRoutes.every((r) => r.isDemo === false));
    assert.ok(liveOnly.filteredDisasterZones.every((z) => z.isDemo === false));
  });

  it('calculates activeFilterCount correctly', () => {
    const res = applyCombinedMapFilters(dataset, {
      facilityType: 'HOSPITAL',
      routeStatus: 'BLOCKED',
      searchTerm: 'Beira',
    });
    assert.equal(res.activeFilterCount, 3);
  });

  it('flags isEmpty: true when filters eliminate all features', () => {
    const res = applyCombinedMapFilters(dataset, {
      searchTerm: 'NonexistentKeyword12345',
    });
    assert.equal(res.isEmpty, true);
    assert.equal(res.totalResults, 0);
  });
});

describe('Stage 4.5 — Zustand Store Alerts Integration & Audit Trail', () => {
  it('dismissGeographicAlert updates dismissed list and emits an audit event', () => {
    const store = useAppStore.getState();
    const testAlertId = 'ALT-TEST-DISMISS-01';

    const prevAuditCount = store.auditEvents.length;
    store.dismissGeographicAlert(testAlertId);

    const nextState = useAppStore.getState();
    assert.ok(
      nextState.dismissedGeographicAlertIds.includes(testAlertId),
      'Dismissed alert ID must be recorded in store'
    );

    const auditEvent = nextState.auditEvents[nextState.auditEvents.length - 1];
    assert.equal(nextState.auditEvents.length, prevAuditCount + 1);
    assert.equal(auditEvent.action, 'GEOGRAPHIC_ALERT_DISMISSED');
    assert.equal(auditEvent.entityId, testAlertId);
  });

  it('focusMapOnEntity and clearMapFocus manage map camera focus state', () => {
    const store = useAppStore.getState();
    store.focusMapOnEntity('FAC-01', 'FACILITY', [-19.825, 34.86]);

    let state = useAppStore.getState();
    assert.deepEqual(state.focusedMapEntity, {
      id: 'FAC-01',
      type: 'FACILITY',
      coordinates: [-19.825, 34.86],
    });

    store.clearMapFocus();
    state = useAppStore.getState();
    assert.equal(state.focusedMapEntity, null);
  });
});

