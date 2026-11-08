import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  ShieldAlert,
  Maximize2,
  Navigation,
  Eye,
  AlertTriangle,
  Building,
  Users,
  Compass,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { MapLegend } from '../../../components/maps/MapLegend.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { useAppStore } from '../../../store/useAppStore.js';
import { MOCK_INCIDENTS } from '../../../mock-data/incidents.mock.js';

/** Reactive View Controller to pan map when center/zoom changes */
function MapViewController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom || 11, { animate: true, duration: 0.8 });
      map.invalidateSize();
    }
  }, [center, zoom, map]);
  return null;
}

/** Custom SVG Leaflet DivIcons */
function createCustomIcon(type, label = '', severity = 'normal') {
  let bg = '#142B43'; // Navy default
  let border = '#FFFFFF';
  let pulse = false;
  let symbol = 'W';

  if (type === 'WAREHOUSE') {
    bg = '#142B43';
    border = '#60758A';
    symbol = 'WH';
  } else if (type === 'DISTRIBUTION_CENTRE') {
    bg = '#176B76';
    border = '#FFFFFF';
    symbol = 'DC';
  } else if (type === 'COMMUNITY') {
    bg = severity === 'CRITICAL' ? '#C94C4C' : '#D99A35';
    border = '#FFFFFF';
    symbol = '👥';
  } else if (type === 'DISRUPTION') {
    bg = '#C94C4C';
    border = '#FFFFFF';
    pulse = true;
    symbol = '⚠';
  }

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      ${pulse ? '<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(201, 76, 76, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
      <div style="
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background-color: ${bg};
        border: 2px solid ${border};
        box-shadow: 0 2px 5px rgba(0,0,0,0.25);
        color: white;
        font-family: 'Inter', sans-serif;
        font-size: 10px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
      ">
        ${symbol}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-div-icon',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

export function CrisisMap({
  mapEntities,
  onSelectEntity,
  className = '',
}) {
  const [layers, setLayers] = useState({
    facilities: true,
    communities: true,
    routes: true,
    disruptions: true,
  });

  const { setSelectedIncident } = useAppStore();
  const [activeLegend, setActiveLegend] = useState(true);

  const toggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const { center, zoom, facilities = [], communities = [], disruptions = [], routes = [], scopeLabel, isSupported = true } = mapEntities || {};

  return (
    <div className={`relative w-full h-[600px] lg:h-[640px] rounded-lg overflow-hidden border border-brand-border shadow-card bg-slate-100 flex flex-col ${className}`}>
      {/* Unsupported Region Informative State Overlay */}
      {!isSupported && (
        <div className="absolute inset-0 z-30 bg-navy-dark/80 backdrop-blur-xs flex items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="max-w-md bg-white border border-brand-border rounded-xl p-6 shadow-dropdown space-y-4">
            <div className="w-12 h-12 rounded-full bg-status-warning-bg text-status-warning flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Geographical Telemetry Unavailable</h3>
              <p className="text-xs text-text-secondary mt-1">
                No coherent facility coordinates, supply lines, or verified beneficiary registers exist for this operational theater.
              </p>
            </div>
            <div className="p-3 bg-brand-bg border border-brand-border rounded-lg text-left text-xs space-y-1.5">
              <div className="font-semibold text-navy-primary text-xs">Supported Crisis Theaters:</div>
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

      {/* Top Map Control Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        {/* Left: Operational Scope Pill & Live Telemetry Strip */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-brand-border shadow-subtle flex items-center gap-2 text-xs">
          <Compass className="w-4 h-4 text-teal animate-spin-slow shrink-0" />
          <span className="font-bold text-text-primary tracking-wide">{scopeLabel || 'CRISIS CORRIDOR'}</span>
          <span className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-300" />
          <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-[11px] text-text-secondary">
            <span className="font-bold text-teal">{facilities?.length || 0} Depots</span> •{' '}
            <span className="font-bold text-status-warning">{communities?.length || 0} Cut-Off Zones</span> •{' '}
            <span className="font-bold text-status-critical">{disruptions?.length || 0} Impasses</span>
          </span>
          <StatusBadge variant={isSupported ? "critical" : "neutral"} size="xs" pulse={isSupported}>
            {isSupported ? 'SYNTHETIC DEMO DATA' : 'DATA UNAVAILABLE'}
          </StatusBadge>
        </div>

        {/* Right: Layer Toggle Bar */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-brand-border shadow-subtle flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => toggleLayer('facilities')}
            className={`px-2 py-1 rounded transition-colors ${layers.facilities ? 'bg-navy-primary text-white font-semibold' : 'text-text-secondary hover:bg-brand-bg'}`}
            title="Toggle Depots & DCs"
          >
            Depots ({facilities?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('communities')}
            className={`px-2 py-1 rounded transition-colors ${layers.communities ? 'bg-teal text-white font-semibold' : 'text-text-secondary hover:bg-brand-bg'}`}
            title="Toggle Affected Communities"
          >
            Communities ({communities?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('routes')}
            className={`px-2 py-1 rounded transition-colors ${layers.routes ? 'bg-steel text-white font-semibold' : 'text-text-secondary hover:bg-brand-bg'}`}
            title="Toggle Transit Routes"
          >
            Corridors ({routes?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('disruptions')}
            className={`px-2 py-1 rounded transition-colors ${layers.disruptions ? 'bg-status-critical text-white font-semibold' : 'text-text-secondary hover:bg-brand-bg'}`}
            title="Toggle Disruptions"
          >
            Disruptions ({disruptions?.length || 0})
          </button>
        </div>
      </div>

      {/* Leaflet Map Surface (Centered on Assam Brahmaputra Basin) */}
      <MapContainer
        center={(center && Array.isArray(center) && center[0] > 0) ? center : [26.1445, 91.7362]}
        zoom={zoom || 9}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ zIndex: 1 }}
      >
        <MapViewController center={(center && Array.isArray(center) && center[0] > 0) ? center : [26.1445, 91.7362]} zoom={zoom || 9} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Transport Corridor Polylines */}
        {layers.routes && routes.map((rt) => (
          <Polyline
            key={rt.id}
            positions={rt.points}
            pathOptions={{
              color: rt.color,
              weight: 4,
              dashArray: rt.dashArray,
              opacity: 0.85,
            }}
          >
            <Popup>
              <div className="p-1 space-y-1">
                <div className="font-bold text-xs text-text-primary">{rt.name}</div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-text-secondary">Transit Status:</span>
                  <StatusBadge variant={rt.status === 'PASSABLE' ? 'success' : rt.status === 'IMPASSABLE' ? 'critical' : 'warning'} size="xs">
                    {rt.status}
                  </StatusBadge>
                </div>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Warehouses & Distribution Centres */}
        {layers.facilities && facilities.map((fac) => (
          <Marker
            key={fac.id}
            position={fac.coordinates}
            icon={createCustomIcon(fac.type, fac.code)}
            eventHandlers={{
              click: () => onSelectEntity?.({ ...fac, entityKind: 'FACILITY' }),
            }}
          >
            <Popup>
              <div className="p-1.5 space-y-1.5 min-w-[200px]">
                <div className="flex items-center justify-between gap-2 border-b border-brand-border-light pb-1">
                  <span className="font-bold text-xs text-text-primary">{fac.name}</span>
                  <StatusBadge variant={fac.status === 'OPERATIONAL' ? 'success' : 'warning'} size="xs">
                    {fac.status}
                  </StatusBadge>
                </div>
                <div className="text-[11px] text-text-secondary">
                  <div><strong>Sector:</strong> {fac.locationName}</div>
                  {fac.utilizationPct !== undefined && (
                    <div className="mt-0.5">
                      <strong>Capacity Utilization:</strong> {fac.utilizationPct}% ({fac.utilizedCapacityM3} / {fac.totalCapacityM3} m³)
                    </div>
                  )}
                  <div className="mt-1 text-teal font-medium">{fac.stockSummary}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectEntity?.({ ...fac, entityKind: 'FACILITY' })}
                  className="w-full mt-1 px-2 py-1 bg-navy-primary text-white text-[11px] font-semibold rounded hover:bg-navy-secondary transition-colors"
                >
                  Inspect Facility
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Affected Communities */}
        {layers.communities && communities.map((comm) => (
          <Marker
            key={comm.id}
            position={comm.coordinates}
            icon={createCustomIcon('COMMUNITY', comm.name, comm.priority)}
            eventHandlers={{
              click: () => onSelectEntity?.({ ...comm, entityKind: 'COMMUNITY' }),
            }}
          >
            <Popup>
              <div className="p-1.5 space-y-1.5 min-w-[220px]">
                <div className="flex items-center justify-between gap-2 border-b border-brand-border-light pb-1">
                  <span className="font-bold text-xs text-text-primary">{comm.name}</span>
                  <StatusBadge variant={comm.priority === 'CRITICAL' ? 'critical' : 'warning'} size="xs">
                    {comm.priority}
                  </StatusBadge>
                </div>
                <div className="text-[11px] text-text-secondary space-y-0.5">
                  <div><strong>Population in Distress:</strong> {new Intl.NumberFormat().format(comm.population)}</div>
                  <div><strong>Critical Need:</strong> {comm.primaryNeed}</div>
                  <div>
                    <strong>Unmet Deficit:</strong>{' '}
                    <span className="text-status-critical font-bold font-mono">
                      {comm.unmetQty} {comm.unit}
                    </span>
                  </div>
                  <div><strong>Access Route:</strong> {comm.accessMethod}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectEntity?.({ ...comm, entityKind: 'COMMUNITY' })}
                  className="w-full mt-1 px-2 py-1 bg-teal text-white text-[11px] font-semibold rounded hover:bg-teal-hover transition-colors"
                >
                  View Distress Dossier
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Active Disruptions / Roadblocks */}
        {layers.disruptions && disruptions.map((disr) => (
          <Marker
            key={disr.id}
            position={disr.coordinates}
            icon={createCustomIcon('DISRUPTION', disr.code, disr.severity)}
            eventHandlers={{
              click: () => onSelectEntity?.({ ...disr, entityKind: 'DISRUPTION' }),
            }}
          >
            <Popup>
              <div className="p-1.5 space-y-1.5 min-w-[220px]">
                <div className="flex items-center justify-between gap-2 border-b border-brand-border-light pb-1">
                  <span className="font-bold text-xs text-status-critical flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {disr.title}
                  </span>
                </div>
                <div className="text-[11px] text-text-secondary space-y-0.5">
                  <div><strong>Corridor:</strong> {disr.corridor}</div>
                  <div><strong>Impact:</strong> {disr.impact}</div>
                  <div className="text-status-warning font-semibold">Delay: {disr.delay}</div>
                  <div className="text-teal font-medium">Bypass: {disr.suggestedBypass}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectEntity?.({ ...disr, entityKind: 'DISRUPTION' })}
                  className="w-full mt-1 px-2 py-1 bg-status-critical text-white text-[11px] font-semibold rounded hover:bg-[#B33E3E] transition-colors"
                >
                  Inspect Contingency Options
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-auto">
        <MapLegend
          title="Crisis Map Symbology"
          collapsible
          items={[
            { label: 'Warehouse / Logistics Base (WH)', color: '#142B43', type: 'circle', count: facilities.filter((f) => f.type === 'WAREHOUSE').length },
            { label: 'Distribution Centre (DC)', color: '#176B76', type: 'circle', count: facilities.filter((f) => f.type === 'DISTRIBUTION_CENTRE').length },
            { label: 'Critical Demand Pocket (👥)', color: '#C94C4C', type: 'circle', count: communities.filter((c) => c.priority === 'CRITICAL').length },
            { label: 'Monitored Community (👥)', color: '#D99A35', type: 'circle', count: communities.filter((c) => c.priority !== 'CRITICAL').length },
            { label: 'Active Disruption / Impasse (⚠)', color: '#C94C4C', type: 'circle', count: disruptions.length },
            { label: 'Passable Corridor', color: '#27856F', type: 'line' },
            { label: 'Severed / Blocked Highway', color: '#C94C4C', type: 'dashed' },
          ]}
        />
      </div>

      {/* Floating Coordinates & Scale Bar */}
      <div className="absolute bottom-3 right-3 z-20 pointer-events-none bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded border border-brand-border text-[10px] font-mono text-text-secondary shadow-subtle hidden sm:block">
        <span>Map Datum: WGS84 • Leaflet 1.9 • Scale ~1:50,000</span>
      </div>
    </div>
  );
}
