/**
 * ResQNet Disaster Zones & Geographical Risk Layers Data Model
 * Stage 4.4 Implementation: Multi-hazard spatial modeling (floods, conflicts, pandemics,
 * evacuation perimeters, restricted access), GeoJSON boundary validation,
 * ray-casting point-in-polygon and polyline-polygon intersection, and risk telemetry.
 */

import { isValidCoordinate } from './geographicModel.js';

/**
 * Standardized Disaster & Hazard Types
 */
export const DISASTER_TYPE = {
  FLOOD: 'FLOOD',
  CONFLICT: 'CONFLICT',
  PANDEMIC: 'PANDEMIC',
  RESTRICTED_ACCESS: 'RESTRICTED_ACCESS',
  EVACUATION_ZONE: 'EVACUATION_ZONE',
};

/**
 * Standardized Risk Severity Levels
 */
export const RISK_SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MODERATE: 'MODERATE',
  LOW: 'LOW',
};

/**
 * Standardized Zone Operational Statuses
 */
export const ZONE_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPANDING: 'EXPANDING',
  RECEDING: 'RECEDING',
  CONTAINED: 'CONTAINED',
  MONITORED: 'MONITORED',
  CLOSED: 'CLOSED',
};

/**
 * Data Classification
 */
export const DATA_CLASSIFICATION = {
  DEMO: 'DEMO',
  LIVE: 'LIVE',
};

/**
 * Visual Style Configuration per Risk Severity
 * Ensures transparent fills so underlying facilities and routes remain visible.
 */
export const RISK_SEVERITY_STYLES = {
  [RISK_SEVERITY.CRITICAL]: {
    color: '#EF4444',       // Crimson Red border
    fillColor: '#EF4444',
    fillOpacity: 0.22,
    weight: 2.5,
    dashArray: 'none',
    label: 'Critical Risk',
    badgeVariant: 'critical',
  },
  [RISK_SEVERITY.HIGH]: {
    color: '#F97316',       // Vivid Orange border
    fillColor: '#F97316',
    fillOpacity: 0.20,
    weight: 2,
    dashArray: '5 5',
    label: 'High Risk',
    badgeVariant: 'warning',
  },
  [RISK_SEVERITY.MODERATE]: {
    color: '#F59E0B',       // Amber / Yellow border
    fillColor: '#F59E0B',
    fillOpacity: 0.18,
    weight: 2,
    dashArray: '4 4',
    label: 'Moderate Risk',
    badgeVariant: 'warning',
  },
  [RISK_SEVERITY.LOW]: {
    color: '#10B981',       // Emerald Green border
    fillColor: '#10B981',
    fillOpacity: 0.15,
    weight: 1.5,
    dashArray: '3 3',
    label: 'Low Risk',
    badgeVariant: 'success',
  },
};

/**
 * Disaster Type Presentation Config
 */
export const DISASTER_TYPE_CONFIG = {
  [DISASTER_TYPE.FLOOD]: {
    label: 'Flood Inundation Area',
    color: '#2563EB', // Blue
    accent: '#3B82F6',
  },
  [DISASTER_TYPE.CONFLICT]: {
    label: 'Armed Conflict Zone',
    color: '#DC2626', // Red
    accent: '#EF4444',
  },
  [DISASTER_TYPE.PANDEMIC]: {
    label: 'Epidemic / Biosecurity Zone',
    color: '#D97706', // Amber
    accent: '#F59E0B',
  },
  [DISASTER_TYPE.RESTRICTED_ACCESS]: {
    label: 'Restricted Access Perimeter',
    color: '#7C3AED', // Purple
    accent: '#8B5CF6',
  },
  [DISASTER_TYPE.EVACUATION_ZONE]: {
    label: 'Evacuation Warning Zone',
    color: '#EA580C', // Orange
    accent: '#F97316',
  },
};

/**
 * Validates a GeoJSON Polygon or MultiPolygon coordinate ring.
 *
 * @param {Array} ring - Array of [longitude, latitude] or [lat, lng] pairs
 * @returns {boolean} true if ring is valid
 */
export function isValidLinearRing(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return false;

  for (const coord of ring) {
    if (!Array.isArray(coord) || coord.length < 2) return false;
    const [c1, c2] = coord;
    // Handle both [lng, lat] (standard GeoJSON) and [lat, lng] (Leaflet order)
    const validAsLngLat = isValidCoordinate(c2, c1);
    const validAsLatLng = isValidCoordinate(c1, c2);
    if (!validAsLngLat && !validAsLatLng) return false;
  }

  return true;
}

/**
 * Normalizes GeoJSON coordinates into Leaflet-ready [latitude, longitude] arrays.
 * Handles both GeoJSON [longitude, latitude] and Leaflet [latitude, longitude].
 *
 * @param {Object} geometry - GeoJSON geometry object { type, coordinates }
 * @returns {Array<Array<number>>|Array<Array<Array<number>>>|null} Leaflet coordinates
 */
export function normalizeGeometryToLeaflet(geometry) {
  if (!geometry || typeof geometry !== 'object') return null;

  const { type, coordinates } = geometry;
  if (!type || !Array.isArray(coordinates) || coordinates.length === 0) return null;

  const normalizePoint = (pt) => {
    if (!Array.isArray(pt) || pt.length < 2) return null;
    const a = Number(pt[0]);
    const b = Number(pt[1]);

    // GeoJSON standard is [longitude, latitude]
    // If b is valid latitude (-90 to 90) and a is valid longitude (-180 to 180):
    if (isValidCoordinate(b, a)) {
      return [b, a]; // return [latitude, longitude]
    }
    // If a is valid latitude and b is valid longitude:
    if (isValidCoordinate(a, b)) {
      return [a, b];
    }
    return null;
  };

  if (type === 'Polygon') {
    // Outer ring coordinates
    const outerRing = coordinates[0];
    if (!Array.isArray(outerRing) || outerRing.length < 3) return null;
    const latLngs = [];
    for (const pt of outerRing) {
      const norm = normalizePoint(pt);
      if (!norm) return null;
      latLngs.push(norm);
    }
    return latLngs;
  }

  if (type === 'MultiPolygon') {
    const multiLatLngs = [];
    for (const poly of coordinates) {
      const outerRing = poly[0];
      if (!Array.isArray(outerRing) || outerRing.length < 3) return null;
      const ringLatLngs = [];
      for (const pt of outerRing) {
        const norm = normalizePoint(pt);
        if (!norm) return null;
        ringLatLngs.push(norm);
      }
      multiLatLngs.push(ringLatLngs);
    }
    return multiLatLngs;
  }

  return null;
}

/**
 * Validates a disaster zone record.
 *
 * Requirements:
 * - Must have unique string id.
 * - Must have non-empty name.
 * - Must have valid disasterType.
 * - Must have valid GeoJSON geometry (Polygon or MultiPolygon) within WGS-84 coordinate bounds.
 * - Must have valid risk severity (LOW, MODERATE, HIGH, CRITICAL).
 * - Must have valid status.
 * - Must have a non-empty source of information string.
 * - Must have lastUpdated timestamp.
 * - Explicitly preserves DEMO/LIVE classification.
 *
 * @param {Object} zone
 * @param {Array<Object>} [existingZones=[]]
 * @returns {Object} { ok: boolean, value?: Object, errors: string[] }
 */
export function validateDisasterZone(zone, existingZones = []) {
  const errors = [];

  if (!zone || typeof zone !== 'object' || Array.isArray(zone)) {
    return { ok: false, errors: ['Disaster zone record must be a non-null object'] };
  }

  // 1. Zone ID
  if (!zone.id || typeof zone.id !== 'string' || zone.id.trim() === '') {
    errors.push('Disaster zone must have a non-empty string ID');
  } else if (existingZones.some((z) => z.id === zone.id)) {
    errors.push(`Duplicate disaster zone ID "${zone.id}" already exists`);
  }

  // 2. Zone Name
  if (!zone.name || typeof zone.name !== 'string' || zone.name.trim() === '') {
    errors.push('Disaster zone must have a descriptive name');
  }

  // 3. Disaster Type
  const validTypes = Object.values(DISASTER_TYPE);
  if (!zone.disasterType || !validTypes.includes(zone.disasterType)) {
    errors.push(`Invalid disasterType "${zone.disasterType}". Must be one of: ${validTypes.join(', ')}`);
  }

  // 4. Geometry Validation
  if (!zone.geometry || typeof zone.geometry !== 'object') {
    errors.push('Disaster zone must contain a GeoJSON geometry object');
  } else {
    const { type, coordinates } = zone.geometry;
    if (!['Polygon', 'MultiPolygon'].includes(type)) {
      errors.push(`Geometry type must be "Polygon" or "MultiPolygon", got "${type}"`);
    } else if (!Array.isArray(coordinates) || coordinates.length === 0) {
      errors.push('Geometry coordinates must be a non-empty array');
    } else {
      const normalized = normalizeGeometryToLeaflet(zone.geometry);
      if (!normalized) {
        errors.push('Geometry contains invalid, out-of-bounds, or incomplete coordinates');
      }
    }
  }

  // 5. Severity Level
  const validSeverities = Object.values(RISK_SEVERITY);
  const severity = (zone.severity || '').toUpperCase();
  if (!validSeverities.includes(severity)) {
    errors.push(`Invalid severity "${zone.severity}". Must be one of: ${validSeverities.join(', ')}`);
  }

  // 6. Operational Status
  const validStatuses = Object.values(ZONE_STATUS);
  const status = (zone.status || ZONE_STATUS.ACTIVE).toUpperCase();
  if (!validStatuses.includes(status)) {
    errors.push(`Invalid status "${zone.status}". Must be one of: ${validStatuses.join(', ')}`);
  }

  // 7. Source of Information (Required for data integrity — prevents unverified claims)
  if (!zone.source || typeof zone.source !== 'string' || zone.source.trim() === '') {
    errors.push('Disaster zone must specify a validated source of information');
  }

  // 8. Last Updated
  if (!zone.lastUpdated || typeof zone.lastUpdated !== 'string' || Number.isNaN(new Date(zone.lastUpdated).getTime())) {
    errors.push('Disaster zone must specify a valid lastUpdated ISO timestamp');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const normalizedLatLngs = normalizeGeometryToLeaflet(zone.geometry);

  return {
    ok: true,
    value: {
      id: zone.id.trim(),
      name: zone.name.trim(),
      disasterType: zone.disasterType,
      geometry: zone.geometry,
      leafletLatLngs: normalizedLatLngs,
      geometryType: zone.geometry.type,
      severity,
      status,
      source: zone.source.trim(),
      lastUpdated: new Date(zone.lastUpdated).toISOString(),
      isDemo: zone.isDemo ?? (zone.dataClassification !== DATA_CLASSIFICATION.LIVE),
      dataClassification: (zone.isDemo === false || zone.dataClassification === DATA_CLASSIFICATION.LIVE) ? DATA_CLASSIFICATION.LIVE : DATA_CLASSIFICATION.DEMO,
      description: zone.description || null,
      notes: zone.notes || null,
    },
  };
}

// ─── Spatial Geometry & Impact Analysis ──────────────────────────────────────

/**
 * Standard ray-casting algorithm to test if a point [lat, lng] is inside a polygon ring.
 *
 * @param {Array<number>} point - [latitude, longitude]
 * @param {Array<Array<number>>} polygonRing - Array of [latitude, longitude]
 * @returns {boolean} true if inside
 */
export function isPointInPolygon(point, polygonRing) {
  if (!point || !Array.isArray(polygonRing) || polygonRing.length < 3) return false;

  const lat = Number(point[0]);
  const lng = Number(point[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  let inside = false;
  const n = polygonRing.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygonRing[i][0];
    const yi = polygonRing[i][1];
    const xj = polygonRing[j][0];
    const yj = polygonRing[j][1];

    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Tests if a point is inside a MultiPolygon.
 *
 * @param {Array<number>} point - [lat, lng]
 * @param {Array<Array<Array<number>>>} multiPolygon
 * @returns {boolean} true if inside any polygon
 */
export function isPointInMultiPolygon(point, multiPolygon) {
  if (!Array.isArray(multiPolygon) || multiPolygon.length === 0) return false;
  for (const ring of multiPolygon) {
    if (isPointInPolygon(point, ring)) return true;
  }
  return false;
}

/**
 * Tests if two 2D line segments (p1-p2 and p3-p4) intersect.
 */
export function doLineSegmentsIntersect(p1, p2, p3, p4) {
  const ccw = (A, B, C) => (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Tests whether a facility is geographically inside a disaster zone.
 *
 * @param {Object} facility - Facility with coordinates [lat, lng] or { lat, lng } or { latitude, longitude }
 * @param {Object} zone - Validated disaster zone
 * @returns {boolean} true if facility is located inside the zone
 */
export function isFacilityInZone(facility, zone) {
  if (!facility || !zone) return false;

  let pt = null;
  if (Array.isArray(facility.coordinates)) {
    pt = facility.coordinates;
  } else if (facility.coordinates && typeof facility.coordinates === 'object') {
    pt = [facility.coordinates.lat ?? facility.coordinates.latitude, facility.coordinates.lng ?? facility.coordinates.longitude];
  } else if (facility.latitude !== undefined && facility.longitude !== undefined) {
    pt = [facility.latitude, facility.longitude];
  }

  if (!pt || !isValidCoordinate(pt[0], pt[1])) return false;

  const latLngs = zone.leafletLatLngs || normalizeGeometryToLeaflet(zone.geometry);
  if (!latLngs) return false;

  if (zone.geometry?.type === 'MultiPolygon' || (Array.isArray(latLngs[0]) && Array.isArray(latLngs[0][0]))) {
    return isPointInMultiPolygon(pt, latLngs);
  }

  return isPointInPolygon(pt, latLngs);
}

/**
 * Tests whether a transportation route polyline intersects a disaster zone.
 * A route intersects if any of its waypoints are inside the zone, OR if any route segment
 * crosses the zone boundary ring.
 *
 * @param {Object} route - Transportation route with .points
 * @param {Object} zone - Validated disaster zone
 * @returns {boolean} true if route intersects
 */
export function isRouteIntersectingZone(route, zone) {
  if (!route || !Array.isArray(route.points) || route.points.length === 0 || !zone) return false;

  const latLngs = zone.leafletLatLngs || normalizeGeometryToLeaflet(zone.geometry);
  if (!latLngs) return false;

  const rings = (zone.geometry?.type === 'MultiPolygon' || (Array.isArray(latLngs[0]) && Array.isArray(latLngs[0][0])))
    ? latLngs
    : [latLngs];

  // 1. Check if any waypoint point is inside any ring
  for (const pt of route.points) {
    for (const ring of rings) {
      if (isPointInPolygon(pt, ring)) return true;
    }
  }

  // 2. Check if any route line segment crosses any ring boundary segment
  for (let r = 0; r < route.points.length - 1; r++) {
    const rStart = route.points[r];
    const rEnd = route.points[r + 1];

    for (const ring of rings) {
      for (let s = 0, t = ring.length - 1; s < ring.length; t = s++) {
        if (doLineSegmentsIntersect(rStart, rEnd, ring[t], ring[s])) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Performs comprehensive exposure impact analysis for a disaster zone against
 * all registered facilities and transportation corridors.
 *
 * NOTE: Geographic intersection indicates POTENTIAL EXPOSURE, NOT CONFIRMED DAMAGE.
 *
 * @param {Object} zone - Disaster zone record
 * @param {Array<Object>} [facilities=[]]
 * @param {Array<Object>} [routes=[]]
 * @returns {Object} Impact telemetry object
 */
export function analyzeZoneImpact(zone, facilities = [], routes = []) {
  if (!zone) {
    return { exposedFacilities: [], exposedRoutes: [], summary: { facilityCount: 0, routeCount: 0 } };
  }

  const exposedFacilities = [];
  for (const fac of facilities) {
    if (isFacilityInZone(fac, zone)) {
      exposedFacilities.push({
        id: fac.id,
        code: fac.code || fac.id,
        name: fac.name,
        type: fac.type || fac.category || 'FACILITY',
        operationalStatus: fac.operationalStatus || fac.status || 'OPERATIONAL',
        isInsideZone: true,
      });
    }
  }

  const exposedRoutes = [];
  for (const rt of routes) {
    if (isRouteIntersectingZone(rt, zone)) {
      exposedRoutes.push({
        id: rt.id,
        name: rt.name || rt.id,
        origin: rt.origin,
        destination: rt.destination,
        routeStatus: rt.routeStatus || rt.status || 'ACTIVE',
        isIntersecting: true,
      });
    }
  }

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    severity: zone.severity,
    disasterType: zone.disasterType,
    exposedFacilities,
    exposedRoutes,
    summary: {
      facilityCount: exposedFacilities.length,
      routeCount: exposedRoutes.length,
      hasCriticalFacilityExposure: exposedFacilities.some((f) => f.operationalStatus === 'CRITICAL'),
      hasBlockedCorridorExposure: exposedRoutes.some((r) => r.routeStatus === 'BLOCKED'),
    },
    exposureDisclaimer: 'Geographic intersection indicates potential exposure, not confirmed damage. Operational status reflects verified ground records.',
  };
}

