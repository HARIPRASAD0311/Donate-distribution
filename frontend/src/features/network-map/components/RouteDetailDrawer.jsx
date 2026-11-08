import React, { useState } from 'react';
import {
  Navigation,
  Clock,
  Truck,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Calendar,
  X,
  Package,
  CheckCircle,
  AlertCircle,
  FileText,
  MapPin,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SideDrawer } from '../../../components/drawers/SideDrawer.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { useAppStore } from '../../../store/useAppStore.js';
import {
  ROUTE_STATUS,
  ROUTE_STATUS_STYLES,
  normalizeRouteStatus,
} from '../../../domain/transportRouteModel.js';

export function RouteDetailDrawer({
  route,
  isOpen,
  onClose,
  onSelectFacility,
}) {
  const { updateRouteStatus } = useAppStore();
  const [statusChangeMessage, setStatusChangeMessage] = useState(null);

  if (!route) return null;

  const normStatus = normalizeRouteStatus(route.routeStatus);
  const statusCfg = ROUTE_STATUS_STYLES[normStatus] || ROUTE_STATUS_STYLES[ROUTE_STATUS.PLANNED];
  const isBlocked = normStatus === ROUTE_STATUS.BLOCKED;
  const isDelayed = normStatus === ROUTE_STATUS.DELAYED;

  const handleUpdateStatus = (newStatus) => {
    const res = updateRouteStatus(route.id, newStatus, `Manual operator override to ${newStatus}`);
    if (res.ok) {
      setStatusChangeMessage(`Status changed to ${newStatus}`);
      setTimeout(() => setStatusChangeMessage(null), 3000);
    }
  };

  const dispatch = route.linkedDispatch || null;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={route.name || `Corridor ${route.id}`}
      subtitle={`Corridor ID: ${route.id}`}
      badge={
        <div className="flex items-center gap-1.5">
          <StatusBadge variant={statusCfg.badgeVariant} pulse={isBlocked}>
            {normStatus}
          </StatusBadge>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase font-semibold">
            {route.routingType === 'CALCULATED' ? 'GIS ROAD' : 'DEMO'}
          </span>
        </div>
      }
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-mono text-text-secondary">
            {route.routingType === 'CALCULATED' ? 'OSM / GIS TELEMETRY' : 'ILLUSTRATIVE CORRIDOR [DEMO]'}
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Route Details
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Origin to Destination Strip with Interactive Facility Selectors */}
        <div className="p-3.5 bg-brand-bg border border-brand-border rounded-lg space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-secondary flex items-center gap-1">
              <MapPin className="w-3 h-3 text-steel" /> Corridor Origin:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-navy-primary">{route.origin}</span>
              {onSelectFacility && (
                <button
                  type="button"
                  onClick={() => onSelectFacility(route.originFacilityId || route.origin)}
                  className="text-teal hover:underline text-[10px] flex items-center gap-0.5 font-medium"
                >
                  Inspect <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center my-1 text-steel">
            <div className="h-px bg-brand-border flex-1" />
            <Navigation className="w-3.5 h-3.5 mx-2 text-teal rotate-90" />
            <div className="h-px bg-brand-border flex-1" />
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-secondary flex items-center gap-1">
              <MapPin className="w-3 h-3 text-steel" /> Corridor Destination:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-text-primary">{route.destination}</span>
              {onSelectFacility && (
                <button
                  type="button"
                  onClick={() => onSelectFacility(route.destinationFacilityId || route.destination)}
                  className="text-teal hover:underline text-[10px] flex items-center gap-0.5 font-medium"
                >
                  Inspect <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Operational Dispatch Order Integration Card */}
        <div className="p-3.5 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2.5">
          <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-brand-border-light flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-steel" />
              Connected Operational Dispatch Record
            </span>
            {dispatch && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-status-success border border-emerald-200">
                SYNCHRONIZED
              </span>
            )}
          </h4>

          {dispatch ? (
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-text-secondary">Dispatch Order ID:</span>
                <span className="font-mono font-bold text-navy-primary">{dispatch.id}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-text-secondary">Dispatch Status:</span>
                <StatusBadge
                  variant={
                    dispatch.status === 'VERIFIED' || dispatch.status === 'DELIVERED'
                      ? 'success'
                      : dispatch.status === 'IN_TRANSIT'
                      ? 'teal'
                      : 'warning'
                  }
                  size="xs"
                >
                  {dispatch.status}
                </StatusBadge>
              </div>
              {dispatch.commodity && (
                <div className="flex justify-between items-center py-0.5 border-t border-brand-border-light pt-1">
                  <span className="text-text-secondary">Carried Cargo:</span>
                  <span className="font-medium text-text-primary">
                    {dispatch.quantity} {dispatch.unit} {dispatch.commodity}
                  </span>
                </div>
              )}
              {dispatch.vehicle && (
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-text-secondary">Assigned Flotilla / Vehicle:</span>
                  <span className="font-medium text-text-primary">{dispatch.vehicle}</span>
                </div>
              )}
              {dispatch.carrier && (
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-text-secondary">Operating Unit / Carrier:</span>
                  <span className="text-text-secondary">{dispatch.carrier}</span>
                </div>
              )}
              {dispatch.dispatchedAt && (
                <div className="flex justify-between items-center py-0.5 border-t border-brand-border-light pt-1">
                  <span className="text-text-secondary">Dispatched At:</span>
                  <span className="font-mono text-text-secondary">{dispatch.dispatchedAt}</span>
                </div>
              )}
              <div className="pt-2 border-t border-brand-border-light text-right">
                <Link
                  to="/dispatch"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal hover:underline"
                >
                  <span>Open in Dispatch &amp; Verification</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-2 text-center text-text-secondary text-[11px]">
              <p>No active operational dispatch order is currently assigned to this corridor.</p>
              <span className="text-[10px] text-steel">Corridor available for future allocation planning.</span>
            </div>
          )}
        </div>

        {/* Essential Disruption Alert if blocked or restricted */}
        {(isBlocked || isDelayed) && (
          <div className={`p-3.5 rounded-lg border text-xs space-y-1 ${
            isBlocked
              ? 'bg-status-critical-bg border-status-critical-border text-status-critical'
              : 'bg-status-warning-bg border-status-warning-border text-status-warning'
          }`}>
            <div className="font-bold flex items-center gap-1.5 uppercase text-[11px]">
              <AlertTriangle className="w-4 h-4" />
              <span>Corridor Blockage & Disruption Log</span>
            </div>
            <p className="text-text-primary leading-relaxed font-medium">
              {route.disruptionReason || (isBlocked ? 'Severe impassability reported along this transit sector.' : 'Transit constrained or delayed.')}
            </p>
          </div>
        )}

        {/* Technical Transit Parameters */}
        <div className="p-4 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2.5 text-[11px]">
          <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-brand-border-light flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-steel" />
            Transit Telemetry & Vehicle Constraints
          </h4>

          <div className="flex justify-between py-1 border-b border-brand-border-light">
            <span className="text-text-secondary">Distance:</span>
            <span className="font-mono font-bold text-text-primary">
              {route.distanceKm ? `${route.distanceKm} km` : 'Not calculated (Awaiting GIS telemetry)'}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-brand-border-light">
            <span className="text-text-secondary">Estimated Travel Time:</span>
            <span className="font-mono font-bold text-navy-primary">
              {route.estimatedTime || 'Not calculated'}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-brand-border-light">
            <span className="text-text-secondary">Designated Transport Mode:</span>
            <span className="font-medium text-text-primary">{route.transportMode || 'Heavy Truck'}</span>
          </div>
          {route.capacityRestrictions && (
            <div className="flex justify-between py-1 border-b border-brand-border-light">
              <span className="text-text-secondary">Payload / Vehicle Restrictions:</span>
              <span className="font-medium text-status-warning">{route.capacityRestrictions}</span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span className="text-text-secondary">Routing Methodology:</span>
            <span className="font-mono font-semibold text-steel">
              {route.routingType === 'CALCULATED' ? 'Calculated Road Routing' : 'Illustrative Demo Vector'}
            </span>
          </div>
        </div>

        {/* Operator Route Status Action Strip */}
        <div className="p-3.5 bg-slate-50 border border-brand-border rounded-lg space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-[10px] text-text-secondary">
              Operator Route Status Transition:
            </span>
            {statusChangeMessage && (
              <span className="text-[10px] text-teal font-semibold animate-pulse">
                {statusChangeMessage}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: ROUTE_STATUS.ACTIVE, label: 'Active', color: 'hover:bg-emerald-50 hover:text-emerald-700' },
              { id: ROUTE_STATUS.COMPLETED, label: 'Completed', color: 'hover:bg-slate-200' },
              { id: ROUTE_STATUS.DELAYED, label: 'Delayed', color: 'hover:bg-amber-50 hover:text-amber-700' },
              { id: ROUTE_STATUS.BLOCKED, label: 'Blocked', color: 'hover:bg-red-50 hover:text-red-700' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleUpdateStatus(st.id)}
                className={`px-2 py-1.5 rounded border text-center font-medium transition-all ${
                  normStatus === st.id
                    ? 'bg-navy-secondary text-white border-navy-secondary font-bold shadow-sm'
                    : `bg-white text-text-secondary border-brand-border ${st.color}`
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
