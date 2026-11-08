import React from 'react';
import {
  Users,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  AlertTriangle,
  Package,
  Truck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { SideDrawer } from '../../../components/drawers/SideDrawer.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';

/**
 * Enterprise Demand Details Inspector Drawer
 * Comprehensive inspection dossier with beneficiary demographic census,
 * verification audit trail, and delivery fulfilment status.
 */
export function DemandDetailsDrawer({
  demand,
  isOpen,
  onClose,
  onActionTrigger,
  onNavigateToAllocation,
}) {
  if (!demand) return null;

  const isVerified = demand.verificationStatus === 'VERIFIED';
  const isPending = demand.verificationStatus === 'PENDING';
  const isDisputed = demand.verificationStatus === 'DISPUTED';
  const isRejected = demand.verificationStatus === 'REJECTED';

  const fulfilmentPct =
    demand.quantity > 0
      ? Math.round((demand.fulfilledQuantity / demand.quantity) * 100)
      : 0;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={demand.item}
      subtitle={`Demand Reference: ${demand.id} • ${demand.commodity}`}
      badge={
        <StatusBadge
          variant={
            demand.priority === 'CRITICAL'
              ? 'critical'
              : demand.priority === 'HIGH'
              ? 'warning'
              : 'teal'
          }
          pulse={demand.priority === 'CRITICAL'}
          size="xs"
        >
          {demand.priority}
        </StatusBadge>
      }
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          {isPending ? (
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="secondary"
                onClick={() => onActionTrigger?.('DISPUTE', demand)}
                className="text-status-critical"
              >
                Dispute Claim
              </Button>
              <Button
                size="xs"
                variant="primary"
                onClick={() => onActionTrigger?.('VERIFY', demand)}
              >
                Verify Demand
              </Button>
            </div>
          ) : (
            <Button
              size="xs"
              variant="secondary"
              onClick={() => onActionTrigger?.('EDIT', demand)}
            >
              Edit Demand
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onClose}>
              Close
            </Button>

            {isVerified && demand.remainingQuantity > 0 && (
              <Button
                size="sm"
                variant="primary"
                icon={ArrowRight}
                onClick={() => onNavigateToAllocation?.(demand)}
              >
                Stage for Allocation
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* 1. Fulfilment Progress Overview */}
        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy-primary uppercase tracking-wider font-mono">
              Consignment Fulfilment Status
            </span>
            <StatusBadge
              variant={fulfilmentPct === 100 ? 'success' : fulfilmentPct > 0 ? 'teal' : 'critical'}
              size="xs"
            >
              {fulfilmentPct === 100 ? '100% FULFILLED' : `${fulfilmentPct}% DELIVERED`}
            </StatusBadge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-1">
            <div className="p-2 rounded bg-white border border-brand-border">
              <span className="text-[10px] text-text-secondary uppercase font-mono block">Required</span>
              <span className="text-base font-bold text-navy-primary font-mono">
                {new Intl.NumberFormat().format(demand.quantity)}
              </span>
              <span className="text-[10px] text-text-secondary block">{demand.unit}</span>
            </div>

            <div className="p-2 rounded bg-white border border-brand-border">
              <span className="text-[10px] text-text-secondary uppercase font-mono block">Fulfilled</span>
              <span className="text-base font-bold text-status-success font-mono">
                {new Intl.NumberFormat().format(demand.fulfilledQuantity)}
              </span>
              <span className="text-[10px] text-text-secondary block">{demand.unit}</span>
            </div>

            <div className="p-2 rounded bg-white border border-brand-border">
              <span className="text-[10px] text-text-secondary uppercase font-mono block">Remaining</span>
              <span className={`text-base font-bold font-mono ${demand.remainingQuantity > 0 ? 'text-status-critical' : 'text-status-success'}`}>
                {new Intl.NumberFormat().format(demand.remainingQuantity)}
              </span>
              <span className="text-[10px] text-text-secondary block">{demand.unit}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-text-secondary font-mono">
              <span>Delivery Pipeline</span>
              <span>{fulfilmentPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-steel-light overflow-hidden">
              <div
                className="h-full bg-teal rounded-full transition-all duration-300"
                style={{ width: `${fulfilmentPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Beneficiary Group & Demographics */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-navy-primary uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-4 h-4 text-teal" />
            Beneficiary Group &amp; Demographic Census
          </h4>

          <div className="p-3.5 rounded-lg border border-brand-border bg-white space-y-3 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-navy-primary text-sm">{demand.beneficiaryGroup}</div>
                <div className="text-text-secondary text-[11px] font-mono mt-0.5">
                  Region: {demand.region}
                </div>
              </div>
              <StatusBadge variant="navy" size="xs">
                {demand.beneficiaryGroupId}
              </StatusBadge>
            </div>

            <div className="p-2 rounded bg-brand-bg border border-brand-border-light text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-text-secondary">Specific Staging Location:</span>
                <span className="font-medium text-text-primary">{demand.location}</span>
              </div>
              {demand.coordinates && (
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-text-secondary">GPS Centroid:</span>
                  <span className="text-navy-primary">
                    {demand.coordinates[0].toFixed(4)}, {demand.coordinates[1].toFixed(4)}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2 rounded bg-brand-surface border border-brand-border">
                <span className="text-[10px] text-text-secondary block">Report Source:</span>
                <strong className="text-text-primary">{demand.reportingSource}</strong>
              </div>
              <div className="p-2 rounded bg-brand-surface border border-brand-border">
                <span className="text-[10px] text-text-secondary block">Required-By Horizon:</span>
                <strong className="text-navy-primary font-mono">{demand.requiredByDate}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Formal Verification Dossier & Audit Evidence */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-navy-primary uppercase tracking-wider font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal" />
            Verification Dossier &amp; Evidence Log
          </h4>

          <div className="p-3.5 rounded-lg border border-brand-border bg-white space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Current Audit State:</span>
              <StatusBadge
                variant={
                  isVerified ? 'success' : isPending ? 'warning' : isDisputed ? 'critical' : 'neutral'
                }
                size="xs"
              >
                {demand.verificationStatus}
              </StatusBadge>
            </div>

            <div className="p-2.5 rounded bg-brand-bg border border-brand-border-light space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-text-secondary">Verification Officer:</span>
                <span className="font-medium text-navy-primary">
                  {demand.verificationDetails?.verifiedBy || 'Pending Ground Reconnaissance'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Audit Timestamp:</span>
                <span className="font-mono text-text-primary">
                  {demand.verificationDetails?.verifiedAt || 'Awaiting Assessment'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Evidence Reference:</span>
                <span className="font-mono font-bold text-teal">
                  {demand.verificationDetails?.evidenceRef || 'None Attached'}
                </span>
              </div>
              {demand.verificationDetails?.evidenceType && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Methodology:</span>
                  <span className="text-text-primary">
                    {demand.verificationDetails?.evidenceType}
                  </span>
                </div>
              )}
            </div>

            <div>
              <span className="text-[11px] font-semibold text-text-secondary block mb-1">
                Field Reconnaissance Findings &amp; Justification:
              </span>
              <p className="p-2.5 rounded bg-brand-surface border border-brand-border text-[11px] text-text-primary leading-relaxed italic">
                "{demand.verificationDetails?.notes || demand.notes || 'No notes recorded.'}"
              </p>
            </div>
          </div>
        </div>

        {/* 4. Cross-Platform Allocation Note */}
        <div className="p-3 rounded-lg bg-teal-light/40 border border-teal/20 text-xs text-text-primary flex items-start gap-2.5">
          <Package className="w-4 h-4 text-teal shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong>Cross-Module Integration:</strong> This demand item is synchronized with the ResQNet Resource Allocation Engine. When verified, it appears in Allocation Planning candidate queues.
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
