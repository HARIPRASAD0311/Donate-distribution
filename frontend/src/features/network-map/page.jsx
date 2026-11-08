import React, { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { lotBalances } from '../../domain/operationalLedger.js';
import { getNetworkMapData } from './data/networkMapData.js';
import { NetworkMapCanvas } from './components/NetworkMapCanvas.jsx';
import { MapLayerControlPanel } from './components/MapLayerControlPanel.jsx';
import { MapTopToolbar } from './components/MapTopToolbar.jsx';
import { NetworkMapLegend } from './components/NetworkMapLegend.jsx';
import { EntityDetailDrawer } from './components/EntityDetailDrawer.jsx';
import { RouteDetailDrawer } from './components/RouteDetailDrawer.jsx';
import { GeoLocationDetailPanel } from './components/GeoLocationDetailPanel.jsx';
import { DisasterZoneDetailPanel } from './components/DisasterZoneDetailPanel.jsx';
import { GeographicAlertPanel } from './components/GeographicAlertPanel.jsx';
import { GEOGRAPHIC_LOCATION_TYPE } from '../../domain/geographicModel.js';
import { normalizeRouteStatus } from '../../domain/transportRouteModel.js';
import { applyCombinedMapFilters } from '../../domain/geographicAlertsModel.js';

export default function NetworkMapPage() {
  const { selectedIncident, selectedCrisisType, selectedRegion } = useAppStore();

  // Selected entities and drawer states
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isEntityDrawerOpen, setIsEntityDrawerOpen] = useState(false);
  const [isRouteDrawerOpen, setIsRouteDrawerOpen] = useState(false);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);

  // Stage 4.2 — GIS geographic model state
  const [selectedGeoLocation, setSelectedGeoLocation] = useState(null);
  const [isGeoDetailOpen, setIsGeoDetailOpen] = useState(false);
  const [geoVisibleTypes, setGeoVisibleTypes] = useState(Object.values(GEOGRAPHIC_LOCATION_TYPE));

  // Retrieve enriched geographic entities from Zustand (Stage 4.1 model)
  const getGeographicEntities = useAppStore((state) => state.getGeographicEntities);
  const geoLocations = useMemo(() => {
    try {
      return getGeographicEntities ? getGeographicEntities() : [];
    } catch {
      return [];
    }
  }, [getGeographicEntities]);

  // Stage 4.4 — Disaster Zones & Geographical Risk Layers state
  const [selectedDisasterZone, setSelectedDisasterZone] = useState(null);
  const [isZoneDetailOpen, setIsZoneDetailOpen] = useState(false);

  const getDisasterZones = useAppStore((state) => state.getDisasterZones);
  const disasterZones = useMemo(() => {
    try {
      return getDisasterZones ? getDisasterZones() : [];
    } catch {
      return [];
    }
  }, [getDisasterZones]);

  // Stage 4.5 — Geographic Alerts & Cross-Dashboard State
  const dismissedGeographicAlertIds = useAppStore((state) => state.dismissedGeographicAlertIds);
  const getGeographicAlerts = useAppStore((state) => state.getGeographicAlerts);
  const dismissGeographicAlert = useAppStore((state) => state.dismissGeographicAlert);
  const focusedMapEntity = useAppStore((state) => state.focusedMapEntity);
  const focusMapOnEntity = useAppStore((state) => state.focusMapOnEntity);
  const clearMapFocus = useAppStore((state) => state.clearMapFocus);

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [resetTrigger, setResetTrigger] = useState(0);

  const [layers, setLayers] = useState({
    facilities: true,
    beneficiaries: true,
    routes: true,
    affectedAreas: true,
    infrastructureDamage: true,
    demandConcentration: false,
    resourceAvailability: false,
    disruptions: true,
    geoModel: true,
  });

  // Stage 4.5 Combined 7-Criteria Filters State
  const [filters, setFilters] = useState({
    facilityType: 'ALL',
    facilityStatus: 'ALL',
    disasterType: 'ALL',
    disasterSeverity: 'ALL',
    routeStatus: 'ALL',
    transportMode: 'ALL',
    dataClassification: 'ALL',
  });

  const inventoryLots = useAppStore((state) => state.inventoryLots);
  const dispatchOrders = useAppStore((state) => state.dispatchOrders);
  const getOperationalRoutes = useAppStore((state) => state.getOperationalRoutes);
  const customRouteOverrides = useAppStore((state) => state.customRouteOverrides);

  // Synchronized Geo-Spatial Telemetry Overlay
  const data = useMemo(() => {
    const raw = getNetworkMapData(selectedIncident, selectedCrisisType, selectedRegion);
    const synchronizedEntities = raw.entities.map((entity) => {
      const matchingLots = inventoryLots.filter(
        (l) => l.facilityId === entity.code || l.facilityId === entity.id
      );
      if (matchingLots.length === 0) return entity;

      const foodPkts = matchingLots
        .filter((l) => l.commodityId === 'FOOD')
        .reduce((sum, l) => sum + lotBalances(l).usable, 0);
      const waterCont = matchingLots
        .filter((l) => l.commodityId === 'WATER')
        .reduce((sum, l) => sum + lotBalances(l).usable, 0);

      const parts = [];
      if (foodPkts > 0) parts.push(`${new Intl.NumberFormat().format(foodPkts)} food pkts`);
      if (waterCont > 0) parts.push(`${new Intl.NumberFormat().format(waterCont)} water cont`);

      return {
        ...entity,
        availableResources: parts.length > 0 ? parts.join(', ') : entity.availableResources,
      };
    });

    return { ...raw, entities: synchronizedEntities };
  }, [selectedIncident, selectedCrisisType, selectedRegion, inventoryLots]);

  // Stage 4.3 — Operational routes derived from scenario routes + live dispatch ledger
  const operationalRoutes = useMemo(() => {
    if (typeof getOperationalRoutes === 'function') {
      return getOperationalRoutes(data.routes);
    }
    return data.routes;
  }, [getOperationalRoutes, data.routes, dispatchOrders, customRouteOverrides]);

  // Stage 4.5 Combined Multi-Criteria Filter Evaluation
  const combinedFilteredData = useMemo(() => {
    return applyCombinedMapFilters(
      {
        entities: data.entities,
        geoLocations,
        routes: operationalRoutes,
        disasterZones,
      },
      {
        ...filters,
        searchTerm,
      }
    );
  }, [data.entities, geoLocations, operationalRoutes, disasterZones, filters, searchTerm]);

  const filteredEntities = combinedFilteredData.filteredEntities;
  const filteredGeoLocations = combinedFilteredData.filteredGeoLocations;
  const filteredRoutes = combinedFilteredData.filteredRoutes;
  const filteredDisasterZones = combinedFilteredData.filteredDisasterZones;
  const activeFilterCount = combinedFilteredData.activeFilterCount;
  const isEmpty = combinedFilteredData.isEmpty;

  // Active Geographic Risk Alerts (Derived from facilities, routes, disaster zones)
  const geographicAlerts = useMemo(() => {
    try {
      return typeof getGeographicAlerts === 'function' ? getGeographicAlerts() : [];
    } catch {
      return [];
    }
  }, [getGeographicAlerts, dismissedGeographicAlertIds, geoLocations, operationalRoutes, disasterZones]);

  // Handle entity selection — close other drawers
  const handleSelectEntity = (entity) => {
    setSelectedEntity(entity);
    setSelectedRoute(null);
    setSelectedDisasterZone(null);
    setIsEntityDrawerOpen(true);
    setIsRouteDrawerOpen(false);
    setIsGeoDetailOpen(false);
    setIsZoneDetailOpen(false);
  };

  // Handle route selection — close other drawers
  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    setSelectedEntity(null);
    setSelectedDisasterZone(null);
    setIsRouteDrawerOpen(true);
    setIsEntityDrawerOpen(false);
    setIsGeoDetailOpen(false);
    setIsZoneDetailOpen(false);
  };

  // Stage 4.2 — GIS location selection
  const handleSelectGeoLocation = (location) => {
    setSelectedGeoLocation(location);
    setSelectedDisasterZone(null);
    setIsGeoDetailOpen(true);
    setIsEntityDrawerOpen(false);
    setIsRouteDrawerOpen(false);
    setIsZoneDetailOpen(false);
  };

  // Stage 4.4 — Disaster Zone selection
  const handleSelectDisasterZone = (zone) => {
    setSelectedDisasterZone(zone);
    setSelectedEntity(null);
    setSelectedRoute(null);
    setSelectedGeoLocation(null);
    setIsZoneDetailOpen(true);
    setIsEntityDrawerOpen(false);
    setIsRouteDrawerOpen(false);
    setIsGeoDetailOpen(false);
  };

  // Stage 4.5 — Handle alert click to focus map and select feature
  const handleSelectAlert = (alert) => {
    if (alert.coordinates) {
      focusMapOnEntity(alert.relatedEntityId, alert.entityType, alert.coordinates);
    }
    if (alert.entityType === 'FACILITY') {
      const facMatch = data.entities.find(
        (e) => e.id === alert.relatedEntityId || e.code === alert.relatedEntityId
      );
      if (facMatch) {
        handleSelectEntity(facMatch);
        return;
      }
      const geoMatch = geoLocations.find(
        (g) => g.id === alert.relatedEntityId || g.code === alert.relatedEntityId
      );
      if (geoMatch) {
        handleSelectGeoLocation(geoMatch);
        return;
      }
    } else if (alert.entityType === 'ROUTE') {
      const rtMatch = operationalRoutes.find((r) => r.id === alert.relatedEntityId);
      if (rtMatch) {
        handleSelectRoute(rtMatch);
        return;
      }
    }
    if (alert.relatedZoneId) {
      const zoneMatch = disasterZones.find((z) => z.id === alert.relatedZoneId);
      if (zoneMatch) {
        handleSelectDisasterZone(zoneMatch);
      }
    }
  };

  // Stage 4.4 / 4.5 Filter handlers
  const handleChangeDisasterFilter = (key, val) => {
    const mappedKey =
      key === 'severity'
        ? 'disasterSeverity'
        : key === 'classification'
        ? 'dataClassification'
        : key;
    setFilters((prev) => ({ ...prev, [mappedKey]: val }));
  };

  // Stage 4.2 — Toggle individual GIS entity type visibility
  const handleToggleGeoType = (type) => {
    setGeoVisibleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Handle layer toggles
  const handleToggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle filter changes
  const handleChangeFilter = (key, val) => {
    const mappedKey = key === 'entityType' ? 'facilityType' : key;
    setFilters((prev) => ({ ...prev, [mappedKey]: val }));
  };

  // Reset filters — also resets GIS type visibility and disaster filters
  const handleResetFilters = () => {
    setFilters({
      facilityType: 'ALL',
      facilityStatus: 'ALL',
      disasterType: 'ALL',
      disasterSeverity: 'ALL',
      routeStatus: 'ALL',
      transportMode: 'ALL',
      dataClassification: 'ALL',
    });
    setSearchTerm('');
    setGeoVisibleTypes(Object.values(GEOGRAPHIC_LOCATION_TYPE));
    clearMapFocus();
    setLayers({
      facilities: true,
      beneficiaries: true,
      routes: true,
      affectedAreas: true,
      infrastructureDamage: true,
      demandConcentration: false,
      resourceAvailability: false,
      disruptions: true,
      geoModel: true,
    });
  };

  // Reset map view
  const handleResetView = () => {
    setResetTrigger((prev) => prev + 1);
  };

  const blockedCount = operationalRoutes.filter(
    (r) => normalizeRouteStatus(r.routeStatus) === 'BLOCKED' || r.routeStatus === 'CONFIRMED_BLOCKED'
  ).length;

  return (
    <div className="relative w-full h-[calc(100vh-100px)] min-h-[620px] rounded-xl overflow-hidden border border-brand-border shadow-card bg-slate-100 flex flex-col">
      {/* 1. Compact Top Map Toolbar */}
      <MapTopToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onResetView={handleResetView}
        entities={data.entities}
        onSelectSearchResult={handleSelectEntity}
        activeEntityCount={filteredEntities.length}
        blockedRouteCount={blockedCount}
      />

      {/* 2. Collapsible Left-Side Layer & Filter Panel */}
      <MapLayerControlPanel
        layers={layers}
        onToggleLayer={handleToggleLayer}
        filters={filters}
        onChangeFilter={handleChangeFilter}
        onResetFilters={handleResetFilters}
        activeFilterCount={activeFilterCount}
        crisisType={selectedCrisisType}
        isOpen={isLayerPanelOpen}
        onToggleOpen={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
        entities={data.entities}
        routes={operationalRoutes}
        crisisOverlays={data.crisisOverlays}
        geoLocations={filteredGeoLocations}
        geoVisibleTypes={geoVisibleTypes}
        onToggleGeoType={handleToggleGeoType}
        disasterZones={filteredDisasterZones}
        disasterFilters={{
          disasterType: filters.disasterType,
          severity: filters.disasterSeverity,
          classification: filters.dataClassification,
        }}
        onChangeDisasterFilter={handleChangeDisasterFilter}
      />

      {/* 2B. Stage 4.5 Floating Geographic Risk Alerts Panel */}
      <GeographicAlertPanel
        alerts={geographicAlerts}
        onSelectAlert={handleSelectAlert}
        onDismissAlert={dismissGeographicAlert}
      />

      {/* 3. Primary Fullscreen Interactive Leaflet Canvas */}
      <div className="flex-1 w-full h-full">
        <NetworkMapCanvas
          center={data.center}
          zoom={data.defaultZoom}
          entities={filteredEntities}
          routes={filteredRoutes}
          crisisOverlays={data.crisisOverlays}
          layers={layers}
          selectedEntity={selectedEntity}
          selectedRoute={selectedRoute}
          onSelectEntity={handleSelectEntity}
          onSelectRoute={handleSelectRoute}
          resetTrigger={resetTrigger}
          isSupported={data.isSupported}
          unsupportedMessage={data.unsupportedMessage}
          regionName={selectedRegion}
          geoLocations={filteredGeoLocations}
          geoVisibleTypes={geoVisibleTypes}
          selectedGeoId={selectedGeoLocation?.id ?? null}
          onSelectGeoLocation={handleSelectGeoLocation}
          disasterZones={filteredDisasterZones}
          selectedZoneId={selectedDisasterZone?.id ?? null}
          onSelectZone={handleSelectDisasterZone}
          disasterTypeFilter={filters.disasterType}
          disasterSeverityFilter={filters.disasterSeverity}
          disasterClassificationFilter={filters.dataClassification}
          focusedCoordinates={focusedMapEntity?.coordinates || null}
          isEmpty={isEmpty}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* 4. Bottom Collapsible Network Map Legend */}
      <NetworkMapLegend />

      {/* 5. Stage 4.2 GIS Location Detail Panel */}
      {isGeoDetailOpen && selectedGeoLocation && (
        <GeoLocationDetailPanel
          location={selectedGeoLocation}
          onClose={() => { setIsGeoDetailOpen(false); setSelectedGeoLocation(null); }}
          routes={operationalRoutes}
          onSelectRoute={handleSelectRoute}
        />
      )}

      {/* 6. Stage 4.4 Disaster Hazard Zone Detail Panel */}
      {isZoneDetailOpen && selectedDisasterZone && (
        <DisasterZoneDetailPanel
          zone={selectedDisasterZone}
          onClose={() => { setIsZoneDetailOpen(false); setSelectedDisasterZone(null); }}
          onSelectFacility={(facilityId) => {
            const matchEntity = data.entities.find((e) => e.id === facilityId || e.code === facilityId || e.name === facilityId);
            if (matchEntity) { handleSelectEntity(matchEntity); return; }
            const matchGeo = geoLocations.find((g) => g.id === facilityId || g.code === facilityId || g.name === facilityId);
            if (matchGeo) { handleSelectGeoLocation(matchGeo); }
          }}
          onSelectRoute={(rt) => {
            handleSelectRoute(rt);
          }}
        />
      )}

      {/* 7. Right-Side Entity Detail Drawer */}
      <EntityDetailDrawer
        entity={selectedEntity}
        isOpen={isEntityDrawerOpen}
        onClose={() => setIsEntityDrawerOpen(false)}
        onSelectConnectedEntity={(connId) => {
          const match = data.entities.find((e) => e.id === connId || e.code === connId);
          if (match) handleSelectEntity(match);
        }}
        routes={operationalRoutes}
        onSelectRoute={handleSelectRoute}
      />

      {/* 8. Right-Side Route Detail Drawer */}
      <RouteDetailDrawer
        route={selectedRoute}
        isOpen={isRouteDrawerOpen}
        onClose={() => setIsRouteDrawerOpen(false)}
        onSelectFacility={(facilityId) => {
          if (!facilityId) return;
          const entityMatch = data.entities.find(
            (e) => e.id === facilityId || e.code === facilityId || e.name === facilityId || facilityId.includes(e.id)
          );
          if (entityMatch) {
            handleSelectEntity(entityMatch);
            return;
          }
          const geoMatch = geoLocations.find(
            (g) => g.id === facilityId || g.code === facilityId || g.name === facilityId || facilityId.includes(g.id)
          );
          if (geoMatch) {
            handleSelectGeoLocation(geoMatch);
          }
        }}
      />
    </div>
  );
}
