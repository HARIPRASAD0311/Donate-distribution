import React from 'react';
import { Clock, ShieldCheck, ArrowRight, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export function FefoPriorityQueue({ fefoQueue = [], onSelectBatch }) {
  return (
    <Card
      title="FEFO (First-Expiry, First-Out) Priority Dispatch Queue"
      subtitle="Autonomous shelf-life sequence. Earliest expiring eligible stock issued first."
      badge={<StatusBadge variant="teal" size="xs">FEFO COMPLIANT: 98.4%</StatusBadge>}
      noPadding
    >
      <div className="p-4 space-y-3">
        {/* FEFO Queue Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {fefoQueue.slice(0, 4).map((item) => {
            const isCriticalExpiry = item.daysToExpiry <= 15;
            const isWarningExpiry = item.daysToExpiry <= 45 && !isCriticalExpiry;

            return (
              <div
                key={item.id}
                onClick={() => onSelectBatch?.(item)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all hover:shadow-card flex flex-col justify-between relative
                  ${isCriticalExpiry
                    ? 'bg-status-critical-bg/30 border-status-critical-border hover:border-status-critical'
                    : isWarningExpiry
                    ? 'bg-status-warning-bg/30 border-status-warning-border hover:border-status-warning'
                    : 'bg-white border-brand-border hover:border-teal'
                  }
                `}
              >
                {/* Priority Rank Header */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    item.fefoRank === 1
                      ? 'bg-status-critical text-white'
                      : item.fefoRank === 2
                      ? 'bg-status-warning text-white'
                      : 'bg-navy-primary text-white'
                  }`}>
                    FEFO ISSUE #{item.fefoRank}
                  </span>

                  <span className="text-[10px] font-mono font-bold text-text-secondary">
                    {item.daysToExpiry}d remaining
                  </span>
                </div>

                {/* Resource & Batch Meta */}
                <div className="space-y-1 mb-3">
                  <div className="font-bold text-xs text-text-primary leading-tight line-clamp-2">
                    {item.name}
                  </div>
                  <div className="text-[10px] font-mono text-text-secondary">
                    {item.batchId} • {item.facilityName}
                  </div>
                </div>

                {/* Usable Stock & Expiry */}
                <div className="pt-2 border-t border-brand-border-light flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-text-secondary block">Usable Stock:</span>
                    <span className="font-mono font-bold text-text-primary text-tabular">
                      {new Intl.NumberFormat().format(item.usableQty)} {item.unit}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-text-secondary block">Expiry Date:</span>
                    <span className={`font-mono font-bold text-[11px] ${
                      isCriticalExpiry ? 'text-status-critical' : 'text-text-primary'
                    }`}>
                      {item.expiryDate}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Operational Guardrail Footer */}
        <div className="p-2.5 bg-brand-surface-hover border border-brand-border-light rounded-lg text-[11px] text-text-secondary flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-status-success shrink-0" />
            <span>
              <strong>FEFO Guardrail Active:</strong> Only verified usable lots are queued. Quarantined or expired stock is locked against issuance.
            </span>
          </div>
          <span className="font-mono text-[10px] text-steel">ALGORITHM: FEFO-V2</span>
        </div>
      </div>
    </Card>
  );
}
