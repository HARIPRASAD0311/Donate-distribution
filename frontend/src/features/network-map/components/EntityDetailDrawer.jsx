import React, { useMemo } from 'react';
import {
  Building2,
  MapPin,
  Package,
  Layers,
  ShieldCheck,
  Clock,
  Database,
  ArrowRight,
  Truck,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SideDrawer } from '../../../components/drawers/SideDrawer.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import {
  getConnectedRoutesForFacility,
  normalizeRouteStatus,
  ROUTE_STATUS,
  ROUTE_STATUS_STYLES,
} from '../../../domain/transportRouteModel.js';

export function EntityDetailDrawer({
  entity,
  isOpen,
  onClose,
  onSelectConnectedEntity,
  routes = [],
  onSelectRoute,
}) {
  if (!entity) return null;

  const connected = useMemo(() => {
    return getConnectedRoutesForFacility(entity?.id || entity?.code, routes);
  }, [entity, routes]);

  const categoryLabels = {
    INSTITUTIONAL_DONOR: 'Institutional Donor',
    SUPPLIER: 'Commercial Commodity Supplier',
    TIER_1_FOODBANK: 'Tier-I Central Logistics Depot',
    TIER_2_FRRA: 'Tier-II Forward Relief & Response Area',
    DISTRIBUTION_CENTRE: 'Field Distribution Centre',
    BENEFICIARY_LOCATION: 'Beneficiary Resettlement Site',
    AFFECTED_COMMUNITY: 'Affected Community Sector',
  };

  const statusVariant = {
    OPERATIONAL: 'success',
    CONSTRAINED: 'warning',
    OFFLINE: 'critical',
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={entity.name}
      subtitle={`${categoryLabels[entity.category] || entity.category} • ID: ${entity.id}`}
      badge={
        <StatusBadge variant={statusVariant[entity.operationalStatus] || 'neutral'}>
          {entity.operationalStatus}
        </StatusBadge>
      }
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-mono text-text-secondary">
            SIMULATED DEMO RECORD
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Dossier
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Verification & Data Source Banner */}
        <div className="p-3 bg-brand-bg border border-brand-border rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal shrink-0" />
            <div>
              <div className="font-semibold text-text-primary text-[11px]">
                {entity.dataSource}
              </div>
              <div className="text-[10px] font-mono text-text-secondary">
                Verified: {entity.lastVerification}
              </div>
            </div>
          </div>
          <StatusBadge variant="teal" size="xs">
            {entity.securityAuthorization || 'SECURITY_CLEARED'}
          </StatusBadge>
        </div>

        {/* Core Coordinates & Capacity Specifications */}
        <div className="p-4 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2.5">
          <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-brand-border-light flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-steel" />
            Facility Specifications & Telemetry
          </h4>

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-text-secondary block">Entity Code / Ref:</span>
              <span className="font-mono font-bold text-navy-primary">{entity.code}</span>
            </div>
            <div>
              <span className="text-text-secondary block">Coordinates (WGS84):</span>
              <span className="font-mono text-text-primary font-medium">
                {entity.coordinates ? `${entity.coordinates[0].toFixed(4)}, ${entity.coordinates[1].toFixed(4)}` : '—'}
              </span>
            </div>
            <div>
              <span className="text-text-secondary block">Storage Capacity:</span>
              <span className="font-mono font-bold text-text-primary">
                {entity.storageCapacityM3 ? `${new Intl.NumberFormat().format(entity.storageCapacityM3)} m³` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-text-secondary block">Physical Route Access:</span>
              <span className="font-semibold text-teal">{entity.routeAccessibility}</span>
            </div>
          </div>
        </div>

        {/* Available Stock & Humanitarian Payload */}
        <div className="p-4 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2">
          <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-brand-border-light flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-steel" />
            Available Usable Resources & Payload
          </h4>
          <p className="text-text-primary font-medium leading-relaxed">
            {entity.availableResources}
          </p>
          {entity.population && (
            <div className="pt-2 border-t border-brand-border-light text-[11px] flex justify-between">
              <span className="text-text-secondary">Resident / Displaced Population:</span>
              <span className="font-mono font-bold text-navy-primary">
                {new Intl.NumberFormat().format(entity.population)} individuals
              </span>
            </div>
          )}
        </div>

        {/* Cross-Dashboard Navigation */}
        <div className="p-3 bg-brand-bg border border-brand-border rounded-lg space-y-1.5">
          <div className="text-[11px] font-bold text-navy-primary uppercase tracking-wider pb-1 border-b border-brand-border-light">
            Operational Modules
          </div>
          <div className="flex flex-col gap-1.5 pt-0.5">
            <Link
              to="/resources"
              className="inline-flex items-center justify-between text-teal hover:underline text-[11px] font-semibold group"
            >
              <span>View Inventory in Resources Module</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/allocation"
              className="inline-flex items-center justify-between text-navy-primary hover:underline text-[11px] font-semibold group"
            >
              <span>Verify Allocation Plans</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Connected Supply Chain Nodes */}
        {entity.connectedFacilities && entity.connectedFacilities.length > 0 && (
          <div className="p-4 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2">
            <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-brand-border-light flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-steel" />
              Connected Supply Chain Echelons
            </h4>
            <p className="text-[11px] text-text-secondary">
              Direct logistical pipeline connections linked to this node:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {entity.connectedFacilities.map((connId) => (
                <button
                  key={connId}
                  type="button"
                  onClick={() => onSelectConnectedEntity?.(connId)}
                  className="px-2.5 py-1 bg-brand-bg hover:bg-teal-light text-text-primary hover:text-teal border border-brand-border rounded-md text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>{connId}</span>
                  <ArrowRight className="w-3 h-3 text-steel" />
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Connected Logistics Corridors (Stage 4.3) */}
        {connected.allConnected.length > 0 && (
          <div className="p-4 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2">
            <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-brand-border-light flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-steel" />
                Active Transportation Corridors ({connected.allConnected.length})
              </span>
            </h4>
            <div className="space-y-1.5">
              {connected.allConnected.map((r) => {
                const normStatus = normalizeRouteStatus(r.routeStatus);
                const cfg = ROUTE_STATUS_STYLES[normStatus] || ROUTE_STATUS_STYLES[ROUTE_STATUS.PLANNED];
                const entityKey = entity.id || entity.code;
                const isOrigin = String(r.originFacilityId || r.origin).includes(entityKey);
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
    </SideDrawer>
  );
}
