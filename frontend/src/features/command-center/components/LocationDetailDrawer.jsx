import React from 'react';
import {
  MapPin,
  Building,
  Users,
  AlertTriangle,
  Package,
  Truck,
  Phone,
  CheckCircle,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { SideDrawer } from '../../../components/drawers/SideDrawer.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';

export function LocationDetailDrawer({ entity, isOpen, onClose, onActionClick }) {
  if (!entity) return null;

  const isFacility = entity.entityKind === 'FACILITY';
  const isCommunity = entity.entityKind === 'COMMUNITY';
  const isDisruption = entity.entityKind === 'DISRUPTION';

  const title = isFacility
    ? entity.name
    : isCommunity
    ? entity.name
    : entity.title || 'Location Details';

  const subtitle = isFacility
    ? `${entity.code} — ${entity.locationName}`
    : isCommunity
    ? `${entity.sector} — Population: ${new Intl.NumberFormat().format(entity.population || 0)}`
    : `Infrastructure Disruption: ${entity.corridor}`;

  const badge = isFacility ? (
    <StatusBadge variant={entity.status === 'OPERATIONAL' ? 'success' : 'warning'}>
      {entity.status}
    </StatusBadge>
  ) : isCommunity ? (
    <StatusBadge variant={entity.priority === 'CRITICAL' ? 'critical' : 'warning'} pulse={entity.priority === 'CRITICAL'}>
      {entity.priority} PRIORITY
    </StatusBadge>
  ) : (
    <StatusBadge variant="critical" pulse>
      ROAD IMPASSE
    </StatusBadge>
  );

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      badge={badge}
      width="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
          {isDisruption && (
            <Button
              variant="critical"
              size="sm"
              icon={Navigation}
              onClick={() => {
                onActionClick?.('REROUTE', entity);
                onClose();
              }}
            >
              Evaluate Detour
            </Button>
          )}
          {isCommunity && (
            <Button
              variant="primary"
              size="sm"
              icon={Package}
              onClick={() => {
                onActionClick?.('ALLOCATE', entity);
                onClose();
              }}
            >
              Allocate Aid
            </Button>
          )}
          {isFacility && (
            <Button
              variant="navy"
              size="sm"
              icon={Truck}
              onClick={() => {
                onActionClick?.('DISPATCH', entity);
                onClose();
              }}
            >
              Prepare Dispatch
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Coordinates Telemetry Card */}
        <div className="p-3 bg-brand-bg border border-brand-border rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-secondary">
            <MapPin className="w-4 h-4 text-teal" />
            <span>Geospatial Coordinates:</span>
          </div>
          <span className="font-mono font-bold text-navy-primary">
            {Array.isArray(entity.coordinates)
              ? `${entity.coordinates[0].toFixed(4)}, ${entity.coordinates[1].toFixed(4)}`
              : 'Defined in corridor'}
          </span>
        </div>

        {/* Community Specific Details */}
        {isCommunity && (
          <>
            <div className="p-3.5 bg-white border border-brand-border rounded-lg space-y-2">
              <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-brand-border-light">
                Humanitarian Needs Assessment
              </h4>
              <div className="flex justify-between py-1 border-b border-brand-border-light">
                <span className="text-text-secondary">Primary Commodity Need:</span>
                <span className="font-semibold text-text-primary">{entity.primaryNeed}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-brand-border-light">
                <span className="text-text-secondary">Required Quantity:</span>
                <span className="font-mono font-bold text-text-primary">{entity.requiredQty} {entity.unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-brand-border-light">
                <span className="text-text-secondary">Unmet Critical Shortage:</span>
                <span className="font-mono font-bold text-status-critical">{entity.unmetQty} {entity.unit}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-secondary">Access Route / Corridor:</span>
                <span className="font-medium text-teal">{entity.accessMethod}</span>
              </div>
            </div>

            <div className="p-3 bg-teal-subtle/50 border border-teal/20 rounded-lg text-[11px] text-text-secondary">
              <span className="font-semibold text-text-primary block mb-0.5">Reported By:</span>
              <span>{entity.reportedBy} (Field Satellite Telemetry)</span>
            </div>
          </>
        )}

        {/* Facility Specific Details */}
        {isFacility && (
          <div className="p-3.5 bg-white border border-brand-border rounded-lg space-y-2">
            <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-brand-border-light">
              Depot Staging Capacity & Status
            </h4>
            <div className="flex justify-between py-1 border-b border-brand-border-light">
              <span className="text-text-secondary">Storage Capacity:</span>
              <span className="font-mono font-bold text-text-primary">
                {entity.utilizedCapacityM3} / {entity.totalCapacityM3} m³ ({entity.utilizationPct}%)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-brand-border-light">
              <span className="text-text-secondary">Stock Inventory On Hand:</span>
              <span className="font-medium text-text-primary">{entity.stockSummary}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-secondary">Depot Master / Contact:</span>
              <span className="font-medium text-navy-primary">{entity.contact}</span>
            </div>
          </div>
        )}

        {/* Disruption Specific Details */}
        {isDisruption && (
          <div className="p-3.5 bg-status-critical-bg border border-status-critical-border rounded-lg space-y-2">
            <h4 className="font-bold text-status-critical uppercase tracking-wider text-[11px] pb-1 border-b border-status-critical-border/40 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Impasse Assessment & Impact
            </h4>
            <p className="text-text-primary leading-relaxed">
              {entity.impact}
            </p>
            <div className="pt-2 border-t border-status-critical-border/40 text-[11px] space-y-1">
              <div><strong>Transit Delay Incurred:</strong> {entity.delay}</div>
              <div><strong>Recommended Alternative Corridor:</strong> {entity.suggestedBypass}</div>
            </div>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
