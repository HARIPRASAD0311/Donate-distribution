import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoModelMarkerLayer } from './GeoModelMarkerLayer.jsx';
import { DisasterZoneLayer } from './DisasterZoneLayer.jsx';
import {
  ROUTE_STATUS,
  ROUTE_STATUS_STYLES,
  normalizeRouteStatus,
  calculateBearing,
  calculateMidpoint,
} from '../../../domain/transportRouteModel.js';
import {
  Building2,
  Users,
  AlertTriangle,
  ArrowRight,
  Shield,
  Droplets,
  Activity,
  AlertCircle,
  RefreshCw,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { useAppStore } from '../../../store/useAppStore.js';
import { MOCK_INCIDENTS } from '../../../mock-data/incidents.mock.js';

/** Custom Icon Factory for all 7 entity types */
function createNetworkEntityIcon(category, code = '', isSelected = false) {
  let bg = '#142B43';
  let border = '#FFFFFF';
  let symbol = 'N';

  switch (category) {
    case 'INSTITUTIONAL_DONOR':
      bg = '#142B43';
      border = '#60758A';
      symbol = 'DNR';
      break;
    case 'SUPPLIER':
      bg = '#1D3B56';
      border = '#DCE3E9';
      symbol = 'SUP';
      break;
    case 'TIER_1_FOODBANK':
      bg = '#142B43';
      border = '#176B76';
      symbol = 'WH-I';
      break;
    case 'TIER_2_FRRA':
      bg = '#176B76';
      border = '#FFFFFF';
      symbol = 'FRRA';
      break;
    case 'DISTRIBUTION_CENTRE':
      bg = '#60758A';
      border = '#FFFFFF';
      symbol = 'DC';
      break;
    case 'BENEFICIARY_LOCATION':
      bg = '#C94C4C';
      border = '#FFFFFF';
      symbol = 'BEN';
      break;
    case 'AFFECTED_COMMUNITY':
      bg = '#D99A35';
      border = '#FFFFFF';
      symbol = 'COMM';
      break;
    default:
      bg = '#142B43';
      symbol = 'LOC';
  }

  const ringStyles = isSelected
    ? 'box-shadow: 0 0 0 4px #176B76, 0 4px 10px rgba(0,0,0,0.3); transform: scale(1.15);'
    : 'box-shadow: 0 2px 6px rgba(0,0,0,0.25);';

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: ${bg};
        border: 2px solid ${border};
        color: white;
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        transition: all 0.2s;
        ${ringStyles}
      ">
        ${symbol}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-network-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

/** Helper component to reset map view and update when center/zoom changes */
function MapViewResetter({ center, zoom, resetTrigger }) {
  const map = useMap();

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom || 11, { animate: true, duration: 0.8 });
      map.invalidateSize();
    }
  }, [center, zoom, map]);

  useEffect(() => {
    if (resetTrigger && center) {
      map.flyTo(center, zoom || 11, { duration: 1.0 });
    }
  }, [resetTrigger, center, zoom, map]);

  return null;
}

function MapEntityFocuser({ focusedCoordinates }) {
  const map = useMap();
  useEffect(() => {
    if (focusedCoordinates && Array.isArray(focusedCoordinates) && focusedCoordinates.length === 2) {
      map.flyTo(focusedCoordinates, Math.max(map.getZoom(), 13), { duration: 1.0 });
    }
  }, [focusedCoordinates, map]);

  return null;
}

export function NetworkMapCanvas({
  center,
  zoom,
  entities = [],
  routes = [],
  crisisOverlays = {},
  layers = {},
  selectedEntity,
  selectedRoute,
  onSelectEntity,
  onSelectRoute,
  resetTrigger,
  isSupported = true,
  unsupportedMessage,
  regionName,
  // Stage 4.2 GIS layer props
  geoLocations = [],
  geoVisibleTypes = [],
  selectedGeoId = null,
  onSelectGeoLocation,
  // Stage 4.4 Disaster Risk Overlays props
  disasterZones = [],
  selectedZoneId = null,
  onSelectZone,
  disasterTypeFilter = 'ALL',
  disasterSeverityFilter = 'ALL',
  disasterClassificationFilter = 'ALL',
  // Stage 4.5 Filter & Telemetry Integration props
  focusedCoordinates = null,
  isEmpty = false,
  onResetFilters,
}) {
  const { setSelectedIncident } = useAppStore();

  const isRouteConnected = (rt) => {
    const targetId = selectedEntity?.id || selectedEntity?.code || selectedGeoId;
    if (!targetId) return false;
    const originStr = String(rt.originFacilityId || rt.origin || '');
    const destStr = String(rt.destinationFacilityId || rt.destination || '');
    return originStr === targetId || originStr.includes(targetId) || destStr === targetId || destStr.includes(targetId);
  };

  const routeStyle = (rt) => {
    const isConnected = isRouteConnected(rt);
    const isSelected = selectedRoute?.id === rt.id;
    const normStatus = normalizeRouteStatus(rt.routeStatus);
    const cfg = ROUTE_STATUS_STYLES[normStatus] || ROUTE_STATUS_STYLES[ROUTE_STATUS.PLANNED];

    let color = cfg.color;
    if (isSelected) {
      color = '#142B43'; // Selected ResQNet Navy
    }

    return {
      color,
      weight: isSelected ? 6 : isConnected ? 5 : cfg.weight,
      dashArray: isSelected ? 'none' : cfg.dashArray,
      opacity: isConnected ? 1 : cfg.opacity,
    };
  };

  return (
    <div className="relative w-full h-full">
      {/* Unsupported Region Informative State Overlay */}
      {!isSupported && (
        <div className="absolute inset-0 z-30 bg-navy-dark/80 backdrop-blur-xs flex items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="max-w-md bg-white border border-brand-border rounded-xl p-6 shadow-dropdown space-y-4">
            <div className="w-12 h-12 rounded-full bg-status-warning-bg text-status-warning flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Geographical Network Unavailable</h3>
              <p className="text-xs text-text-secondary mt-1">
                {unsupportedMessage || `No verified multi-tier supply chain topology exists for "${regionName || 'this region'}" in demonstration mode.`}
              </p>
            </div>
            <div className="p-3 bg-brand-bg border border-brand-border rounded-lg text-left text-xs space-y-1.5">
              <div className="font-semibold text-navy-primary text-xs">Supported Operational Theaters:</div>
              <ul className="text-text-secondary space-y-1 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                  <strong>Beira &amp; Zambezia Corridors</strong> — Flood / Cyclone
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-critical" />
                  <strong>Middle East / South Corridor</strong> — Armed Conflict
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                  <strong>Horn of Africa / Lake Basin</strong> — Pandemic Outbreak
                </li>
              </ul>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              onClick={() => setSelectedIncident(MOCK_INCIDENTS[0])}
              className="w-full"
            >
              Switch to Cyclone Idai II Response
            </Button>
          </div>
        </div>
      )}

      {/* Stage 4.5 Empty State Floating Notification */}
      {isSupported && isEmpty && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="max-w-sm bg-white/95 backdrop-blur-md border border-brand-border rounded-xl p-5 shadow-dropdown text-center space-y-3 pointer-events-auto">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">No Features Match Current Filters</h4>
              <p className="text-xs text-text-secondary mt-1">
                The selected combination of facility type, status, risk severity, and transportation filters returned zero active map features.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={onResetFilters}
              className="w-full text-xs"
            >
              Reset Map Filters
            </Button>
          </div>
        </div>
      )}

      <MapContainer
        center={(center && Array.isArray(center) && center[0] > 0) ? center : [26.1445, 91.7362]}
        zoom={zoom || 9}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ zIndex: 1 }}
      >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapViewResetter center={(center && Array.isArray(center) && center[0] > 0) ? center : [26.1445, 91.7362]} zoom={zoom || 9} resetTrigger={resetTrigger} />
      <MapEntityFocuser focusedCoordinates={focusedCoordinates} />

      {/* 1. Stage 4.4 Disaster Zones & Geographical Risk Layers (GeoJSON Polygons) */}
      {layers.affectedAreas && disasterZones.length > 0 && (
        <DisasterZoneLayer
          zones={disasterZones}
          selectedZoneId={selectedZoneId}
          onSelectZone={onSelectZone}
          visibleTypes={disasterTypeFilter}
          visibleSeverity={disasterSeverityFilter}
          visibleClassification={disasterClassificationFilter}
        />
      )}

      {/* Fallback Legacy Scenario Inundation Circles (if no disasterZones provided) */}
      {layers.affectedAreas && (!disasterZones || disasterZones.length === 0) && crisisOverlays.affectedZones?.map((zone) => (
        <Circle
          key={zone.id}
          center={zone.center}
          radius={zone.radiusMeters}
          pathOptions={{
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: zone.fillOpacity,
            weight: 1.5,
            dashArray: '4 4',
          }}
        >
          <Popup>
            <div className="p-1 space-y-1">
              <div className="font-bold text-xs text-text-primary">{zone.name}</div>
              <p className="text-[11px] text-text-secondary">{zone.description}</p>
              <StatusBadge variant="critical" size="xs">
                STATUS: {zone.status}
              </StatusBadge>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* 2. Infrastructure Damage Points */}
      {layers.infrastructureDamage && crisisOverlays.infrastructureDamage?.map((dmg) => (
        <Marker
          key={dmg.id}
          position={dmg.coordinates}
          icon={L.divIcon({
            html: `
              <div style="background:#C94C4C; width:22px; height:22px; border-radius:4px; border:2px solid white; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:bold; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                ⚠
              </div>
            `,
            className: 'damage-marker',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          })}
        >
          <Popup>
            <div className="p-1 space-y-1">
              <div className="font-bold text-xs text-status-critical">{dmg.name}</div>
              <p className="text-[11px] text-text-secondary">{dmg.description}</p>
              <StatusBadge variant="critical" size="xs">{dmg.type}</StatusBadge>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* 3. Transport Corridors (Polylines + Directional Arrows) */}
      {layers.routes && routes.map((rt) => {
        if (!Array.isArray(rt.points) || rt.points.length < 2) return null;
        const normStatus = normalizeRouteStatus(rt.routeStatus);
        const styleCfg = ROUTE_STATUS_STYLES[normStatus] || ROUTE_STATUS_STYLES[ROUTE_STATUS.PLANNED];
        const midpoint = calculateMidpoint(rt.points);
        const midIdx = Math.max(1, Math.floor(rt.points.length / 2));
        const pPrev = rt.points[midIdx - 1] || rt.points[0];
        const pNext = rt.points[midIdx] || rt.points[rt.points.length - 1];
        const bearing = calculateBearing(pPrev, pNext);
        const isSelected = selectedRoute?.id === rt.id;
        const arrowColor = isSelected ? '#142B43' : styleCfg.color;

        return (
          <React.Fragment key={rt.id}>
            <Polyline
              positions={rt.points}
              pathOptions={routeStyle(rt)}
              eventHandlers={{
                click: () => onSelectRoute?.(rt),
              }}
            >
              <Popup>
                <div className="p-2 space-y-1.5 min-w-[220px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-text-primary truncate">{rt.name || rt.id}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase font-semibold">
                      {rt.routingType === 'CALCULATED' ? 'GIS ROAD' : 'DEMO'}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-secondary space-y-0.5">
                    <div><strong>From:</strong> {rt.origin}</div>
                    <div><strong>To:</strong> {rt.destination}</div>
                    <div>
                      <strong>Distance:</strong> {rt.distanceKm ? `${rt.distanceKm} km` : 'Not calculated'}
                      {rt.estimatedTime ? ` (${rt.estimatedTime})` : ''}
                    </div>
                    {rt.transportMode && (
                      <div><strong>Mode:</strong> {rt.transportMode}</div>
                    )}
                    {rt.linkedDispatch && (
                      <div className="mt-1 pt-1 border-t border-brand-border-light text-[10px] bg-slate-50 p-1.5 rounded">
                        <div className="font-semibold text-navy-primary flex items-center justify-between">
                          <span>Dispatch {rt.linkedDispatch.id}</span>
                          <span className="text-[9px] uppercase px-1 py-0.2 bg-teal/10 text-teal rounded">{rt.linkedDispatch.status}</span>
                        </div>
                        {rt.linkedDispatch.commodity && (
                          <div className="text-text-secondary mt-0.5">
                            Cargo: {rt.linkedDispatch.quantity} {rt.linkedDispatch.unit} {rt.linkedDispatch.commodity}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="pt-1.5 flex items-center justify-between border-t border-brand-border-light">
                    <StatusBadge variant={styleCfg.badgeVariant} size="xs">
                      {normStatus}
                    </StatusBadge>
                    <button
                      type="button"
                      onClick={() => onSelectRoute?.(rt)}
                      className="text-teal hover:underline text-[11px] font-semibold"
                    >
                      Inspect Corridor →
                    </button>
                  </div>
                </div>
              </Popup>
            </Polyline>

            {/* Stage 4.3 — Directional Arrow Marker */}
            {midpoint && (
              <Marker
                position={midpoint}
                icon={L.divIcon({
                  className: 'bg-transparent border-0',
                  html: `<div style="transform: rotate(${bearing}deg); width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); cursor: pointer;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="${arrowColor}" stroke="#ffffff" stroke-width="1.8">
                      <polygon points="12 2 20 21 12 16 4 21 12 2" />
                    </svg>
                  </div>`,
                  iconSize: [18, 18],
                  iconAnchor: [9, 9],
                })}
                eventHandlers={{
                  click: () => onSelectRoute?.(rt),
                }}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* 4. Geographical Echelon Entity Markers */}
      {entities.map((entity) => {
        const isFacility = ['INSTITUTIONAL_DONOR', 'SUPPLIER', 'TIER_1_FOODBANK', 'TIER_2_FRRA', 'DISTRIBUTION_CENTRE'].includes(entity.category);
        const isBeneficiary = ['BENEFICIARY_LOCATION', 'AFFECTED_COMMUNITY'].includes(entity.category);

        if (isFacility && !layers.facilities) return null;
        if (isBeneficiary && !layers.beneficiaries) return null;

        const isSelected = selectedEntity?.id === entity.id;

        return (
          <Marker
            key={entity.id}
            position={entity.coordinates}
            icon={createNetworkEntityIcon(entity.category, entity.code, isSelected)}
            eventHandlers={{
              click: () => onSelectEntity?.(entity),
            }}
          >
            <Popup>
              <div className="p-1.5 space-y-1 min-w-[210px]">
                <div className="flex items-center justify-between gap-2 border-b border-brand-border-light pb-1">
                  <span className="font-bold text-xs text-text-primary">{entity.name}</span>
                  <StatusBadge variant={entity.operationalStatus === 'OPERATIONAL' ? 'success' : 'warning'} size="xs">
                    {entity.operationalStatus}
                  </StatusBadge>
                </div>
                <div className="text-[11px] text-text-secondary">
                  <div><strong>Ref:</strong> {entity.code} ({entity.category})</div>
                  <div className="mt-0.5 text-teal font-medium truncate">{entity.availableResources}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectEntity?.(entity)}
                  className="w-full mt-1 px-2 py-1 bg-navy-primary hover:bg-navy-secondary text-white text-[11px] font-semibold rounded transition-colors text-center"
                >
                  View Node Dossier
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
      {/* 5. Stage 4.2 Geographic Model Layer (from Zustand geographicLocations) */}
      {layers.geoModel !== false && geoLocations.length > 0 && (
        <GeoModelMarkerLayer
          locations={geoLocations}
          visibleTypes={geoVisibleTypes}
          selectedId={selectedGeoId}
          onSelectLocation={onSelectGeoLocation}
        />
      )}
    </MapContainer>
  </div>
  );
}
