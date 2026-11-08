import React, { useState } from 'react';
import {
  FileText,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Building,
  MapPin,
  Truck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { DataTable } from '../../../components/tables/DataTable.jsx';

/**
 * Enterprise Allocation Results Table & Mathematical Explanation Panel
 * Implements Section 8 & Section 9 requirements.
 */
export function AllocationTableAndExplanation({
  allocations = [],
  selectedAllocation,
  onSelectAllocation,
}) {
  const selected = selectedAllocation || allocations[0];

  const columns = [
    {
      key: 'id',
      header: 'Allocation ID',
      width: '120px',
      render: (val, row) => (
        <div>
          <span className="font-mono font-bold text-navy-primary block">{val}</span>
          <span className="text-[10px] font-mono text-text-secondary">{row.demandId}</span>
        </div>
      ),
    },
    {
      key: 'sourceFacility',
      header: 'Source Facility',
      render: (val) => (
        <div className="font-medium text-text-primary text-xs">
          {val}
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destination & Region',
      render: (val, row) => (
        <div>
          <div className="font-semibold text-text-primary text-xs">{val}</div>
          <div className="text-[10px] text-text-secondary font-mono">{row.destinationRegion}</div>
        </div>
      ),
    },
    {
      key: 'commodity',
      header: 'Commodity',
      align: 'center',
      render: (val) => (
        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
          val === 'FOOD'
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : val === 'WATER'
            ? 'bg-teal-50 text-teal border border-teal/20'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {val}
        </span>
      ),
    },
    {
      key: 'item',
      header: 'Allocated Item',
      render: (val) => (
        <div className="font-medium text-text-primary text-xs">{val}</div>
      ),
    },
    {
      key: 'allocatedQty',
      header: 'Allocated Qty',
      align: 'right',
      render: (val, row) => (
        <span className="font-mono font-bold text-status-success text-tabular">
          {new Intl.NumberFormat().format(val)} <span className="text-[10px] font-normal">{row.unit}</span>
        </span>
      ),
    },
    {
      key: 'remainingDemand',
      header: 'Remaining Deficit',
      align: 'right',
      render: (val, row) => (
        <span className={`font-mono text-tabular ${val > 0 ? 'text-status-warning font-semibold' : 'text-text-secondary'}`}>
          {val > 0 ? new Intl.NumberFormat().format(val) : '—'}
        </span>
      ),
    },
    {
      key: 'route',
      header: 'Route Corridor',
      render: (val) => (
        <span className="text-[11px] text-text-secondary font-mono truncate max-w-[150px] block" title={val}>
          {val}
        </span>
      ),
    },
    {
      key: 'expectedArrival',
      header: 'Exp Arrival',
      align: 'center',
      render: (val) => (
        <span className="font-mono text-[11px] text-navy-primary font-medium">{val}</span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      align: 'center',
      render: (val) => (
        <StatusBadge
          variant={val === 'CRITICAL' ? 'critical' : val === 'HIGH' ? 'warning' : 'teal'}
          pulse={val === 'CRITICAL'}
          size="xs"
        >
          {val}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Allocation Results Table */}
      <Card
        title="Proposed Multi-Echelon Resource Allocations"
        subtitle="Mathematical matching between warehouse stocks and verified community demands"
        badge={<StatusBadge variant="teal" size="xs">PROPOSED PLAN</StatusBadge>}
        noPadding
      >
        <div className="p-3">
          <DataTable
            columns={columns}
            data={allocations}
            selectedId={selected?.id}
            onRowClick={(row) => onSelectAllocation?.(row)}
            pagination={{
              currentPage: 1,
              totalPages: 1,
              totalCount: allocations.length,
            }}
          />
        </div>
      </Card>

      {/* 2. Section 9: Mathematical Explanation & Decision Support Panel */}
      {selected && (
        <Card
          title={`Mathematical Decision Rationale: ${selected.id}`}
          subtitle={`Transparent optimization justification for ${selected.destination} (${selected.item})`}
          badge={<StatusBadge variant="navy" size="xs">DECISION SUPPORT</StatusBadge>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left Column: Why Selected & Constraints */}
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-brand-bg border border-brand-border space-y-1">
                <span className="font-bold text-navy-primary text-[11px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                  Why This Destination Was Selected:
                </span>
                <p className="text-[11px] text-text-primary leading-relaxed">
                  {selected.destinationSelectedReason}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-brand-bg border border-brand-border space-y-1">
                <span className="font-bold text-navy-primary text-[11px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-status-warning" />
                  Binding &amp; Active Constraints:
                </span>
                <p className="text-[11px] text-text-primary leading-relaxed font-mono">
                  {selected.bindingConstraints}
                </p>
              </div>
            </div>

            {/* Right Column: Alternative Resources & Unmet Rationale */}
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-brand-bg border border-brand-border space-y-1">
                <span className="font-bold text-navy-primary text-[11px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-teal" />
                  Candidate Resources Considered:
                </span>
                <p className="text-[11px] text-text-primary leading-relaxed">
                  {selected.resourcesConsidered}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-brand-bg border border-brand-border space-y-1">
                <span className="font-bold text-navy-primary text-[11px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-text-secondary" />
                  Why Some Demand Remains Unmet:
                </span>
                <p className="text-[11px] text-text-primary leading-relaxed">
                  {selected.unmetDemandReason}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-brand-border flex items-center justify-between text-[11px] text-text-secondary">
            <span className="font-mono">
              Human Override Status: <strong className={selected.humanOverride ? 'text-status-warning' : 'text-teal'}>
                {selected.humanOverride ? 'YES (Manual Coordinator Adjustment)' : 'NO (Pure Mathematical Optimum)'}
              </strong>
            </span>
            <span className="font-mono">
              MODEL: HiGHS-MILP-v2.4
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
