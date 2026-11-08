/**
 * ResQNet Geographic Alerts & Multi-Criteria Map Filtering Model
 * Stage 4.5 Implementation: Automated risk alert synthesis, non-destructive exposure
 * detection, cross-dashboard telemetry integration, and multi-dimensional spatial filtering.
 */

import { isValidCoordinate } from './geographicModel.js';
import { isFacilityInZone, isRouteIntersectingZone } from './disasterZoneModel.js';
import { normalizeRouteStatus } from './transportRouteModel.js';

/**
 * Standardized Geographic Alert Categories
 */
export const GEOGRAPHIC_ALERT_CATEGORY = {
  FACILITY_IN_DISASTER_ZONE: 'FACILITY_IN_DISASTER_ZONE',
  ROUTE_IN_DISASTER_ZONE: 'ROUTE_IN_DISASTER_ZONE',
  RESTRICTED_ACCESS: 'RESTRICTED_ACCESS',
  BLOCKED_ROUTE: 'BLOCKED_ROUTE',
  STALE_OR_MISSING_GEO: 'STALE_OR_MISSING_GEO',
};

/**
 * Alert Severities
 */
export const ALERT_SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  WARNING: 'WARNING',
  INFO: 'INFO',
};

/**
 * Alert Statuses
 */
export const ALERT_STATUS = {
  ACTIVE: 'ACTIVE',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  DISMISSED: 'DISMISSED',
};

/**
 * Severity Styling Map
 */
export const ALERT_SEVERITY_STYLES = {
  [ALERT_SEVERITY.CRITICAL]: {
    color: '#EF4444',
    bg: '#FEF2F2',
    border: '#F87171',
    badgeVariant: 'critical',
  },
  [ALERT_SEVERITY.HIGH]: {
    color: '#F97316',
    bg: '#FFF7ED',
    border: '#FB923C',
    badgeVariant: 'warning',
  },
  [ALERT_SEVERITY.WARNING]: {
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FCD34D',
    badgeVariant: 'warning',
  },
  [ALERT_SEVERITY.INFO]: {
    color: '#0284C7',
    bg: '#F0F9FF',
    border: '#7DD3FC',
    badgeVariant: 'teal',
  },
};

/**
 * Synthesizes geographic alerts by analyzing facility locations, routes,
 * and disaster zones against authoritative operational state.
 *
 * Requirements:
 * - Distinguishes potential geographic exposure from confirmed operational incidents.
 * - Does not automatically classify geographical intersections as confirmed damage.
 * - Does not invent real-time alerts without data backing.
 *
 * @param {Array<Object>} facilities - Known facilities / geographic locations
 * @param {Array<Object>} routes - Transport corridors
 * @param {Array<Object>} disasterZones - Hazard zones
 * @param {Array<string>} [dismissedIds=[]] - List of dismissed alert IDs
 * @returns {Array<Object>} Active geographic alerts
 */
export function generateGeographicAlerts(
  facilities = [],
  routes = [],
  disasterZones = [],
  dismissedIds = []
) {
  const dismissedSet = new Set(dismissedIds);
  const alerts = [];

  // 1. Alerts for facilities inside disaster zones (Potential Exposure)
  for (const zone of disasterZones) {
    for (const fac of facilities) {
      if (isFacilityInZone(fac, zone)) {
        const alertId = `ALT-FAC-${fac.id || fac.code}-${zone.id}`;
        if (!dismissedSet.has(alertId)) {
          const lat = fac.latitude ?? fac.coordinates?.lat ?? (Array.isArray(fac.coordinates) ? fac.coordinates[0] : null);
          const lng = fac.longitude ?? fac.coordinates?.lng ?? (Array.isArray(fac.coordinates) ? fac.coordinates[1] : null);

          alerts.push({
            id: alertId,
            category: GEOGRAPHIC_ALERT_CATEGORY.FACILITY_IN_DISASTER_ZONE,
            relatedEntityId: fac.id || fac.code,
            relatedZoneId: zone.id,
            entityType: 'FACILITY',
            severity: zone.severity === 'CRITICAL' ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.HIGH,
            title: `Potential Hazard Exposure: ${fac.name}`,
            description: `Facility is located within the boundary of ${zone.name} (${zone.disasterType} - ${zone.severity}). Operational status is currently ${fac.operationalStatus || fac.status || 'OPERATIONAL'}.`,
            source: zone.source,
            timestamp: zone.lastUpdated,
            status: ALERT_STATUS.ACTIVE,
            coordinates: lat !== null && lng !== null ? [lat, lng] : null,
            isPotentialExposure: true,
            isConfirmedIncident: false,
            isDemo: true,
          });
        }
      }
    }
  }

  // 2. Alerts for blocked transportation corridors (Confirmed Blockages)
  for (const rt of routes) {
    const norm = normalizeRouteStatus(rt.routeStatus);
    if (norm === 'BLOCKED' || rt.routeStatus === 'CONFIRMED_BLOCKED') {
      const alertId = `ALT-RT-BLOCKED-${rt.id}`;
      if (!dismissedSet.has(alertId)) {
        const midPoint = Array.isArray(rt.points) && rt.points.length > 0
          ? rt.points[Math.floor(rt.points.length / 2)]
          : null;

        alerts.push({
          id: alertId,
          category: GEOGRAPHIC_ALERT_CATEGORY.BLOCKED_ROUTE,
          relatedEntityId: rt.id,
          entityType: 'ROUTE',
          severity: ALERT_SEVERITY.CRITICAL,
          title: `Blocked Corridor: ${rt.name || rt.id}`,
          description: rt.disruptionReason || `Corridor ${rt.origin} → ${rt.destination} is confirmed impassable to all freight.`,
          source: 'Field Logistics Reconnaissance',
          timestamp: new Date().toISOString(),
          status: ALERT_STATUS.ACTIVE,
          coordinates: midPoint,
          isPotentialExposure: false,
          isConfirmedIncident: true,
          isDemo: true,
        });
      }
    }
  }

  // 3. Alerts for corridors intersecting disaster zones (Corridor Risk)
  for (const zone of disasterZones) {
    for (const rt of routes) {
      const norm = normalizeRouteStatus(rt.routeStatus);
      // If route is not already confirmed blocked, but intersects a hazard zone
      if (norm !== 'BLOCKED' && isRouteIntersectingZone(rt, zone)) {
        const alertId = `ALT-RT-ZONE-${rt.id}-${zone.id}`;
        if (!dismissedSet.has(alertId)) {
          const midPoint = Array.isArray(rt.points) && rt.points.length > 0
            ? rt.points[Math.floor(rt.points.length / 2)]
            : null;

          alerts.push({
            id: alertId,
            category: GEOGRAPHIC_ALERT_CATEGORY.ROUTE_IN_DISASTER_ZONE,
            relatedEntityId: rt.id,
            relatedZoneId: zone.id,
            entityType: 'ROUTE',
            severity: ALERT_SEVERITY.WARNING,
            title: `Corridor Ingress Risk: ${rt.name || rt.id}`,
            description: `Route traverses ${zone.name}. Drivers and convoys advised of potential ${zone.disasterType.toLowerCase()} disruptions.`,
            source: zone.source,
            timestamp: zone.lastUpdated,
            status: ALERT_STATUS.ACTIVE,
            coordinates: midPoint,
            isPotentialExposure: true,
            isConfirmedIncident: false,
            isDemo: true,
          });
        }
      }
    }
  }

  // 4. Alerts for facilities with restricted/constrained operational status
  for (const fac of facilities) {
    const status = (fac.operationalStatus || fac.status || '').toUpperCase();
    if (status === 'CONSTRAINED' || status === 'CRITICAL') {
      const alertId = `ALT-FAC-STATUS-${fac.id || fac.code}`;
      if (!dismissedSet.has(alertId)) {
        const lat = fac.latitude ?? fac.coordinates?.lat ?? (Array.isArray(fac.coordinates) ? fac.coordinates[0] : null);
        const lng = fac.longitude ?? fac.coordinates?.lng ?? (Array.isArray(fac.coordinates) ? fac.coordinates[1] : null);

        alerts.push({
          id: alertId,
          category: GEOGRAPHIC_ALERT_CATEGORY.RESTRICTED_ACCESS,
          relatedEntityId: fac.id || fac.code,
          entityType: 'FACILITY',
          severity: status === 'CRITICAL' ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
          title: `Capacity Constraint: ${fac.name}`,
          description: `Facility is operating under ${status} capacity and road access restrictions.`,
          source: 'Depot Operations Management',
          timestamp: new Date().toISOString(),
          status: ALERT_STATUS.ACTIVE,
          coordinates: lat !== null && lng !== null ? [lat, lng] : null,
          isPotentialExposure: false,
          isConfirmedIncident: true,
          isDemo: true,
        });
      }
    }
  }

  // 5. Alerts for invalid or missing geographic coordinates
  for (const fac of facilities) {
    const lat = fac.latitude ?? fac.coordinates?.lat ?? (Array.isArray(fac.coordinates) ? fac.coordinates[0] : null);
    const lng = fac.longitude ?? fac.coordinates?.lng ?? (Array.isArray(fac.coordinates) ? fac.coordinates[1] : null);

    if (!isValidCoordinate(lat, lng)) {
      const alertId = `ALT-GEO-MISSING-${fac.id || fac.code}`;
      if (!dismissedSet.has(alertId)) {
        alerts.push({
          id: alertId,
          category: GEOGRAPHIC_ALERT_CATEGORY.STALE_OR_MISSING_GEO,
          relatedEntityId: fac.id || fac.code,
          entityType: 'FACILITY',
          severity: ALERT_SEVERITY.INFO,
          title: `Missing Coordinates: ${fac.name || fac.id}`,
          description: `Facility has missing or out-of-bounds geographic coordinates and cannot be rendered on GIS canvas.`,
          source: 'GIS Data Quality Audit',
          timestamp: new Date().toISOString(),
          status: ALERT_STATUS.ACTIVE,
          coordinates: null,
          isPotentialExposure: false,
          isConfirmedIncident: false,
          isDemo: true,
        });
      }
    }
  }

  return alerts;
}

/**
 * Comprehensive multi-criteria filter evaluation engine.
 * Filters facilities, routes, and disaster zones together.
 *
 * @param {Object} data - { entities, geoLocations, routes, disasterZones }
 * @param {Object} filters - Active filter settings
 * @returns {Object} Filtered datasets + active filter count
 */
export function applyCombinedMapFilters(data = {}, filters = {}) {
  const {
    entities = [],
    geoLocations = [],
    routes = [],
    disasterZones = [],
  } = data;

  const {
    facilityType = 'ALL',
    facilityStatus = 'ALL',
    disasterType = 'ALL',
    disasterSeverity = 'ALL',
    routeStatus = 'ALL',
    transportMode = 'ALL',
    dataClassification = 'ALL',
    searchTerm = '',
  } = filters;

  const search = searchTerm.trim().toLowerCase();

  // Helper: check search match
  const matchesSearch = (text) => !search || String(text || '').toLowerCase().includes(search);

  // 1. Filter Entities (scenario echelons)
  const filteredEntities = entities.filter((e) => {
    if (facilityType !== 'ALL' && e.category !== facilityType) return false;
    if (facilityStatus !== 'ALL' && (e.operationalStatus || e.status) !== facilityStatus) return false;
    if (!matchesSearch(e.name) && !matchesSearch(e.code) && !matchesSearch(e.id)) return false;
    return true;
  });

  // 2. Filter GIS Geographic Locations
  const filteredGeoLocations = geoLocations.filter((g) => {
    if (facilityType !== 'ALL' && g.type !== facilityType) return false;
    if (facilityStatus !== 'ALL' && (g.operationalStatus || g.status) !== facilityStatus) return false;
    if (dataClassification !== 'ALL') {
      const isDemo = g.isDemo ?? true;
      if (dataClassification === 'DEMO' && !isDemo) return false;
      if (dataClassification === 'LIVE' && isDemo) return false;
    }
    if (!matchesSearch(g.name) && !matchesSearch(g.code) && !matchesSearch(g.id)) return false;
    return true;
  });

  // 3. Filter Transport Routes
  const filteredRoutes = routes.filter((r) => {
    if (routeStatus !== 'ALL') {
      const norm = normalizeRouteStatus(r.routeStatus);
      if (norm !== routeStatus && r.routeStatus !== routeStatus) return false;
    }
    if (transportMode !== 'ALL') {
      const mode = String(r.transportMode || '').toUpperCase();
      if (!mode.includes(transportMode)) return false;
    }
    if (dataClassification !== 'ALL') {
      const isDemo = r.isDemo ?? true;
      if (dataClassification === 'DEMO' && !isDemo) return false;
      if (dataClassification === 'LIVE' && isDemo) return false;
    }
    if (!matchesSearch(r.name) && !matchesSearch(r.id) && !matchesSearch(r.origin) && !matchesSearch(r.destination)) {
      return false;
    }
    return true;
  });

  // 4. Filter Disaster Hazard Zones
  const filteredDisasterZones = disasterZones.filter((z) => {
    if (disasterType !== 'ALL' && z.disasterType !== disasterType) return false;
    if (disasterSeverity !== 'ALL' && z.severity !== disasterSeverity) return false;
    if (dataClassification !== 'ALL') {
      const isDemo = z.isDemo ?? true;
      if (dataClassification === 'DEMO' && !isDemo) return false;
      if (dataClassification === 'LIVE' && isDemo) return false;
    }
    if (!matchesSearch(z.name) && !matchesSearch(z.id)) return false;
    return true;
  });

  // Calculate active filter count
  let activeFilterCount = 0;
  if (facilityType !== 'ALL') activeFilterCount++;
  if (facilityStatus !== 'ALL') activeFilterCount++;
  if (disasterType !== 'ALL') activeFilterCount++;
  if (disasterSeverity !== 'ALL') activeFilterCount++;
  if (routeStatus !== 'ALL') activeFilterCount++;
  if (transportMode !== 'ALL') activeFilterCount++;
  if (dataClassification !== 'ALL') activeFilterCount++;
  if (search) activeFilterCount++;

  const totalResults =
    filteredEntities.length +
    filteredGeoLocations.length +
    filteredRoutes.length +
    filteredDisasterZones.length;

  return {
    filteredEntities,
    filteredGeoLocations,
    filteredRoutes,
    filteredDisasterZones,
    activeFilterCount,
    isEmpty: totalResults === 0,
    totalResults,
  };
}

