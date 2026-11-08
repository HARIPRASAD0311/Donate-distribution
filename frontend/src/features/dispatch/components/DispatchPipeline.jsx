import React from 'react';
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  Navigation,
  MapPin,
  CheckCheck,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { DISPATCH_STAGES } from '../data/dispatchData.js';

const STAGE_ICONS = {
  APPROVED: CheckCircle,
  PREPARING: Package,
  READY: Clock,
  DISPATCHED: Truck,
  IN_TRANSIT: Navigation,
  ARRIVED: MapPin,
  DELIVERED: CheckCheck,
  VERIFIED: FileCheck2,
};

/**
 * Enterprise Visual Dispatch & Verification Pipeline
 * Approved -> Preparing -> Ready -> Dispatched -> In Transit -> Arrived -> Delivered -> Verified
 */
export function DispatchPipeline({
  dispatches = [],
  activeStageFilter = 'ALL',
  onSelectStage,
}) {
  return (
    <Card
      title="Consignment Dispatch &amp; Custody Transfer Pipeline"
      subtitle="Chain-of-custody tracking from allocation approval to verified proof-of-delivery signoff"
      badge={<StatusBadge variant="teal" size="xs">CUSTODY PIPELINE</StatusBadge>}
      noPadding
    >
      <div className="p-3 bg-white">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {DISPATCH_STAGES.map((stage, idx) => {
            const Icon = STAGE_ICONS[stage.id] || Truck;
            const matchingOrders = dispatches.filter((d) => d.status === stage.id);
            const totalQty = matchingOrders.reduce((acc, d) => acc + d.quantity, 0);
            const isSelected = activeStageFilter === stage.id;

            return (
              <div
                key={stage.id}
                onClick={() => onSelectStage?.(isSelected ? 'ALL' : stage.id)}
                className={`
                  p-2.5 rounded-lg border cursor-pointer transition-all text-xs flex flex-col justify-between relative
                  ${isSelected
                    ? 'border-navy-primary bg-brand-surface ring-2 ring-navy-primary/20 shadow-sm'
                    : matchingOrders.length > 0
                    ? 'border-brand-border bg-white hover:border-teal'
                    : 'border-brand-border-light bg-brand-bg/50 opacity-60 hover:opacity-100'
                  }
                `}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-text-secondary font-bold">
                      0{idx + 1}
                    </span>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                      matchingOrders.length > 0
                        ? 'bg-teal-light text-teal'
                        : 'bg-steel-light text-text-secondary'
                    }`}>
                      {matchingOrders.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold text-navy-primary text-xs mb-0.5 truncate">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-teal" />
                    <span className="truncate">{stage.label.split('. ')[1]}</span>
                  </div>

                  <p className="text-[10px] text-text-secondary leading-tight line-clamp-1 mb-2">
                    {stage.desc}
                  </p>
                </div>

                <div className="pt-1.5 border-t border-brand-border-light flex items-center justify-between font-mono text-[10px]">
                  <span className="text-text-secondary">Volume:</span>
                  <strong className="text-navy-primary">
                    {new Intl.NumberFormat().format(totalQty)}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
