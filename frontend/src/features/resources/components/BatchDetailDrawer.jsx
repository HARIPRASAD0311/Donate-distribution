import React from 'react';
import {
  Package,
  Calendar,
  Clock,
  Building,
  ShieldCheck,
  History,
  FileCheck,
  Thermometer,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react';
import { SideDrawer } from '../../../components/drawers/SideDrawer.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export function BatchDetailDrawer({ batch, isOpen, onClose, onActionTrigger }) {
  if (!batch) return null;

  const isQuarantined = batch.qualityStatus === 'QUARANTINED';
  const isAwaitingQc = batch.qualityStatus === 'AWAITING_QC';
  const isUsable = batch.qualityStatus === 'VERIFIED_USABLE';

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={batch.name}
      subtitle={`Lot / Batch Ref: ${batch.batchId} • ${batch.commodity}`}
      badge={
        <StatusBadge
          variant={isUsable ? 'success' : isQuarantined ? 'critical' : 'warning'}
          pulse={isQuarantined}
        >
          {batch.qualityStatus}
        </StatusBadge>
      }
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onActionTrigger?.('QUARANTINE', batch)}
            className="text-status-critical hover:bg-status-critical-bg"
          >
            Quarantine Lot
          </Button>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onActionTrigger?.('TRANSFER', batch)}
            >
              Transfer Batch
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Core Stock Ledger Strip */}
        <div className="p-4 bg-brand-bg border border-brand-border rounded-lg space-y-3">
          <div className="flex items-center justify-between text-[11px] pb-2 border-b border-brand-border-light">
            <span className="text-text-secondary">Staging Facility:</span>
            <span className="font-bold text-navy-primary">{batch.facilityName} ({batch.facilityId})</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-white border border-brand-border">
              <span className="text-[10px] text-text-secondary uppercase block">Received Qty</span>
              <span className="font-mono font-bold text-text-primary text-xs">
                {new Intl.NumberFormat().format(batch.receivedQty || batch.totalQty)}
              </span>
              <span className="text-[10px] text-text-muted block">{batch.unit}</span>
            </div>

            <div className="p-2 rounded bg-white border border-brand-border">
              <span className="text-[10px] text-text-secondary uppercase block">Current Usable</span>
              <span className="font-mono font-bold text-status-success text-xs">
                {new Intl.NumberFormat().format(batch.usableQty)}
              </span>
              <span className="text-[10px] text-text-muted block">{batch.unit}</span>
            </div>

            <div className="p-2 rounded bg-white border border-brand-border">
              <span className="text-[10px] text-text-secondary uppercase block">Reserved Hold</span>
              <span className="font-mono font-bold text-teal text-xs">
                {new Intl.NumberFormat().format(batch.reservedQty)}
              </span>
              <span className="text-[10px] text-text-muted block">{batch.unit}</span>
            </div>
          </div>
        </div>

        {/* Shelf-Life & FEFO Countdown */}
        <div className="p-3.5 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2">
          <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-brand-border-light flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-steel" />
              <span>Shelf-Life & FEFO Countdown</span>
            </div>
            <span className="font-mono text-status-critical font-bold text-[11px]">
              {batch.daysToExpiry} Days Remaining
            </span>
          </h4>

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-text-secondary block">Batch Expiry Date:</span>
              <span className="font-mono font-bold text-navy-primary">{batch.expiryDate}</span>
            </div>
            <div>
              <span className="text-text-secondary block">Storage Location / Bay:</span>
              <span className="font-medium text-text-primary">{batch.storageLocation}</span>
            </div>
            <div>
              <span className="text-text-secondary block">Intake / Source Entity:</span>
              <span className="font-medium text-text-primary">{batch.source}</span>
            </div>
            <div>
              <span className="text-text-secondary block">Date Received at Depot:</span>
              <span className="font-mono text-text-secondary">{batch.receivedDate}</span>
            </div>
          </div>
        </div>

        {/* Quality Verification Certificate */}
        <div className="p-3.5 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2">
          <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-brand-border-light flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-steel" />
              <span>Quality Assurance & Testing Seal</span>
            </div>
            <span className="font-mono text-[10px] text-teal font-semibold">
              {batch.qualityRecord?.testId || 'QC-PENDING'}
            </span>
          </h4>

          <div className="text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-text-secondary">Certified By:</span>
              <span className="font-medium text-text-primary">{batch.qualityRecord?.testedBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Test Timestamp:</span>
              <span className="font-mono text-text-secondary">{batch.qualityRecord?.testedAt}</span>
            </div>
            <div className="pt-1.5 mt-1 border-t border-brand-border-light">
              <span className="text-text-secondary block mb-0.5">Test Assessment Finding:</span>
              <span className={`font-semibold ${isQuarantined ? 'text-status-critical' : 'text-status-success'}`}>
                {batch.qualityRecord?.result}
              </span>
            </div>
          </div>
        </div>

        {/* Stock Movement Ledger History */}
        <div className="p-3.5 bg-white border border-brand-border rounded-lg shadow-subtle space-y-2">
          <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-brand-border-light flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-steel" />
            Stock Movement Ledger History
          </h4>

          <div className="divide-y divide-brand-border-light">
            {batch.movementHistory?.map((mv, i) => (
              <div key={i} className="py-2 flex items-center justify-between text-[11px]">
                <div>
                  <div className="font-semibold text-text-primary">{mv.action}</div>
                  <div className="text-[10px] text-text-secondary font-mono">{mv.date} • {mv.user}</div>
                </div>
                <span className={`font-mono font-bold ${mv.qty < 0 ? 'text-status-critical' : 'text-status-success'}`}>
                  {mv.qty > 0 ? `+${mv.qty}` : mv.qty} {batch.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
