/**
 * ResQNet Stage 4.2 — Geographic Location Detail Side Panel
 *
 * Renders a detailed inspection panel for a selected Stage 4.1 geographic entity.
 * Consumes enriched location data including live operationalContext.
 */

import React, { useMemo } from 'react';
import {
  MapPin,
  Package,
  Users,
  Activity,
  Building2,
  ShieldCheck,
  X,
  AlertTriangle,
  BarChart3,
  Navigation,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { GEO_TYPE_STYLES } from './GeoModelMarkerLayer.jsx';
import { LOCATION_OPERATIONAL_STATUS } from '../../../domain/geographicModel.js';
import {
  getConnectedRoutesForFacility,
  normalizeRouteStatus,
  ROUTE_STATUS,
  ROUTE_STATUS_STYLES,
} from '../../../domain/transportRouteModel.js';

const STATUS_VARIANT = {
  [LOCATION_OPERATIONAL_STATUS.OPERATIONAL]: 'success',
  [LOCATION_OPERATIONAL_STATUS.CONSTRAINED]: 'warning',
  [LOCATION_OPERATIONAL_STATUS.CRITICAL]: 'critical',
  [LOCATION_OPERATIONAL_STATUS.OFFLINE]: 'neutral',
  [LOCATION_OPERATIONAL_STATUS.AFFECTED]: 'warning',
};

export function GeoLocationDetailPanel({ location, onClose, routes = [], onSelectRoute }) {
  if (!location) return null;

  const connected = useMemo(() => {
    return getConnectedRoutesForFacility(location?.code || location?.id, routes);
  }, [location, routes]);

  const style = GEO_TYPE_STYLES[location.type] || { label: location.type, bg: '#64748B', border: '#FFF', symbol: '?' };
  const statusVariant = STATUS_VARIANT[location.operationalStatus] || 'neutral';

  const ctx = location.operationalContext || {};
  const inv = ctx.liveInventory || {};
  const dem = ctx.liveDemand || {};

  const hasCapacity =
    location.capacity !== null &&
    location.capacity !== undefined &&
    typeof location.capacity === 'object' &&
    location.capacity.max !== undefined;

  const capacityPct = hasCapacity
    ? Math.min(100, Math.round((location.capacity.occupied / location.capacity.max) * 100))
    : null;

  const invEntries = Object.entries(inv.availableByCommodity || {}).filter(([, v]) => v > 0);
  const demEntries = Object.entries(dem.unmetDeficitByCommodity || {}).filter(([, v]) => v > 0);

  return (
    <div className="absolute top-14 bottom-4 right-3 z-20 w-80 sm:w-96 bg-white/97 backdrop-blur-md border border-brand-border rounded-xl shadow-dropdown flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-brand-border bg-brand-surface flex items-start justify-between gap-2 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ backgroundColor: style.bg + '22', color: style.bg }}
            >
              {style.symbol} · {style.label}
            </span>
            {location.isDemo && (
              <span className="text-[9px] font-mono font-semibold text-steel px-1.5 py-0.5 bg-brand-bg border border-brand-border rounded">
                DEMO
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-text-primary leading-tight truncate">{location.name}</h3>
          <div className="text-[11px] font-mono text-text-secondary mt-0.5">{location.code || location.id}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge variant={statusVariant} size="xs">{location.operationalStatus}</StatusBadge>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-brand-bg transition-colors"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">

        {/* Location & Coordinates */}
        <div className="p-3 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-text-secondary flex items-center gap-1.5 pb-1 border-b border-brand-border-light">
            <MapPin className="w-3.5 h-3.5 text-teal" />
            Location &amp; Coordinates
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-text-secondary block text-[10px]">Region / Address</span>
              <span className="font-medium text-text-primary">{location.address || location.region || '—'}</span>
            </div>
            <div>
              <span className="text-text-secondary block text-[10px]">WGS-84 Coordinates</span>
              <span className="font-mono text-text-primary">
                {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
              </span>
            </div>
          </div>
          {location.notes && (
            <p className="text-[10px] text-text-secondary italic leading-snug border-t border-brand-border-light pt-1.5">
              {location.notes}
            </p>
          )}
        </div>

        {/* Capacity */}
        {hasCapacity && (
          <div className="p-3 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-text-secondary flex items-center gap-1.5 pb-1 border-b border-brand-border-light">
              <Building2 className="w-3.5 h-3.5 text-teal" />
              Capacity
            </h4>
            <div className="flex justify-between items-baseline">
              <span className="text-text-secondary">
                {new Intl.NumberFormat().format(location.capacity.occupied)} / {new Intl.NumberFormat().format(location.capacity.max)}
              </span>
              <span className="font-mono font-bold text-text-primary">{capacityPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-brand-bg border border-brand-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${capacityPct}%`,
                  backgroundColor: capacityPct >= 90 ? '#EF4444' : capacityPct >= 70 ? '#F59E0B' : '#22C55E',
                }}
              />
            </div>
            <div className="text-[10px] text-text-secondary">{location.capacity.unit}</div>
          </div>
        )}

        {/* Live Inventory */}
        <div className="p-3 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-text-secondary flex items-center gap-1.5 pb-1 border-b border-brand-border-light">
            <Package className="w-3.5 h-3.5 text-teal" />
            Live Available Inventory
            <span className="text-[10px] font-mono ml-auto text-teal">{inv.lotCount || 0} lots</span>
          </h4>
          {invEntries.length > 0 ? (
            <div className="space-y-1">
              {invEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-text-secondary truncate pr-2">{key}</span>
                  <span className="font-mono font-bold text-teal shrink-0">
                    {new Intl.NumberFormat().format(Math.round(value))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-text-secondary italic">
              No inventory lots linked to this location.
            </p>
          )}
        </div>

        {/* Live Demand */}
        <div className="p-3 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-text-secondary flex items-center gap-1.5 pb-1 border-b border-brand-border-light">
            <Users className="w-3.5 h-3.5 text-status-warning" />
            Unmet Demand Deficit
            {dem.hasCriticalUnmet && (
              <AlertTriangle className="w-3 h-3 text-status-critical ml-1" />
            )}
            <span className="text-[10px] font-mono ml-auto text-status-warning">{dem.demandCount || 0} records</span>
          </h4>
          {demEntries.length > 0 ? (
            <div className="space-y-1">
              {demEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-text-secondary truncate pr-2">{key}</span>
                  <span className="font-mono font-bold text-status-critical shrink-0">
                    −{new Intl.NumberFormat().format(Math.round(value))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-text-secondary italic">
              No demand records linked to this location.
            </p>
          )}
        </div>

        {/* Operational Relationships */}
        {(location.relatedFacilityId || (location.relatedDemandIds && location.relatedDemandIds.length > 0) || location.relatedBeneficiaryGroupId) && (
          <div className="p-3 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-text-secondary flex items-center gap-1.5 pb-1 border-b border-brand-border-light">
              <Activity className="w-3.5 h-3.5 text-teal" />
              Operational Relationships
            </h4>
            {location.relatedFacilityId && (
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Linked Facility</span>
                <span className="font-mono font-semibold text-navy-primary">{location.relatedFacilityId}</span>
              </div>
            )}
            {location.relatedBeneficiaryGroupId && (
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Beneficiary Group</span>
                <span className="font-mono font-semibold text-navy-primary">{location.relatedBeneficiaryGroupId}</span>
              </div>
            )}
            {location.relatedDemandIds?.length > 0 && (
              <div>
                <span className="text-text-secondary block mb-1">Demand Records ({location.relatedDemandIds.length})</span>
                <div className="flex flex-wrap gap-1">
                  {location.relatedDemandIds.slice(0, 4).map((id) => (
                    <span key={id} className="font-mono text-[10px] px-1.5 py-0.5 bg-brand-bg border border-brand-border rounded text-text-primary">
                      {id}
                    </span>
                  ))}
                  {location.relatedDemandIds.length > 4 && (
                    <span className="text-[10px] text-text-secondary">+{location.relatedDemandIds.length - 4} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Convoys */}
        {ctx.activeInboundConvoys > 0 && (
          <div className="p-3 bg-teal-light border border-teal/20 rounded-lg">
            <div className="flex items-center gap-2 text-teal font-semibold">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{ctx.activeInboundConvoys} inbound convoy{ctx.activeInboundConvoys > 1 ? 's' : ''} en route</span>
            </div>
          </div>
        )}

        {/* Cross-Dashboard Operational Links */}
        <div className="p-3 bg-brand-bg border border-brand-border rounded-lg space-y-1.5">
          <div className="text-[11px] font-bold text-navy-primary uppercase tracking-wider pb-1 border-b border-brand-border-light">
            Operational Links
          </div>
          <div className="flex flex-col gap-1.5 pt-0.5">
            <Link
              to="/resources"
              className="inline-flex items-center justify-between text-teal hover:underline text-[11px] font-semibold group"
            >
              <span>Inspect Stock in Resources &amp; Inventory</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            {location.relatedDemandIds?.length > 0 && (
              <Link
                to="/demand"
                className="inline-flex items-center justify-between text-navy-primary hover:underline text-[11px] font-semibold group"
              >
                <span>View Demand Register ({location.relatedDemandIds.length} records)</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
            <Link
              to="/allocation"
              className="inline-flex items-center justify-between text-slate-700 hover:underline text-[11px] font-semibold group"
            >
              <span>Verify Allocation Plans</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Connected Logistics Corridors / Routes (Stage 4.3) */}
        {connected.allConnected.length > 0 && (
          <div className="p-3 bg-white border border-brand-border rounded-lg space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-text-primary uppercase tracking-wider pb-1 border-b border-brand-border-light">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-steel" />
                Connected Logistics Corridors ({connected.allConnected.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {connected.allConnected.map((r) => {
                const normStatus = normalizeRouteStatus(r.routeStatus);
                const cfg = ROUTE_STATUS_STYLES[normStatus] || ROUTE_STATUS_STYLES[ROUTE_STATUS.PLANNED];
                const locKey = location.code || location.id;
                const isOrigin = String(r.originFacilityId || r.origin).includes(locKey);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelectRoute?.(r)}
                    className="w-full text-left p-2 rounded border border-brand-border hover:border-teal bg-slate-50 hover:bg-white transition-all flex items-center justify-between text-[11px] group"
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold text-navy-primary group-hover:text-teal truncate">{r.name || r.id}</div>
                      <div className="text-[10px] text-text-secondary truncate">
                        {isOrigin ? `→ Dest: ${r.destination}` : `← Orig: ${r.origin}`}
                        {r.distanceKm ? ` · ${r.distanceKm} km` : ''}
                      </div>
                    </div>
                    <StatusBadge variant={cfg.badgeVariant} size="xs">
                      {normStatus}
                    </StatusBadge>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-brand-border bg-brand-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
          <ShieldCheck className="w-3 h-3 text-teal" />
          <span className="font-mono">{location.isDemo ? 'DEMO — Simulated location data' : 'LIVE — Authoritative operational record'}</span>
        </div>
      </div>
    </div>
  );
}

