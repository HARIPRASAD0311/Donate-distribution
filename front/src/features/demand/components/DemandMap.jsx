import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Maximize2,
  Users,
  AlertTriangle,
  Droplets,
  HeartPulse,
  Utensils,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';

/** Custom DivIcon for Beneficiary Groups */
function createBeneficiaryIcon(group, isSelected = false) {
  const isCritical = group.status === 'CRITICAL_EMERGENCY';
  const bg = isCritical ? '#C94C4C' : '#176B76';
  const border = isSelected ? '#142B43' : '#FFFFFF';

  let iconSymbol = '👥';
  if (group.category.includes('Health') || group.category.includes('Clinic')) {
    iconSymbol = '🏥';
  } else if (group.category.includes('Isolated')) {
    iconSymbol = '🏕️';
  } else if (group.category.includes('Sanctuary')) {
    iconSymbol = '🛡️';
  }

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      ${isCritical ? '<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(201, 76, 76, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
      <div style="
        width: ${isSelected ? '32px' : '26px'};
        height: ${isSelected ? '32px' : '26px'};
        border-radius: 50%;
        background-color: ${bg};
        border: 2px solid ${border};
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        color: white;
        transition: all 0.2s ease;
      ">
        ${iconSymbol}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-beneficiary-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

/** Helper component to re-center map when active region changes */
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

/**
 * Geographic Demand & Beneficiary Concentration Map
 * Visualizes affected regions, population density clusters, and distress hotspots.
 */
export function DemandMap({
  groups = [],
  demands = [],
  activeRegion = 'ALL',
  selectedGroupId,
  onSelectGroup,
  onInspectDemand,
}) {
  const [showDensityZones, setShowDensityZones] = useState(true);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  // Determine center based on active region
  const getMapCenterAndZoom = () => {
    if (activeRegion === 'Buzi District') {
      return { center: [-19.820, 34.780], zoom: 12 };
    }
    if (activeRegion === 'Manga IDP Hub') {
      return { center: [-19.825, 34.865], zoom: 12 };
    }
    if (activeRegion === 'Chibabava Basin') {
      return { center: [-19.725, 34.675], zoom: 11 };
    }
    if (activeRegion === 'Nhamatanda Corridor') {
      return { center: [-19.665, 34.535], zoom: 11 };
    }
    // Default Beira & Zambezia Basin overview
    return { center: [-19.785, 34.780], zoom: 10 };
  };

  const { center, zoom } = getMapCenterAndZoom();

  // Filter groups if critical only
  const filteredGroups = groups.filter((g) => {
    if (showCriticalOnly) {
      return g.status === 'CRITICAL_EMERGENCY';
    }
    return true;
  });

  return (
    <Card
      title="Geographic Demand & Beneficiary Hotspots"
      subtitle="Spatial concentration of vulnerable populations and prioritized distress requests"
      badge={<StatusBadge variant="teal" size="xs">GIS INTEL: SYNCED</StatusBadge>}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDensityZones(!showDensityZones)}
            className={`text-xs px-2.5 py-1 rounded border transition-colors ${
              showDensityZones
                ? 'bg-brand-bg text-navy-primary font-semibold border-teal/40'
                : 'text-text-secondary border-brand-border hover:bg-brand-bg'
            }`}
          >
            Density Radii
          </button>

          <button
            type="button"
            onClick={() => setShowCriticalOnly(!showCriticalOnly)}
            className={`text-xs px-2.5 py-1 rounded border transition-colors ${
              showCriticalOnly
                ? 'bg-status-critical-bg text-status-critical font-semibold border-status-critical-border'
                : 'text-text-secondary border-brand-border hover:bg-brand-bg'
            }`}
          >
            Critical Only
          </button>
        </div>
      }
      noPadding
    >
      <div className="relative w-full h-[400px]">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={false}
          className="w-full h-full z-0"
        >
          <MapController center={center} zoom={zoom} />

          {/* Clean CartoDB Voyager Map Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={18}
          />

          {/* Demand Concentration Buffer Radii (Heat zones) */}
          {showDensityZones &&
            filteredGroups.map((group) => {
              const isCritical = group.status === 'CRITICAL_EMERGENCY';
              const radius = Math.min(3200, Math.max(1200, group.population * 0.1));

              return (
                <Circle
                  key={`radius-${group.id}`}
                  center={group.coordinates}
                  radius={radius}
                  pathOptions={{
                    color: isCritical ? '#C94C4C' : '#176B76',
                    fillColor: isCritical ? '#C94C4C' : '#176B76',
                    fillOpacity: isCritical ? 0.22 : 0.12,
                    weight: 1.5,
                    dashArray: isCritical ? '4, 4' : undefined,
                  }}
                />
              );
            })}

          {/* Beneficiary Markers */}
          {filteredGroups.map((group) => {
            const isSelected = selectedGroupId === group.id;
            const groupDemands = demands.filter((d) => d.beneficiaryGroupId === group.id);
            const criticalDemand = groupDemands.find((d) => d.priority === 'CRITICAL');

            return (
              <Marker
                key={group.id}
                position={group.coordinates}
                icon={createBeneficiaryIcon(group, isSelected)}
                eventHandlers={{
                  click: () => onSelectGroup?.(group),
                }}
              >
                <Popup className="resqnet-map-popup">
                  <div className="p-1 space-y-2 max-w-xs text-xs">
                    <div className="flex items-start justify-between gap-2 border-b border-brand-border pb-1.5">
                      <div>
                        <div className="font-bold text-navy-primary">{group.name}</div>
                        <div className="text-[10px] text-text-secondary font-mono">{group.region} • {group.code}</div>
                      </div>
                      <StatusBadge
                        variant={group.status === 'CRITICAL_EMERGENCY' ? 'critical' : 'teal'}
                        size="xs"
                      >
                        {group.category}
                      </StatusBadge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-brand-bg p-2 rounded">
                      <div>
                        <span className="text-text-secondary block">Census Population:</span>
                        <span className="font-bold font-mono text-navy-primary">
                          {new Intl.NumberFormat().format(group.population)}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-secondary block">Children &lt;5:</span>
                        <span className="font-bold font-mono text-status-warning">
                          {group.vulnerabilities.underFivePercent}%
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-text-secondary">
                      <strong className="text-text-primary">Access:</strong> {group.accessCondition}
                    </div>

                    {criticalDemand && (
                      <div className="p-1.5 rounded bg-status-critical-bg border border-status-critical-border text-[11px] text-status-critical flex items-center justify-between">
                        <span><strong>Critical Need:</strong> {criticalDemand.item}</span>
                        <button
                          type="button"
                          onClick={() => onInspectDemand?.(criticalDemand)}
                          className="font-bold underline ml-1 hover:text-navy-primary"
                        >
                          View
                        </button>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Tactical Map Overlay Legend */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-brand-border shadow-subtle text-xs space-y-1.5">
          <div className="font-bold text-navy-primary text-[11px] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-teal" />
            Demand Heat &amp; Density Legend
          </div>
          <div className="flex items-center gap-2 text-[10px] text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-full bg-status-critical" />
            <span>Critical Isolated Cluster (Cut-off)</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-full bg-teal" />
            <span>Accessible IDP Relocation Camp</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-text-secondary">
            <span className="w-3 h-3 rounded-full border border-teal bg-teal/20" />
            <span>Population Demand Zone Radius</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
