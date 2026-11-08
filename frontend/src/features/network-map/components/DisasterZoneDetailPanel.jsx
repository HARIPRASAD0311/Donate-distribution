/**
 * ResQNet Stage 4.4 — Disaster Zone Detail Side Panel
 *
 * Detailed inspection panel for a selected geographical disaster zone or risk layer.
 * Displays validated hazard information, information source, last updated timestamp,
 * and comprehensive facility/corridor exposure analysis.
 */

import React from 'react';
import {
  AlertTriangle,
  MapPin,
  Route as RouteIcon,
  ShieldAlert,
  Clock,
  Database,
  ExternalLink,
  X,
  Info,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import {
  RISK_SEVERITY_STYLES,
  DISASTER_TYPE_CONFIG,
  RISK_SEVERITY,
} from '../../../domain/disasterZoneModel.js';

export function DisasterZoneDetailPanel({
  zone,
  onClose,
  onSelectFacility,
  onSelectRoute,
}) {
  if (!zone) return null;

  const severityStyle = RISK_SEVERITY_STYLES[zone.severity] || RISK_SEVERITY_STYLES[RISK_SEVERITY.MODERATE];
  const typeCfg = DISASTER_TYPE_CONFIG[zone.disasterType] || { label: zone.disasterType, color: '#3B82F6' };
  const impact = zone.impact || {
    exposedFacilities: [],
    exposedRoutes: [],
    summary: { facilityCount: 0, routeCount: 0 },
    exposureDisclaimer: 'Geographic intersection indicates potential exposure, not confirmed damage.',
  };

  return (
    <div className="absolute top-4 right-4 z-20 w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-140px)] bg-white rounded-xl shadow-card border border-brand-border flex flex-col overflow-hidden animate-in fade-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-brand-border bg-brand-surface shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
              style={{ backgroundColor: `${severityStyle.fillColor}20`, borderColor: severityStyle.color }}
            >
              <ShieldAlert className="w-4 h-4" style={{ color: severityStyle.color }} />
            </span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[10px] text-text-secondary uppercase">
                  {zone.id}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold uppercase">
                  {zone.isDemo ? 'DEMO' : 'LIVE'}
                </span>
              </div>
              <h3 className="font-bold text-text-primary text-sm leading-snug mt-0.5">
                {zone.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-brand-surface-hover transition-colors shrink-0"
            aria-label="Close detail panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Severity & Type Badges */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          <StatusBadge variant={severityStyle.badgeVariant} size="xs">
            {severityStyle.label}
          </StatusBadge>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded border"
            style={{ borderColor: typeCfg.color, color: typeCfg.color, backgroundColor: `${typeCfg.color}10` }}
          >
            {typeCfg.label}
          </span>
          <StatusBadge variant="neutral" size="xs">
            Status: {zone.status}
          </StatusBadge>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
        {/* Description */}
        {zone.description && (
          <div className="p-3 bg-brand-bg border border-brand-border rounded-lg text-text-primary leading-relaxed">
            {zone.description}
          </div>
        )}

        {/* Verified Source & Telemetry Timestamps */}
        <div className="p-3 bg-slate-50 border border-brand-border rounded-lg space-y-2 text-[11px]">
          <h4 className="font-bold text-text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-brand-border-light pb-1">
            <Database className="w-3.5 h-3.5 text-steel" />
            Verified Information Provenance
          </h4>
          <div className="flex justify-between items-start gap-2">
            <span className="text-text-secondary">Source:</span>
            <span className="font-medium text-navy-primary text-right">{zone.source}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-text-secondary">Last Updated:</span>
            <span className="font-mono text-text-secondary">{new Date(zone.lastUpdated).toUTCString()}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-text-secondary">Geometry Type:</span>
            <span className="font-mono text-steel uppercase font-semibold">{zone.geometry?.type || 'POLYGON'}</span>
          </div>
        </div>

        {/* Strict Impact & Exposure Analysis (Section 4) */}
        <div className="p-3.5 bg-white border border-brand-border rounded-lg shadow-subtle space-y-3">
          <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-brand-border-light flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-status-warning" />
              Spatial Exposure & Impact Analysis
            </span>
          </h4>

          {/* Mandatory Non-Destructive Analysis Notice */}
          <div className="p-2.5 rounded bg-amber-50/80 border border-amber-200 text-[10px] text-amber-900 leading-relaxed flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-status-warning shrink-0 mt-0.5" />
            <span>
              <strong>Potential Exposure Notice:</strong> Geographic intersection indicates potential environmental risk, not confirmed damage. Operational status reflects verified ground records.
            </span>
          </div>

          {/* Exposed Facilities */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-navy-primary">
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-steel" /> Facilities Located Inside Zone:
              </span>
              <span className="font-mono text-xs font-bold text-navy-primary">
                {impact.exposedFacilities.length}
              </span>
            </div>

            {impact.exposedFacilities.length > 0 ? (
              <div className="space-y-1">
                {impact.exposedFacilities.map((fac) => (
                  <div
                    key={fac.id}
                    className="p-2 rounded border border-brand-border bg-slate-50 flex items-center justify-between text-[11px]"
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold text-navy-primary truncate">{fac.name}</div>
                      <div className="text-[10px] text-text-secondary">
                        Status: <strong className="text-text-primary">{fac.operationalStatus}</strong>
                      </div>
                    </div>
                    {onSelectFacility && (
                      <button
                        type="button"
                        onClick={() => onSelectFacility(fac.id)}
                        className="text-teal hover:underline text-[10px] font-semibold flex items-center gap-0.5 shrink-0"
                      >
                        Inspect <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-text-secondary italic">
                No facilities located within this zone boundary.
              </p>
            )}
          </div>

          {/* Intersecting Transportation Corridors */}
          <div className="space-y-1.5 pt-2 border-t border-brand-border-light">
            <div className="flex items-center justify-between text-[11px] font-semibold text-navy-primary">
              <span className="flex items-center gap-1">
                <RouteIcon className="w-3.5 h-3.5 text-steel" /> Intersecting Transport Corridors:
              </span>
              <span className="font-mono text-xs font-bold text-navy-primary">
                {impact.exposedRoutes.length}
              </span>
            </div>

            {impact.exposedRoutes.length > 0 ? (
              <div className="space-y-1">
                {impact.exposedRoutes.map((rt) => (
                  <div
                    key={rt.id}
                    className="p-2 rounded border border-brand-border bg-slate-50 flex items-center justify-between text-[11px]"
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold text-navy-primary truncate">{rt.name}</div>
                      <div className="text-[10px] text-text-secondary">
                        Confirmed Status: <strong className="text-text-primary">{rt.routeStatus}</strong>
                      </div>
                    </div>
                    {onSelectRoute && (
                      <button
                        type="button"
                        onClick={() => onSelectRoute(rt)}
                        className="text-teal hover:underline text-[10px] font-semibold flex items-center gap-0.5 shrink-0"
                      >
                        Inspect <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-text-secondary italic">
                No active transport corridors intersect this zone boundary.
              </p>
            )}
          </div>
        </div>

        {/* Notes if present */}
        {zone.notes && (
          <div className="p-3 bg-brand-bg border border-brand-border rounded-lg text-[11px] text-text-secondary space-y-1">
            <span className="font-bold text-navy-primary block">Operational Guidance:</span>
            <p>{zone.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-brand-border bg-brand-surface flex items-center justify-between shrink-0">
        <span className="text-[10px] font-mono text-text-secondary">
          {zone.isDemo ? 'DEMO SPATIAL RISK LAYER' : 'LIVE SATELLITE / GIS TELEMETRY'}
        </span>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

