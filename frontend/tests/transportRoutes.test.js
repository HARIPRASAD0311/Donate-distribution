/**
 * ResQNet — Stage 4.3 Transportation Routes & Network Connectivity Tests
 *
 * Tests:
 *  1. Coordinate & waypoint validation (valid origin/destination, boundary checks)
 *  2. Missing facility detection in route validation
 *  3. Duplicate route ID rejection
 *  4. Invalid route data rejection (out-of-bounds, negative distance, corrupt points)
 *  5. Dispatch-to-route relationship & status derivation (ACTIVE, COMPLETED, DELAYED, BLOCKED, PLANNED)
 *  6. Route status updates and append-only audit event recording in Zustand store
 *  7. Routing service abstraction & graceful fallback when service is unconfigured or unavailable
 *  8. Directional arrow bearing calculation and midpoint logic
 *  9. Connected routes discovery for facilities
 * 10. Route filtering and status normalization
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── Domain Imports ───────────────────────────────────────────────────────────
import {
  ROUTE_STATUS,
  TRANSPORT_MODE,
  ROUTING_TYPE,
  ROUTE_STATUS_STYLES,
  normalizeRouteStatus,
  isValidRoutePoint,
  validateRoute,
  deriveRouteStatusFromDispatch,
  enrichRouteWithDispatch,
  calculateBearing,
  calculateMidpoint,
  calculateRoadRoute,
  getConnectedRoutesForFacility,
} from '../src/domain/transportRouteModel.js';

import { useAppStore } from '../src/store/useAppStore.js';

// ─── 1. Coordinate & Waypoint Validation ──────────────────────────────────────
describe('Stage 4.3 — Coordinate & Waypoint Validation', () => {
  it('isValidRoutePoint accepts valid [lat, lng] array', () => {
    assert.equal(isValidRoutePoint([-19.832, 34.856]), true);
    assert.equal(isValidRoutePoint([0, 0]), true);
    assert.equal(isValidRoutePoint([90, 180]), true);
    assert.equal(isValidRoutePoint([-90, -180]), true);
  });

  it('isValidRoutePoint rejects out-of-bounds coordinates', () => {
    assert.equal(isValidRoutePoint([90.5, 0]), false);
    assert.equal(isValidRoutePoint([-90.5, 0]), false);
    assert.equal(isValidRoutePoint([0, 180.5]), false);
    assert.equal(isValidRoutePoint([0, -180.5]), false);
  });

  it('isValidRoutePoint rejects non-array, incomplete, or NaN inputs', () => {
    assert.equal(isValidRoutePoint(null), false);
    assert.equal(isValidRoutePoint(undefined), false);
    assert.equal(isValidRoutePoint([-19.832]), false); // length < 2
    assert.equal(isValidRoutePoint([-19.832, NaN]), false);
    assert.equal(isValidRoutePoint([NaN, 34.856]), false);
    assert.equal(isValidRoutePoint('not-an-array'), false);
  });
});

// ─── 2. Route Record Validation ───────────────────────────────────────────────
describe('Stage 4.3 — Route Validation & Data Integrity', () => {
  const sampleValidRoute = {
    id: 'RT-TEST-001',
    name: 'Primary Supply Corridor',
    origin: 'CSD-01',
    destination: 'BEN-01',
    points: [
      [-19.832, 34.856],
      [-19.810, 34.840],
      [-19.789, 34.821],
    ],
    distanceKm: 12.5,
    estimatedTime: '35 mins',
    transportMode: TRANSPORT_MODE.HEAVY_TRUCK,
    routeStatus: ROUTE_STATUS.ACTIVE,
  };

  it('accepts a fully valid route record', () => {
    const res = validateRoute(sampleValidRoute);
    assert.equal(res.ok, true);
    assert.equal(res.value.id, 'RT-TEST-001');
    assert.equal(res.value.distanceKm, 12.5);
    assert.equal(res.value.routeStatus, ROUTE_STATUS.ACTIVE);
  });

  it('detects missing or unregistered origin facility', () => {
    const facilities = [{ id: 'CSD-01', name: 'Central Depot' }, { id: 'BEN-01', name: 'Relief Camp' }];
    const badRoute = {
      ...sampleValidRoute,
      id: 'RT-MISSING-ORIGIN',
      origin: 'UNKNOWN-FACILITY-999',
    };
    const res = validateRoute(badRoute, [], facilities);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('UNKNOWN-FACILITY-999')));
  });

  it('detects missing or unregistered destination facility', () => {
    const facilities = [{ id: 'CSD-01', name: 'Central Depot' }, { id: 'BEN-01', name: 'Relief Camp' }];
    const badRoute = {
      ...sampleValidRoute,
      id: 'RT-MISSING-DEST',
      destination: 'UNKNOWN-DEST-999',
    };
    const res = validateRoute(badRoute, [], facilities);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('UNKNOWN-DEST-999')));
  });

  it('rejects duplicate route IDs', () => {
    const existing = [{ id: 'RT-TEST-001' }];
    const res = validateRoute(sampleValidRoute, existing);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('Duplicate route ID')));
  });

  it('rejects route with missing or empty ID', () => {
    const res = validateRoute({ ...sampleValidRoute, id: '' });
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('non-empty string ID')));
  });

  it('rejects route with fewer than 2 waypoints', () => {
    const res = validateRoute({ ...sampleValidRoute, id: 'RT-FEW', points: [[-19.832, 34.856]] });
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('at least two')));
  });

  it('rejects route with invalid waypoint coordinates', () => {
    const res = validateRoute({
      ...sampleValidRoute,
      id: 'RT-BAD-WAYPOINT',
      points: [
        [-19.832, 34.856],
        [999, 34.840], // invalid lat
      ],
    });
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('invalid coordinates')));
  });

  it('rejects fabricated or invalid distance (negative or non-finite)', () => {
    const resNeg = validateRoute({ ...sampleValidRoute, id: 'RT-NEG', distanceKm: -15 });
    assert.equal(resNeg.ok, false);

    const resNaN = validateRoute({ ...sampleValidRoute, id: 'RT-NAN', distanceKm: NaN });
    assert.equal(resNaN.ok, false);
  });

  it('accepts null distance and null estimatedTime when uncalculated', () => {
    const uncalc = {
      ...sampleValidRoute,
      id: 'RT-UNCALC',
      distanceKm: null,
      estimatedTime: null,
    };
    const res = validateRoute(uncalc);
    assert.equal(res.ok, true);
    assert.equal(res.value.distanceKm, null);
    assert.equal(res.value.estimatedTime, null);
  });
});

// ─── 3. Dispatch Integration & Status Derivation ──────────────────────────────
describe('Stage 4.3 — Route-to-Dispatch Synchronization', () => {
  it('maps IN_TRANSIT dispatch to ROUTE_STATUS.ACTIVE', () => {
    const dispatch = { id: 'DSP-01', status: 'IN_TRANSIT' };
    assert.equal(deriveRouteStatusFromDispatch(dispatch), ROUTE_STATUS.ACTIVE);
  });

  it('maps DISPATCHED dispatch to ROUTE_STATUS.ACTIVE', () => {
    const dispatch = { id: 'DSP-02', status: 'DISPATCHED' };
    assert.equal(deriveRouteStatusFromDispatch(dispatch), ROUTE_STATUS.ACTIVE);
  });

  it('maps DELIVERED and VERIFIED dispatch to ROUTE_STATUS.COMPLETED', () => {
    assert.equal(deriveRouteStatusFromDispatch({ id: 'DSP-03', status: 'DELIVERED' }), ROUTE_STATUS.COMPLETED);
    assert.equal(deriveRouteStatusFromDispatch({ id: 'DSP-04', status: 'VERIFIED' }), ROUTE_STATUS.COMPLETED);
    assert.equal(deriveRouteStatusFromDispatch({ id: 'DSP-05', status: 'ARRIVED_AWAITING_POD' }), ROUTE_STATUS.COMPLETED);
  });

  it('maps APPROVED and READY dispatch to ROUTE_STATUS.PLANNED', () => {
    assert.equal(deriveRouteStatusFromDispatch({ id: 'DSP-06', status: 'APPROVED' }), ROUTE_STATUS.PLANNED);
    assert.equal(deriveRouteStatusFromDispatch({ id: 'DSP-07', status: 'READY' }), ROUTE_STATUS.PLANNED);
  });

  it('flags BLOCKED if dispatch has route blockage', () => {
    const dispatch = { id: 'DSP-08', status: 'IN_TRANSIT', isBlocked: true };
    assert.equal(deriveRouteStatusFromDispatch(dispatch), ROUTE_STATUS.BLOCKED);
  });

  it('flags DELAYED if dispatch has delay notification', () => {
    const dispatch = { id: 'DSP-09', status: 'IN_TRANSIT', isDelayed: true };
    assert.equal(deriveRouteStatusFromDispatch(dispatch), ROUTE_STATUS.DELAYED);
  });

  it('enrichRouteWithDispatch synchronizes linked dispatch record and status', () => {
    const baseRoute = {
      id: 'RT-BARGE',
      origin: 'CSD-01',
      destination: 'BEN-01',
      routeStatus: 'PLANNED',
      dispatchId: 'DSP-2026-001',
    };
    const dispatchOrders = [
      {
        id: 'DSP-2026-001',
        status: 'IN_TRANSIT',
        commodity: 'FOOD',
        quantity: 1000,
        unit: 'packets',
        vehicle: 'Shallow-Draft Barge BRG-02',
        carrier: 'UN OCHA Flotilla',
        dispatchedAt: '2026-11-05T09:15:00Z',
      },
    ];

    const enriched = enrichRouteWithDispatch(baseRoute, dispatchOrders);
    assert.equal(enriched.routeStatus, ROUTE_STATUS.ACTIVE);
    assert.ok(enriched.linkedDispatch !== null);
    assert.equal(enriched.linkedDispatch.id, 'DSP-2026-001');
    assert.equal(enriched.linkedDispatch.quantity, 1000);
    assert.equal(enriched.linkedDispatch.commodity, 'FOOD');
  });
});

// ─── 4. Directional Arrow Geometry ───────────────────────────────────────────
describe('Stage 4.3 — Directional Bearing & Midpoint Geometry', () => {
  it('calculates bearing due North (0 degrees)', () => {
    const start = [0, 0];
    const end = [1, 0];
    const brng = calculateBearing(start, end);
    assert.equal(Math.round(brng), 0);
  });

  it('calculates bearing due East (90 degrees)', () => {
    const start = [0, 0];
    const end = [0, 1];
    const brng = calculateBearing(start, end);
    assert.equal(Math.round(brng), 90);
  });

  it('calculates bearing due South (180 degrees)', () => {
    const start = [1, 0];
    const end = [0, 0];
    const brng = calculateBearing(start, end);
    assert.equal(Math.round(brng), 180);
  });

  it('calculates bearing due West (270 degrees)', () => {
    const start = [0, 1];
    const end = [0, 0];
    const brng = calculateBearing(start, end);
    assert.equal(Math.round(brng), 270);
  });

  it('calculates midpoint along a polyline accurately', () => {
    const points = [
      [-19.80, 34.80],
      [-19.82, 34.82],
      [-19.84, 34.84],
    ];
    const mid = calculateMidpoint(points);
    assert.ok(Array.isArray(mid));
    assert.equal(mid.length, 2);
    assert.ok(Math.abs(mid[0] - (-19.81)) < 0.02);
  });
});

// ─── 5. Routing Service Abstraction & Fallback ────────────────────────────────
describe('Stage 4.3 — Routing Service Abstraction & Graceful Fallback', () => {
  it('returns graceful DEMO fallback when no routing service is configured', async () => {
    const origin = [-19.832, 34.856];
    const destination = [-19.789, 34.821];

    const res = await calculateRoadRoute(origin, destination, { routingServiceUrl: null });
    assert.equal(res.ok, false);
    assert.equal(res.reason, 'NO_ROUTING_SERVICE_CONFIGURED');
    assert.equal(res.isDemo, true);
    assert.equal(res.routingType, ROUTING_TYPE.DEMO_ILLUSTRATIVE);
    assert.equal(res.distanceKm, null); // never invents metrics
    assert.deepEqual(res.points, [origin, destination]);
  });

  it('handles invalid coordinates gracefully in calculateRoadRoute', async () => {
    const res = await calculateRoadRoute([999, 0], [0, 0]);
    assert.equal(res.ok, false);
    assert.equal(res.reason, 'INVALID_COORDINATES');
  });

  it('handles unreachable service URL gracefully without throwing unhandled exceptions', async () => {
    const origin = [-19.832, 34.856];
    const destination = [-19.789, 34.821];

    const res = await calculateRoadRoute(origin, destination, {
      routingServiceUrl: 'http://127.0.0.1:59999/non-existent-routing-service',
    });
    assert.equal(res.ok, false);
    assert.equal(res.reason, 'ROUTING_SERVICE_UNAVAILABLE');
    assert.equal(res.isDemo, true);
    assert.equal(res.routingType, ROUTING_TYPE.DEMO_ILLUSTRATIVE);
  });
});

// ─── 6. Connected Facility Routes Discovery ───────────────────────────────────
describe('Stage 4.3 — Connected Facilities Route Discovery', () => {
  const routes = [
    { id: 'R1', originFacilityId: 'CSD-01', destinationFacilityId: 'DC-01', origin: 'CSD-01', destination: 'DC-01' },
    { id: 'R2', originFacilityId: 'CSD-01', destinationFacilityId: 'BEN-01', origin: 'CSD-01', destination: 'BEN-01' },
    { id: 'R3', originFacilityId: 'NLB-02', destinationFacilityId: 'CSD-01', origin: 'NLB-02', destination: 'CSD-01' },
    { id: 'R4', originFacilityId: 'DC-01', destinationFacilityId: 'BEN-02', origin: 'DC-01', destination: 'BEN-02' },
  ];

  it('discovers outgoing routes from a facility', () => {
    const conn = getConnectedRoutesForFacility('CSD-01', routes);
    assert.equal(conn.originRoutes.length, 2);
    assert.ok(conn.originRoutes.some((r) => r.id === 'R1'));
    assert.ok(conn.originRoutes.some((r) => r.id === 'R2'));
  });

  it('discovers incoming routes to a facility', () => {
    const conn = getConnectedRoutesForFacility('CSD-01', routes);
    assert.equal(conn.destinationRoutes.length, 1);
    assert.equal(conn.destinationRoutes[0].id, 'R3');
  });

  it('deduplicates all connected routes', () => {
    const conn = getConnectedRoutesForFacility('CSD-01', routes);
    assert.equal(conn.allConnected.length, 3);
  });

  it('returns empty lists for facility with no connected corridors', () => {
    const conn = getConnectedRoutesForFacility('ISOLATED-CAMP-09', routes);
    assert.equal(conn.allConnected.length, 0);
  });
});

// ─── 7. Zustand Store Route Status Updates & Audit Events ─────────────────────
describe('Stage 4.3 — Zustand Store Route Updates & Audit Trail', () => {
  it('updateRouteStatus updates route status and appends an audit event', () => {
    const stateBefore = useAppStore.getState();
    const initialEventsCount = stateBefore.auditEvents.length;

    const res = useAppStore.getState().updateRouteStatus('RT-MZ-BARGE', 'BLOCKED', 'Severe river flooding');
    assert.equal(res.ok, true);
    assert.equal(res.newStatus, ROUTE_STATUS.BLOCKED);

    const stateAfter = useAppStore.getState();
    assert.equal(stateAfter.auditEvents.length, initialEventsCount + 1);

    const lastEvent = stateAfter.auditEvents[stateAfter.auditEvents.length - 1];
    assert.equal(lastEvent.action, 'ROUTE_STATUS_UPDATED');
    assert.equal(lastEvent.entityId, 'RT-MZ-BARGE');
    assert.equal(lastEvent.newState, ROUTE_STATUS.BLOCKED);
    assert.equal(lastEvent.reason, 'Severe river flooding');
  });

  it('getOperationalRoutes incorporates status overrides and dispatch orders', () => {
    const scenarioRoutes = [
      { id: 'RT-MZ-BARGE', origin: 'CSD-01', destination: 'BEN-01', routeStatus: 'PLANNED', points: [[-19.832, 34.856], [-19.789, 34.821]] },
    ];
    const operational = useAppStore.getState().getOperationalRoutes(scenarioRoutes);
    const bargeRoute = operational.find((r) => r.id === 'RT-MZ-BARGE');
    assert.ok(bargeRoute);
    assert.equal(bargeRoute.routeStatus, ROUTE_STATUS.BLOCKED); // from previous test override
  });
});

// ─── 8. Status Normalization & Legend Coverage ────────────────────────────────
describe('Stage 4.3 — Status Normalization & Visual Legend Mapping', () => {
  it('covers all 5 standardized statuses in ROUTE_STATUS_STYLES', () => {
    const expected = [
      ROUTE_STATUS.ACTIVE,
      ROUTE_STATUS.COMPLETED,
      ROUTE_STATUS.DELAYED,
      ROUTE_STATUS.BLOCKED,
      ROUTE_STATUS.PLANNED,
    ];

    for (const st of expected) {
      assert.ok(ROUTE_STATUS_STYLES[st], `Missing style config for ROUTE_STATUS.${st}`);
      assert.ok(ROUTE_STATUS_STYLES[st].color, `Missing color for ROUTE_STATUS.${st}`);
      assert.ok(ROUTE_STATUS_STYLES[st].badgeVariant, `Missing badgeVariant for ROUTE_STATUS.${st}`);
    }
  });

  it('normalizes legacy scenario statuses correctly', () => {
    assert.equal(normalizeRouteStatus('PASSABLE_OPEN'), ROUTE_STATUS.ACTIVE);
    assert.equal(normalizeRouteStatus('VERIFIED_ACCESSIBLE'), ROUTE_STATUS.ACTIVE);
    assert.equal(normalizeRouteStatus('RESTRICTED'), ROUTE_STATUS.DELAYED);
    assert.equal(normalizeRouteStatus('CONFIRMED_BLOCKED'), ROUTE_STATUS.BLOCKED);
    assert.equal(normalizeRouteStatus('PROPOSED_ALTERNATIVE'), ROUTE_STATUS.PLANNED);
    assert.equal(normalizeRouteStatus('UNKNOWN'), ROUTE_STATUS.PLANNED);
  });
});

