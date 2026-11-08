import React from 'react';
import {
  Layers,
  FileCheck2,
  Calendar,
  Building,
  Route,
  Package,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { BASELINE_PLAN } from '../data/recoveryData.js';

/**
 * Area 1: Baseline Selection & Operational Telemetry
 * Selects the active incident, allocation plan, plan version, snapshot, and displays baseline metrics.
 */
export function BaselineSelector({
  selectedPlan = 'PLAN-ALPHA',
  onSelectPlan,
  selectedHorizon = '72h',
  onSelectHorizon,
}) {
  return (
    <Card
      title="1. Baseline Allocation Plan &amp; Operational Perimeter"
      subtitle="Select benchmark allocation plan evaluated prior to disruption event"
      badge={<StatusBadge variant="teal" size="xs">BENCHMARK: S(t)</StatusBadge>}
    >
      <div className="space-y-4 text-xs">
        {/* Baseline Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Crisis Incident Context
            </label>
            <div className="h-8 px-2.5 rounded border border-brand-border bg-brand-bg font-medium text-navy-primary flex items-center truncate">
              {BASELINE_PLAN.incidentName}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Pre-Disruption Allocation Plan
            </label>
            <Select
              value={selectedPlan}
              onChange={onSelectPlan}
              options={[
                { value: 'PLAN-ALPHA', label: 'Plan Alpha (v2.4-Alpha Balanced)' },
                { value: 'PLAN-BETA', label: 'Plan Beta (v2.4-Beta Speed Convoy)' },
                { value: 'PLAN-GAMMA', label: 'Plan Gamma (v2.4-Gamma Conservative)' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Data Ledger Snapshot
            </label>
            <div className="h-8 px-2.5 rounded border border-brand-border bg-brand-bg font-mono text-text-secondary flex items-center">
              {BASELINE_PLAN.snapshotId}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Planning Horizon Window
            </label>
            <div className="grid grid-cols-3 gap-1">
              {['24h', '48h', '72h'].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onSelectHorizon?.(h)}
                  className={`h-8 font-semibold rounded border transition-colors ${
                    selectedHorizon === h
                      ? 'bg-navy-primary text-white border-navy-primary'
                      : 'bg-white text-text-secondary border-brand-border hover:bg-brand-bg'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Baseline Performance KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-1 font-mono">
          <div className="p-2.5 rounded-lg bg-brand-bg border border-brand-border">
            <span className="text-[10px] text-text-secondary block font-sans">Available Stock</span>
            <span className="font-bold text-navy-primary text-sm">
              {new Intl.NumberFormat().format(BASELINE_PLAN.availableResources)}
            </span>
            <span className="text-[10px] text-text-secondary block font-sans">usable units</span>
          </div>

          <div className="p-2.5 rounded-lg bg-brand-bg border border-brand-border">
            <span className="text-[10px] text-text-secondary block font-sans">Verified Demand</span>
            <span className="font-bold text-navy-primary text-sm">
              {new Intl.NumberFormat().format(BASELINE_PLAN.verifiedDemand)}
            </span>
            <span className="text-[10px] text-text-secondary block font-sans">screened lots</span>
          </div>

          <div className="p-2.5 rounded-lg bg-brand-bg border border-brand-border">
            <span className="text-[10px] text-text-secondary block font-sans">Planned Allocation</span>
            <span className="font-bold text-teal text-sm">
              {new Intl.NumberFormat().format(BASELINE_PLAN.plannedAllocations)}
            </span>
            <span className="text-[10px] text-text-secondary block font-sans">86.5% met</span>
          </div>

          <div className="p-2.5 rounded-lg bg-brand-bg border border-brand-border">
            <span className="text-[10px] text-text-secondary block font-sans">Critical Coverage</span>
            <span className="font-bold text-status-success text-sm">
              {BASELINE_PLAN.criticalCoveragePct}%
            </span>
            <span className="text-[10px] text-text-secondary block font-sans">zero deficit</span>
          </div>

          <div className="p-2.5 rounded-lg bg-brand-bg border border-brand-border">
            <span className="text-[10px] text-text-secondary block font-sans">Staging Network</span>
            <span className="font-bold text-navy-primary text-sm">
              {BASELINE_PLAN.operationalFacilitiesCount} Depots / DCs
            </span>
            <span className="text-[10px] text-text-secondary block font-sans">7 nodes operational</span>
          </div>

          <div className="p-2.5 rounded-lg bg-brand-bg border border-brand-border">
            <span className="text-[10px] text-text-secondary block font-sans">Corridor Routes</span>
            <span className="font-bold text-navy-primary text-sm">
              {BASELINE_PLAN.accessibleRoutesCount} Corridors
            </span>
            <span className="text-[10px] text-text-secondary block font-sans">all routes passable</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
