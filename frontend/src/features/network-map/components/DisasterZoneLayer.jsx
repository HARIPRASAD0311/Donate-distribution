/**
 * ResQNet Stage 4.4 — Disaster Zones & Geographical Risk Overlays Layer
 *
 * Renders GeoJSON Polygons and MultiPolygons with transparent fills so that
 * facilities, routes, and operational markers remain visible beneath them.
 * Color-coded strictly by risk severity level:
 *   - Critical: Crimson / Red (#EF4444)
 *   - High: Orange (#F97316)
 *   - Moderate: Amber / Yellow (#F59E0B)
 *   - Low: Emerald / Green (#10B981)
 */

import React from 'react';
import { Polygon, Popup } from 'react-leaflet';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import {
  RISK_SEVERITY,
  RISK_SEVERITY_STYLES,
  DISASTER_TYPE_CONFIG,
  normalizeGeometryToLeaflet,
} from '../../../domain/disasterZoneModel.js';

export function DisasterZoneLayer({
  zones = [],
  selectedZoneId = null,
  onSelectZone,
  visibleTypes = 'ALL',
  visibleSeverity = 'ALL',
  visibleClassification = 'ALL',
}) {
  if (!zones || zones.length === 0) return null;

  // Filter disaster zones based on active filters
  const filteredZones = zones.filter((zone) => {
    // 1. Disaster Type filter
    if (visibleTypes !== 'ALL' && zone.disasterType !== visibleTypes) {
      return false;
    }
    // 2. Risk Severity filter
    if (visibleSeverity !== 'ALL' && zone.severity !== visibleSeverity) {
      return false;
    }
    // 3. Classification filter
    if (visibleClassification !== 'ALL') {
      const isDemo = zone.isDemo ?? true;
      if (visibleClassification === 'DEMO' && !isDemo) return false;
      if (visibleClassification === 'LIVE' && isDemo) return false;
    }
    return true;
  });

  return (
    <>
      {filteredZones.map((zone) => {
        const latLngs = zone.leafletLatLngs || normalizeGeometryToLeaflet(zone.geometry);
        if (!latLngs || latLngs.length === 0) return null;

        const isSelected = selectedZoneId === zone.id;
        const severityStyle = RISK_SEVERITY_STYLES[zone.severity] || RISK_SEVERITY_STYLES[RISK_SEVERITY.MODERATE];
        const typeCfg = DISASTER_TYPE_CONFIG[zone.disasterType] || { label: zone.disasterType, color: '#3B82F6' };

        const pathOptions = {
          color: isSelected ? '#142B43' : severityStyle.color,
          fillColor: severityStyle.fillColor,
          fillOpacity: isSelected ? 0.35 : severityStyle.fillOpacity,
          weight: isSelected ? 3.5 : severityStyle.weight,
          dashArray: isSelected ? 'none' : severityStyle.dashArray,
        };

        const impact = zone.impact || { exposedFacilities: [], exposedRoutes: [], summary: { facilityCount: 0, routeCount: 0 } };

        return (
          <Polygon
            key={zone.id}
            positions={latLngs}
            pathOptions={pathOptions}
            eventHandlers={{
              click: () => onSelectZone?.(zone),
            }}
          >
            <Popup>
              <div className="p-2 space-y-2 min-w-[240px] text-xs">
                {/* Zone Header */}
                <div className="flex items-center justify-between gap-1 pb-1 border-b border-brand-border-light">
                  <span className="font-bold text-text-primary text-xs leading-tight truncate">
                    {zone.name}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold uppercase shrink-0">
                    {zone.isDemo ? 'DEMO' : 'LIVE'}
                  </span>
                </div>

                {/* Badges Row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <StatusBadge variant={severityStyle.badgeVariant} size="xs">
                    {severityStyle.label}
                  </StatusBadge>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded border"
                    style={{ borderColor: typeCfg.color, color: typeCfg.color }}
                  >
                    {typeCfg.label}
                  </span>
                  <StatusBadge variant="neutral" size="xs">
                    {zone.status}
                  </StatusBadge>
                </div>

                {/* Description */}
                {zone.description && (
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {zone.description}
                  </p>
                )}

                {/* Exposure Telemetry Preview */}
                <div className="bg-slate-50 border border-brand-border-light rounded p-1.5 text-[10px] space-y-0.5 text-text-secondary">
                  <div className="flex justify-between">
                    <span>Exposed Facilities:</span>
                    <strong className="text-navy-primary font-mono">{impact.summary?.facilityCount ?? 0}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Intersecting Corridors:</span>
                    <strong className="text-navy-primary font-mono">{impact.summary?.routeCount ?? 0}</strong>
                  </div>
                </div>

                {/* Source & Timestamp */}
                <div className="text-[9px] text-text-secondary pt-1 border-t border-brand-border-light space-y-0.5 font-mono">
                  <div>Source: <span className="text-navy-primary font-semibold">{zone.source}</span></div>
                  <div>Updated: {new Date(zone.lastUpdated).toLocaleTimeString()} UTC</div>
                </div>

                {/* Action button */}
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectZone?.(zone)}
                    className="text-teal hover:underline text-[11px] font-semibold"
                  >
                    Inspect Hazard Zone →
                  </button>
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}

