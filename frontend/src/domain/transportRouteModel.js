/**
 * ResQNet Transportation Routes & Network Connectivity Data Model
 * Stage 4.3 Implementation: Multi-echelon logistics route modeling,
 * coordinate boundary validation, dispatch ledger synchronization,
 * routing service abstraction, and directional geometry.
 */

import { isValidCoordinate, normalizeCoordinates } from './geographicModel.js';

/**
 * Standardized Transportation Route Statuses
 */
export const ROUTE_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  DELAYED: 'DELAYED',
  BLOCKED: 'BLOCKED',
  PLANNED: 'PLANNED',
};

/**
 * Standardized Transportation Modes
 */
export const TRANSPORT_MODE = {
  HEAVY_TRUCK: 'HEAVY_TRUCK',
  MEDIUM_TRUCK: 'MEDIUM_TRUCK',
  LIGHT_4WD: 'LIGHT_4WD',
  RIVER_BARGE: 'RIVER_BARGE',
  AIR_CARGO: 'AIR_CARGO',
  HELICOPTER: 'HELICOPTER',
};

/**
 * Route Calculation / Provenance Types
 */
export const ROUTING_TYPE = {
  CALCULATED: 'CALCULATED',
  DEMO_ILLUSTRATIVE: 'DEMO_ILLUSTRATIVE',
};

/**
 * Visual Style Configuration per Route Status
 */
export const ROUTE_STATUS_STYLES = {
  [ROUTE_STATUS.ACTIVE]: {
    color: '#10B981', // Vivid Emerald Green
    weight: 5,
    dashArray: 'none',
    opacity: 0.95,
    label: 'Active (In-Transit)',
    badgeVariant: 'success',
  },
  [ROUTE_STATUS.COMPLETED]: {
    color: '#64748B', // Muted Slate
    weight: 3.5,
    dashArray: '3 3',
    opacity: 0.7,
    label: 'Completed / Delivered',
    badgeVariant: 'neutral',
  },
  [ROUTE_STATUS.DELAYED]: {
    color: '#F59E0B', // Amber
    weight: 4.5,
    dashArray: '6 4',
    opacity: 0.9,
    label: 'Delayed / Restricted',
    badgeVariant: 'warning',
  },
  [ROUTE_STATUS.BLOCKED]: {
    color: '#EF4444', // Crimson Red
    weight: 5,
    dashArray: '5 5',
    opacity: 0.95,
    label: 'Blocked / Impassable',
    badgeVariant: 'critical',
  },
  [ROUTE_STATUS.PLANNED]: {
    color: '#3B82F6', // Blue
    weight: 4,
    dashArray: '8 5',
    opacity: 0.85,
    label: 'Planned / Staged',
    badgeVariant: 'teal',
  },
};

/**
 * Maps legacy scenario status values or dispatch-derived statuses
 * to standardized ROUTE_STATUS.
 *
 * @param {string} status
 * @returns {string} Standardized ROUTE_STATUS value
 */
export function normalizeRouteStatus(status) {
  if (!status) return ROUTE_STATUS.PLANNED;
  const upper = String(status).trim().toUpperCase();

  switch (upper) {
    case 'ACTIVE':
    case 'IN_TRANSIT':
    case 'DISPATCHED':
    case 'PASSABLE_OPEN':
    case 'VERIFIED_ACCESSIBLE':
      return ROUTE_STATUS.ACTIVE;

    case 'COMPLETED':
    case 'DELIVERED':
    case 'VERIFIED':
    case 'PARTIALLY_VERIFIED':
    case 'ARRIVED':
    case 'ARRIVED_AWAITING_POD':
      return ROUTE_STATUS.COMPLETED;

    case 'DELAYED':
    case 'RESTRICTED':
    case 'WARNING':
    case 'CONSTRAINED':
      return ROUTE_STATUS.DELAYED;

    case 'BLOCKED':
    case 'CONFIRMED_BLOCKED':
    case 'IMPASSABLE':
    case 'CLOSED':
      return ROUTE_STATUS.BLOCKED;

    case 'PLANNED':
    case 'APPROVED':
    case 'PREPARING':
    case 'READY':
    case 'PROPOSED_ALTERNATIVE':
    case 'UNKNOWN':
    default:
      return ROUTE_STATUS.PLANNED;
  }
}

/**
 * Validates a single route waypoint coordinate.
 *
 * @param {Array<number>} point - [lat, lng]
 * @returns {boolean} true if valid WGS-84 coordinate point
 */
export function isValidRoutePoint(point) {
  if (!Array.isArray(point) || point.length < 2) return false;
  return isValidCoordinate(point[0], point[1]);
}

/**
 * Validates a complete transportation route record.
 *
 * Requirements:
 * - Must have a unique string id.
 * - Must have an origin facility reference.
 * - Must have a destination facility reference.
 * - Must have an array of at least 2 valid coordinates.
 * - Metric validation: distanceKm and estimatedTime must not be fabricated;
 *   if provided, distanceKm must be a positive finite number.
 * - Origin and destination facilities are verified against known facility lists if provided.
 *
 * @param {Object} route
 * @param {Array<Object>} [existingRoutes=[]]
 * @param {Array<Object>} [facilities=[]]
 * @returns {Object} { ok: boolean, value?: Object, errors: string[] }
 */
export function validateRoute(route, existingRoutes = [], facilities = []) {
  const errors = [];

  if (!route || typeof route !== 'object' || Array.isArray(route)) {
    return { ok: false, errors: ['Route record must be a non-null object'] };
  }

  // 1. Route ID
  if (!route.id || typeof route.id !== 'string' || route.id.trim() === '') {
    errors.push('Route must have a non-empty string ID');
  } else if (existingRoutes.some((r) => r.id === route.id)) {
    errors.push(`Duplicate route ID "${route.id}" already exists`);
  }

  // 2. Origin & Destination
  const originId = route.originFacilityId || route.originId || route.origin;
  const destId = route.destinationFacilityId || route.destinationId || route.destination;

  if (!originId || typeof originId !== 'string' || originId.trim() === '') {
    errors.push('Route must specify a valid origin facility identifier');
  }
  if (!destId || typeof destId !== 'string' || destId.trim() === '') {
    errors.push('Route must specify a valid destination facility identifier');
  }

  // Check known facilities list if provided
  if (facilities.length > 0) {
    const facilityKeys = new Set(
      facilities.flatMap((f) => [f.id, f.code, f.name].filter(Boolean))
    );
    if (originId && !facilityKeys.has(originId) && !facilities.some((f) => originId.includes(f.id) || originId.includes(f.code))) {
      errors.push(`Origin facility "${originId}" is not registered in operational facilities`);
    }
    if (destId && !facilityKeys.has(destId) && !facilities.some((f) => destId.includes(f.id) || destId.includes(f.code))) {
      errors.push(`Destination facility "${destId}" is not registered in operational facilities`);
    }
  }

  // 3. Waypoints / Polyline Points
  if (!Array.isArray(route.points) || route.points.length < 2) {
    errors.push('Route points must be an array of at least two [lat, lng] coordinates');
  } else {
    for (let i = 0; i < route.points.length; i++) {
      if (!isValidRoutePoint(route.points[i])) {
        errors.push(`Route waypoint index ${i} has invalid coordinates: ${JSON.stringify(route.points[i])}`);
      }
    }
  }

  // 4. Metrics Validation (Do not invent or allow negative/corrupted numbers)
  let normalizedDistance = null;
  if (route.distanceKm !== undefined && route.distanceKm !== null) {
    const d = Number(route.distanceKm);
    if (!Number.isFinite(d) || d <= 0) {
      errors.push('distanceKm must be a positive finite number if provided, or null if uncalculated');
    } else {
      normalizedDistance = d;
    }
  }

  let normalizedTime = null;
  if (route.estimatedTime !== undefined && route.estimatedTime !== null) {
    if (typeof route.estimatedTime !== 'string' || route.estimatedTime.trim() === '') {
      errors.push('estimatedTime must be a non-empty string description or null if uncalculated');
    } else {
      normalizedTime = route.estimatedTime.trim();
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const normalizedStatus = normalizeRouteStatus(route.routeStatus || route.status);

  return {
    ok: true,
    value: {
      id: route.id.trim(),
      name: route.name || `Corridor ${route.id}`,
      origin: originId,
      originFacilityId: originId,
      destination: destId,
      destinationFacilityId: destId,
      points: route.points.map((p) => [Number(p[0]), Number(p[1])]),
      distanceKm: normalizedDistance,
      estimatedTime: normalizedTime,
      transportMode: route.transportMode || TRANSPORT_MODE.HEAVY_TRUCK,
      routeStatus: normalizedStatus,
      status: normalizedStatus,
      dispatchId: route.dispatchId || null,
      isDemo: route.isDemo ?? true,
      routingType: route.routingType || (route.isCalculated ? ROUTING_TYPE.CALCULATED : ROUTING_TYPE.DEMO_ILLUSTRATIVE),
      disruptionReason: route.disruptionReason || null,
      notes: route.notes || null,
    },
  };
}

/**
 * Derives the active route status from a connected operational dispatch order.
 *
 * @param {Object} dispatchOrder - Authoritative dispatch order from Zustand store
 * @param {string} [fallbackStatus=ROUTE_STATUS.PLANNED]
 * @returns {string} ROUTE_STATUS value
 */
export function deriveRouteStatusFromDispatch(dispatchOrder, fallbackStatus = ROUTE_STATUS.PLANNED) {
  if (!dispatchOrder) return fallbackStatus;

  // If the dispatch itself flags a critical route blockage
  if (dispatchOrder.isBlocked || dispatchOrder.routeStatus === 'CONFIRMED_BLOCKED') {
    return ROUTE_STATUS.BLOCKED;
  }

  // If delayed or constrained
  if (dispatchOrder.isDelayed || dispatchOrder.status === 'DELAYED') {
    return ROUTE_STATUS.DELAYED;
  }

  const status = (dispatchOrder.status || '').toUpperCase();

  switch (status) {
    case 'IN_TRANSIT':
    case 'DISPATCHED':
      return ROUTE_STATUS.ACTIVE;

    case 'ARRIVED':
    case 'ARRIVED_AWAITING_POD':
    case 'DELIVERED':
    case 'VERIFIED':
    case 'PARTIALLY_VERIFIED':
      return ROUTE_STATUS.COMPLETED;

    case 'APPROVED':
    case 'PREPARING':
    case 'READY':
      return ROUTE_STATUS.PLANNED;

    default:
      return fallbackStatus;
  }
}

/**
 * Calculates bearing angle in degrees between two WGS-84 coordinates.
 * Used for rendering route direction arrows.
 *
 * @param {Array<number>} start - [lat1, lng1]
 * @param {Array<number>} end - [lat2, lng2]
 * @returns {number} Bearing in degrees [0, 360)
 */
export function calculateBearing(start, end) {
  if (!start || !end || start.length < 2 || end.length < 2) return 0;

  const lat1 = (Number(start[0]) * Math.PI) / 180;
  const lat2 = (Number(end[0]) * Math.PI) / 180;
  const dLng = ((Number(end[1]) - Number(start[1])) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Calculates the midpoint coordinate along a polyline.
 *
 * @param {Array<Array<number>>} points - Array of [lat, lng]
 * @returns {Array<number>|null} [lat, lng] of midpoint or null
 */
export function calculateMidpoint(points) {
  if (!Array.isArray(points) || points.length === 0) return null;
  if (points.length === 1) return points[0];

  const midIdx = Math.floor(points.length / 2);
  const p1 = points[midIdx - 1] || points[0];
  const p2 = points[midIdx];

  return [(Number(p1[0]) + Number(p2[0])) / 2, (Number(p1[1]) + Number(p2[1])) / 2];
}

/**
 * Enriches a transportation route with operational dispatch telemetry.
 *
 * @param {Object} route - Base route
 * @param {Array<Object>} [dispatchOrders=[]] - Operational dispatch records
 * @param {Array<Object>} [facilities=[]] - Known facilities
 * @returns {Object} Enriched route record
 */
export function enrichRouteWithDispatch(route, dispatchOrders = [], facilities = []) {
  if (!route) return null;

  // Find linked dispatch by explicit dispatchId, or match by source/destination
  const linkedDispatch = dispatchOrders.find((d) => {
    if (route.dispatchId && d.id === route.dispatchId) return true;
    if (d.routeId && d.routeId === route.id) return true;
    if (d.route && typeof d.route === 'string' && d.route.includes(route.id)) return true;
    return false;
  });

  const liveStatus = linkedDispatch
    ? deriveRouteStatusFromDispatch(linkedDispatch, normalizeRouteStatus(route.routeStatus))
    : normalizeRouteStatus(route.routeStatus);

  return {
    ...route,
    routeStatus: liveStatus,
    status: liveStatus,
    linkedDispatch: linkedDispatch
      ? {
          id: linkedDispatch.id,
          status: linkedDispatch.status,
          commodity: linkedDispatch.commodity || linkedDispatch.lines?.[0]?.commodityId,
          quantity: linkedDispatch.quantity,
          unit: linkedDispatch.unit || linkedDispatch.lines?.[0]?.unit,
          vehicle: linkedDispatch.vehicle || linkedDispatch.vehicleType,
          carrier: linkedDispatch.carrier,
          dispatchedAt: linkedDispatch.dispatchedAt,
          expectedArrival: linkedDispatch.expectedArrival,
        }
      : null,
  };
}

/**
 * Routing Service Abstraction
 * Handles external routing services gracefully without exposing credentials or failing when unavailable.
 * If no service is configured, clearly indicates DEMO illustrative status.
 *
 * @param {Array<number>} origin - [lat, lng]
 * @param {Array<number>} destination - [lat, lng]
 * @param {Object} [options={}]
 * @returns {Promise<Object>}
 */
export async function calculateRoadRoute(origin, destination, options = {}) {
  if (!isValidRoutePoint(origin) || !isValidRoutePoint(destination)) {
    return {
      ok: false,
      isDemo: true,
      routingType: ROUTING_TYPE.DEMO_ILLUSTRATIVE,
      reason: 'INVALID_COORDINATES',
      message: 'Origin or destination coordinates are out of valid bounds.',
      points: [origin, destination],
    };
  }

  // Check if a routing endpoint is injected through safe configuration
  const routingEndpoint = options.routingServiceUrl || (typeof window !== 'undefined' && window.__RESQNET_ROUTING_SERVICE_URL__);

  if (!routingEndpoint) {
    return {
      ok: false,
      isDemo: true,
      routingType: ROUTING_TYPE.DEMO_ILLUSTRATIVE,
      reason: 'NO_ROUTING_SERVICE_CONFIGURED',
      message: 'No external routing service configured. Displaying illustrative demo corridor.',
      points: [origin, destination],
      distanceKm: null,
      estimatedTime: null,
    };
  }

  try {
    const url = `${routingEndpoint}?start=${origin[0]},${origin[1]}&end=${destination[0]},${destination[1]}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Routing HTTP error ${res.status}`);

    const data = await res.json();
    return {
      ok: true,
      isDemo: false,
      routingType: ROUTING_TYPE.CALCULATED,
      points: data.coordinates || [origin, destination],
      distanceKm: Number.isFinite(data.distanceKm) ? data.distanceKm : null,
      estimatedTime: data.estimatedTime || null,
    };
  } catch (err) {
    return {
      ok: false,
      isDemo: true,
      routingType: ROUTING_TYPE.DEMO_ILLUSTRATIVE,
      reason: 'ROUTING_SERVICE_UNAVAILABLE',
      message: `Routing service unavailable (${err.message}). Displaying illustrative demo corridor.`,
      points: [origin, destination],
      distanceKm: null,
      estimatedTime: null,
    };
  }
}

/**
 * Discovers all connected routes for a facility (origin or destination).
 *
 * @param {string} facilityId
 * @param {Array<Object>} routes
 * @returns {Object} { originRoutes, destinationRoutes, allConnected }
 */
export function getConnectedRoutesForFacility(facilityId, routes = []) {
  if (!facilityId) return { originRoutes: [], destinationRoutes: [], allConnected: [] };

  const id = String(facilityId).trim();

  const isMatch = (val) => {
    if (!val) return false;
    const str = String(val);
    return str === id || str.includes(id);
  };

  const originRoutes = routes.filter((r) => isMatch(r.originFacilityId) || isMatch(r.origin));
  const destinationRoutes = routes.filter((r) => isMatch(r.destinationFacilityId) || isMatch(r.destination));

  const allConnectedMap = new Map();
  [...originRoutes, ...destinationRoutes].forEach((r) => allConnectedMap.set(r.id, r));

  return {
    originRoutes,
    destinationRoutes,
    allConnected: Array.from(allConnectedMap.values()),
  };
}

