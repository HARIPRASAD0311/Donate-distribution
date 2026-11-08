/**
 * ResQNet Stage 4.2 — GIS Geographic Model Marker Layer
 *
 * Renders Stage 4.1 geographicLocations from Zustand onto the existing
 * React-Leaflet MapContainer. Each marker displays a compact popup with:
 *   - Facility name, type, operational status
 *   - Address / region
 *   - Capacity (if applicable)
 *   - Live inventory / demand summary (from operationalContext)
 *   - DEMO data label
 *
 * Does NOT replace the existing networkMapData entities layer.
 * Does NOT implement transport routes or disaster-risk layers.
 */

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { GEOGRAPHIC_LOCATION_TYPE, LOCATION_OPERATIONAL_STATUS } from '../../../domain/geographicModel.js';

// ─── Marker Style Config per Type ────────────────────────────────────────────
export const GEO_TYPE_STYLES = {
  [GEOGRAPHIC_LOCATION_TYPE.WAREHOUSE]: {
    bg: '#142B43',
    border: '#176B76',
    symbol: 'WH',
    label: 'Warehouse',
    color: '#142B43',
  },
  [GEOGRAPHIC_LOCATION_TYPE.DISTRIBUTION_CENTRE]: {
    bg: '#176B76',
    border: '#FFFFFF',
    symbol: 'DC',
    label: 'Distribution Centre',
    color: '#176B76',
  },
  [GEOGRAPHIC_LOCATION_TYPE.FOOD_BANK]: {
    bg: '#D99A35',
    border: '#FFFFFF',
    symbol: 'FB',
    label: 'Food Bank',
    color: '#D99A35',
  },
  [GEOGRAPHIC_LOCATION_TYPE.HOSPITAL]: {
    bg: '#C94C4C',
    border: '#FFFFFF',
    symbol: 'HSP',
    label: 'Hospital',
    color: '#C94C4C',
  },
  [GEOGRAPHIC_LOCATION_TYPE.RELIEF_CAMP]: {
    bg: '#60758A',
    border: '#FFFFFF',
    symbol: 'RC',
    label: 'Relief Camp',
    color: '#60758A',
  },
  [GEOGRAPHIC_LOCATION_TYPE.BENEFICIARY_LOCATION]: {
    bg: '#7C3AED',
    border: '#FFFFFF',
    symbol: 'BEN',
    label: 'Beneficiary Location',
    color: '#7C3AED',
  },
  [GEOGRAPHIC_LOCATION_TYPE.DISASTER_ZONE]: {
    bg: '#B91C1C',
    border: '#FCA5A5',
    symbol: 'DZ',
    label: 'Disaster Zone',
    color: '#B91C1C',
  },
};

const DEFAULT_STYLE = { bg: '#64748B', border: '#FFFFFF', symbol: '?', label: 'Unknown', color: '#64748B' };

// ─── Status Colors ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  [LOCATION_OPERATIONAL_STATUS.OPERATIONAL]: '#22C55E',
  [LOCATION_OPERATIONAL_STATUS.CONSTRAINED]: '#F59E0B',
  [LOCATION_OPERATIONAL_STATUS.CRITICAL]: '#EF4444',
  [LOCATION_OPERATIONAL_STATUS.OFFLINE]: '#94A3B8',
  [LOCATION_OPERATIONAL_STATUS.AFFECTED]: '#F97316',
};

/**
 * Creates a Leaflet DivIcon for a geographic entity type.
 * Uses a colored circle with type abbreviation, plus a status dot indicator.
 */
function createGeoIcon(type, operationalStatus, isSelected = false) {
  const style = GEO_TYPE_STYLES[type] || DEFAULT_STYLE;
  const statusColor = STATUS_COLORS[operationalStatus] || '#94A3B8';

  const size = isSelected ? 34 : 28;
  const ringStyle = isSelected
    ? `box-shadow: 0 0 0 3px ${style.border}, 0 0 0 6px ${style.bg}44, 0 4px 12px rgba(0,0,0,0.35); transform: scale(1.1);`
    : 'box-shadow: 0 2px 6px rgba(0,0,0,0.25);';

  const html = `
    <div style="position:relative;display:inline-block;">
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background-color:${style.bg};
        border:2.5px solid ${style.border};
        color:#FFFFFF;
        font-family:'JetBrains Mono',monospace;
        font-size:${size <= 28 ? 8 : 9}px;
        font-weight:800;
        display:flex;
        align-items:center;
        justify-content:center;
        text-align:center;
        transition:all 0.2s;
        ${ringStyle}
      ">${style.symbol}</div>
      <div style="
        position:absolute;
        bottom:-2px;
        right:-2px;
        width:9px;
        height:9px;
        border-radius:50%;
        background-color:${statusColor};
        border:1.5px solid #FFFFFF;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'geo-model-icon',
    iconSize: [size + 4, size + 4],
    iconAnchor: [(size + 4) / 2, (size + 4) / 2],
    popupAnchor: [0, -((size + 4) / 2) - 4],
  });
}

// ─── Popup Content ────────────────────────────────────────────────────────────
function GeoPopupContent({ location, onInspect }) {
  const style = GEO_TYPE_STYLES[location.type] || DEFAULT_STYLE;
  const statusColor = STATUS_COLORS[location.operationalStatus] || '#94A3B8';

  const ctx = location.operationalContext || {};
  const inv = ctx.liveInventory || {};
  const dem = ctx.liveDemand || {};

  const hasCapacity =
    location.capacity !== null &&
    location.capacity !== undefined &&
    typeof location.capacity === 'object' &&
    location.capacity.max !== undefined;

  const capacityPct = hasCapacity
    ? Math.round((location.capacity.occupied / location.capacity.max) * 100)
    : null;

  // Build a brief inventory/demand summary (max 3 lines)
  const invLines = Object.entries(inv.availableByCommodity || {})
    .filter(([, v]) => v > 0)
    .slice(0, 3)
    .map(([k, v]) => `${new Intl.NumberFormat().format(Math.round(v))} ${k}`);

  const demLines = Object.entries(dem.unmetDeficitByCommodity || {})
    .filter(([, v]) => v > 0)
    .slice(0, 2)
    .map(([k, v]) => `−${new Intl.NumberFormat().format(Math.round(v))} ${k}`);

  return (
    <div style={{ minWidth: 220, maxWidth: 280, fontSize: 12, lineHeight: 1.4, fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid #E2E8F0' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#142B43', lineHeight: 1.3 }}>{location.name}</div>
          <div style={{ fontSize: 10, color: '#60758A', marginTop: 1 }}>
            <span style={{
              display: 'inline-block',
              padding: '1px 5px',
              borderRadius: 3,
              backgroundColor: style.bg + '22',
              color: style.bg,
              fontWeight: 700,
              marginRight: 4,
            }}>{style.label}</span>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          fontSize: 9,
          fontWeight: 700,
          padding: '2px 5px',
          borderRadius: 4,
          backgroundColor: statusColor + '22',
          color: statusColor,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: statusColor }} />
          {location.operationalStatus}
        </div>
      </div>

      {/* Location */}
      <div style={{ fontSize: 10, color: '#60758A', marginBottom: 5 }}>
        📍 {location.address || location.region || '—'}
      </div>

      {/* Capacity Bar */}
      {hasCapacity && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#60758A', marginBottom: 2 }}>
            <span>Capacity</span>
            <span style={{ fontWeight: 700, color: '#142B43' }}>
              {new Intl.NumberFormat().format(location.capacity.occupied)} / {new Intl.NumberFormat().format(location.capacity.max)} {location.capacity.unit}
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, capacityPct)}%`,
              borderRadius: 2,
              backgroundColor: capacityPct >= 90 ? '#EF4444' : capacityPct >= 70 ? '#F59E0B' : '#22C55E',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* Live Inventory Summary */}
      {invLines.length > 0 && (
        <div style={{ marginBottom: 5 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#176B76', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
            Available Stock
          </div>
          {invLines.map((line) => (
            <div key={line} style={{ fontSize: 10, color: '#142B43', fontFamily: 'monospace' }}>✓ {line}</div>
          ))}
        </div>
      )}

      {/* Live Demand Summary */}
      {demLines.length > 0 && (
        <div style={{ marginBottom: 5 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#C94C4C', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
            Unmet Demand
          </div>
          {demLines.map((line) => (
            <div key={line} style={{ fontSize: 10, color: '#B91C1C', fontFamily: 'monospace' }}>{line}</div>
          ))}
          {dem.hasCriticalUnmet && (
            <div style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', marginTop: 2 }}>⚠ Critical shortage</div>
          )}
        </div>
      )}

      {/* No live operational data */}
      {invLines.length === 0 && demLines.length === 0 && (
        <div style={{ fontSize: 10, color: '#94A3B8', fontStyle: 'italic', marginBottom: 5 }}>
          No live inventory or demand linked to this location.
        </div>
      )}

      {/* DEMO label + Inspect button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 5, borderTop: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#94A3B8', fontWeight: 600 }}>
          {location.isDemo ? 'DEMO DATA' : 'LIVE DATA'} · {location.code || location.id}
        </div>
        {onInspect && (
          <button
            type="button"
            onClick={() => onInspect(location)}
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#176B76',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: 3,
            }}
          >
            Inspect →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Layer Component ─────────────────────────────────────────────────────
/**
 * GeoModelMarkerLayer
 *
 * Renders geographic model locations as Leaflet markers.
 * Must be placed inside a <MapContainer>.
 *
 * @param {Object[]} locations - Enriched geographic locations from Zustand (getGeographicEntities())
 * @param {string[]} visibleTypes - Array of GEOGRAPHIC_LOCATION_TYPE values to display
 * @param {string|null} selectedId - Currently selected location ID
 * @param {Function} onSelectLocation - Callback when a marker is clicked
 */
export function GeoModelMarkerLayer({
  locations = [],
  visibleTypes = Object.values(GEOGRAPHIC_LOCATION_TYPE),
  selectedId = null,
  onSelectLocation,
}) {
  // Filter to only visible types, skip invalid/missing coordinates
  const visible = locations.filter((loc) => {
    if (!visibleTypes.includes(loc.type)) return false;
    const lat = loc.latitude ?? loc.coordinates?.[0];
    const lng = loc.longitude ?? loc.coordinates?.[1];
    if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return false;
    if (Number(lat) < -90 || Number(lat) > 90) return false;
    if (Number(lng) < -180 || Number(lng) > 180) return false;
    return true;
  });

  return (
    <>
      {visible.map((loc) => {
        const lat = loc.latitude ?? loc.coordinates?.[0];
        const lng = loc.longitude ?? loc.coordinates?.[1];
        const isSelected = selectedId === loc.id;

        return (
          <Marker
            key={loc.id}
            position={[Number(lat), Number(lng)]}
            icon={createGeoIcon(loc.type, loc.operationalStatus, isSelected)}
            eventHandlers={{
              click: () => onSelectLocation?.(loc),
            }}
            zIndexOffset={isSelected ? 1000 : 500}
          >
            <Popup minWidth={220} maxWidth={300} closeButton={true}>
              <GeoPopupContent
                location={loc}
                onInspect={onSelectLocation}
              />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

