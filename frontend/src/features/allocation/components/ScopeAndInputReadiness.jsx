import React from 'react';
import {
  Target,
  FileCheck2,
  Calendar,
  Layers,
  Building,
  MapPin,
  Truck,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';

/**
 * Stages 1 & 2: Planning Scope Configuration & Input Readiness Audit
 * Connects input validation to actual planning workflow.
 */
export function ScopeAndInputReadiness({
  scopeConfig,
  onChangeScope,
  validationReport,
  onValidate,
  onProceedToConstraints,
  activeStage = 1,
}) {
  const {
    incident = 'Cyclone Idai II (INC-2026-0412)',
    planningPeriod = '72h',
    commodities = ['FOOD', 'WATER', 'MEDICAL'],
    sourceFacilities = ['CSD-01', 'NLB-02', 'SRD-03'],
    destinationRegions = ['Buzi District', 'Manga IDP Hub', 'Chibabava Basin', 'Nhamatanda Corridor'],
    transportModes = ['Secured Convoy', 'Shallow Barge Flotilla', 'Air Cargo Shuttle'],
    reserveMarginPct = 15,
    budgetCapUSD = 250000,
  } = scopeConfig || {};

  const toggleCommodity = (comm) => {
    const next = commodities.includes(comm)
      ? commodities.filter((c) => c !== comm)
      : [...commodities, comm];
    onChangeScope?.('commodities', next);
  };

  const toggleSource = (facility) => {
    const next = sourceFacilities.includes(facility)
      ? sourceFacilities.filter((f) => f !== facility)
      : [...sourceFacilities, facility];
    onChangeScope?.('sourceFacilities', next);
  };

  const toggleRegion = (reg) => {
    const next = destinationRegions.includes(reg)
      ? destinationRegions.filter((r) => r !== reg)
      : [...destinationRegions, reg];
    onChangeScope?.('destinationRegions', next);
  };

  const isValid = validationReport ? validationReport.isValid : (commodities.length > 0 && sourceFacilities.length > 0 && destinationRegions.length > 0);
  const errors = validationReport?.errors || [];
  const warnings = validationReport?.warnings || [];

  const auditChecks = validationReport?.auditChecks || [
    {
      id: 'chk-commodities',
      name: 'Commodity Streams Verification',
      status: commodities.length > 0 ? 'PASS' : 'FAIL',
      detail: commodities.length > 0 ? `${commodities.length} active streams (${commodities.join(', ')})` : 'No commodity stream enabled',
    },
    {
      id: 'chk-sources',
      name: 'Operational Staging Depots',
      status: sourceFacilities.length > 0 ? 'PASS' : 'FAIL',
      detail: sourceFacilities.length > 0 ? `${sourceFacilities.length} depots operational` : 'No source facility selected',
    },
    {
      id: 'chk-destinations',
      name: 'Target Beneficiary Regions',
      status: destinationRegions.length > 0 ? 'PASS' : 'FAIL',
      detail: destinationRegions.length > 0 ? `${destinationRegions.length} target regions mapped` : 'No destinations specified',
    },
    {
      id: 'chk-reserve',
      name: 'Safety Reserve Margins',
      status: reserveMarginPct >= 5 ? 'PASS' : 'WARN',
      detail: `${reserveMarginPct}% baseline reserve retention configured`,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Planning Scope Configuration (2 Cols) */}
      <div className="lg:col-span-2 space-y-4">
        <Card
          title="Planning Scope & Optimization Boundary"
          subtitle="Define operational perimeter, active facilities, commodity streams, and target regions"
          badge={<StatusBadge variant="teal" size="xs">STAGE 01</StatusBadge>}
        >
          <div className="space-y-4">
            {/* Incident & Planning Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Active Crisis Incident
                </label>
                <div className="h-8 px-2.5 rounded border border-brand-border bg-brand-bg text-xs font-medium text-navy-primary flex items-center">
                  {incident}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Planning Time Horizon
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {['24h', '48h', '72h', '7d'].map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => onChangeScope?.('planningPeriod', period)}
                      className={`h-8 text-xs font-semibold rounded border transition-colors ${
                        planningPeriod === period
                          ? 'bg-navy-primary text-white border-navy-primary'
                          : 'bg-white text-text-secondary border-brand-border hover:bg-brand-bg'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Commodities Streams */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center justify-between">
                <span>Active Commodity Streams (Separate Unit Enforcement)</span>
                {commodities.length === 0 && (
                  <span className="text-status-critical text-[11px] font-bold">Required (Select at least 1)</span>
                )}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'FOOD', label: 'Food Supplies', unit: 'packets / MT', desc: 'BP-5 & Flour' },
                  { id: 'WATER', label: 'Safe Water', unit: '10L containers', desc: 'Potable & Aquatabs' },
                  { id: 'MEDICAL', label: 'Medical Supplies', unit: 'IEHK kits', desc: 'Trauma & Cold-Chain' },
                ].map((c) => {
                  const isChecked = commodities.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleCommodity(c.id)}
                      className={`
                        p-2.5 rounded-lg border cursor-pointer transition-all text-xs
                        ${isChecked
                          ? 'bg-brand-surface border-teal ring-1 ring-teal/30 shadow-xs'
                          : 'bg-white border-brand-border hover:border-text-secondary/50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-navy-primary">{c.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCommodity(c.id)}
                          className="rounded text-teal focus:ring-teal"
                        />
                      </div>
                      <div className="text-[10px] text-text-secondary font-mono">{c.unit}</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">{c.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Source Facilities Selection */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center justify-between">
                <span>Operational Source Facilities &amp; Depots</span>
                {sourceFacilities.length === 0 && (
                  <span className="text-status-critical text-[11px] font-bold">Required (Select at least 1)</span>
                )}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  { id: 'CSD-01', name: 'Central Staging Depot', type: 'Tier-1 Hub', cap: '5,000 m³' },
                  { id: 'NLB-02', name: 'North Logistics Base', type: 'Tier-1 Depot', cap: '3,500 m³' },
                  { id: 'SRD-03', name: 'South Riverine Staging', type: 'Tier-2 FRRA', cap: '1,800 m³' },
                ].map((f) => {
                  const isChecked = sourceFacilities.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleSource(f.id)}
                      className={`
                        p-2.5 rounded-lg border cursor-pointer transition-all text-xs
                        ${isChecked
                          ? 'bg-brand-surface border-navy-primary ring-1 ring-navy-primary/30 shadow-xs'
                          : 'bg-white border-brand-border hover:border-text-secondary/50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-navy-primary">{f.id}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSource(f.id)}
                          className="rounded text-navy-primary"
                        />
                      </div>
                      <div className="font-semibold text-text-primary text-[11px] truncate">{f.name}</div>
                      <div className="text-[10px] text-text-secondary flex justify-between mt-1 font-mono">
                        <span>{f.type}</span>
                        <span>{f.cap}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Destination Regions */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center justify-between">
                <span>Destination Crisis Zones (Humanitarian Beneficiaries)</span>
                {destinationRegions.length === 0 && (
                  <span className="text-status-critical text-[11px] font-bold">Required (Select at least 1)</span>
                )}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { name: 'Buzi District', pop: '14,200 IDPs', priority: 'CRITICAL' },
                  { name: 'Manga IDP Hub', pop: '8,500 IDPs', priority: 'HIGH' },
                  { name: 'Chibabava Basin', pop: '6,100 IDPs', priority: 'MEDIUM' },
                  { name: 'Nhamatanda Corridor', pop: '4,400 IDPs', priority: 'NORMAL' },
                ].map((d) => {
                  const isChecked = destinationRegions.includes(d.name);
                  return (
                    <div
                      key={d.name}
                      onClick={() => toggleRegion(d.name)}
                      className={`
                        p-2 rounded-lg border cursor-pointer transition-all text-xs
                        ${isChecked
                          ? 'bg-brand-surface border-teal ring-1 ring-teal/30 shadow-xs'
                          : 'bg-white border-brand-border hover:border-text-secondary/50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy-primary text-[11px] truncate">{d.name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRegion(d.name)}
                          className="rounded text-teal"
                        />
                      </div>
                      <div className="text-[10px] text-text-secondary mt-1 flex justify-between font-mono">
                        <span>{d.pop}</span>
                        <span className={d.priority === 'CRITICAL' ? 'text-status-critical font-bold' : ''}>
                          {d.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Budget & Reserve Margin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-brand-border-light">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Budget Ceiling Cap (USD)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-text-secondary font-bold">$</span>
                  <input
                    type="number"
                    min={10000}
                    step={5000}
                    value={budgetCapUSD}
                    onChange={(e) => onChangeScope?.('budgetCapUSD', parseInt(e.target.value) || 0)}
                    className="w-full h-8 px-2.5 rounded border border-brand-border bg-white text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Depot Safety Reserve Retention Margin (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={reserveMarginPct}
                    onChange={(e) => onChangeScope?.('reserveMarginPct', parseInt(e.target.value))}
                    className="w-full accent-teal"
                  />
                  <span className="font-mono text-xs font-bold text-navy-primary shrink-0 w-10 text-right">
                    {reserveMarginPct}%
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary mt-1">
                  Retains {reserveMarginPct}% buffer at source depots to cushion secondary surge shocks.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Input Readiness & Matrix Diagnostics (1 Col) */}
      <div className="space-y-4">
        <Card
          title="Input Readiness Audit"
          subtitle="Pre-flight verification checks before mathematical formulation"
          badge={
            isValid ? (
              <StatusBadge variant="success" size="xs">READY FOR SOLVE</StatusBadge>
            ) : (
              <StatusBadge variant="critical" size="xs">VALIDATION ERRORS</StatusBadge>
            )
          }
          action={
            <Button
              size="xs"
              variant="secondary"
              icon={RefreshCw}
              onClick={onValidate}
            >
              Re-Audit
            </Button>
          }
        >
          <div className="space-y-3">
            {/* Validation Errors Box */}
            {errors.length > 0 && (
              <div className="p-3 bg-status-critical-bg border border-status-critical-border rounded-lg space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-status-critical text-xs">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Missing Required Planning Inputs ({errors.length})</span>
                </div>
                <ul className="text-[11px] text-text-secondary list-disc pl-4 space-y-0.5">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Validation Warnings Box */}
            {warnings.length > 0 && (
              <div className="p-2.5 bg-status-warning-bg border border-status-warning-border rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-status-warning text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Operational Warnings ({warnings.length})</span>
                </div>
                <ul className="text-[11px] text-text-secondary list-disc pl-4 space-y-0.5">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Checklist */}
            <div className="space-y-2 text-xs">
              {auditChecks.map((chk) => (
                <div
                  key={chk.id || chk.name}
                  className={`p-2 rounded border flex items-center justify-between ${
                    chk.status === 'PASS'
                      ? 'bg-status-success-bg border-status-success-border text-status-success'
                      : chk.status === 'WARN'
                      ? 'bg-status-warning-bg border-status-warning-border text-status-warning'
                      : 'bg-status-critical-bg border-status-critical-border text-status-critical'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    {chk.status === 'PASS' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-xs truncate">{chk.name}</div>
                      {chk.detail && (
                        <div className="text-[10px] text-text-secondary truncate">{chk.detail}</div>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold shrink-0">
                    {chk.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Mathematical Matrix Dimensions */}
            <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1.5 text-xs">
              <div className="font-bold text-navy-primary text-[11px] uppercase tracking-wider font-mono">
                MILP Formulation Matrix
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-secondary">Decision Variables:</span>
                <span className="font-mono font-bold text-navy-primary">
                  {validationReport?.matrixDimensions?.decisionVariables || 284} (Continuous &amp; Binary)
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-secondary">Active Constraints:</span>
                <span className="font-mono font-bold text-navy-primary">
                  {validationReport?.matrixDimensions?.constraints || 142} (Hard + Soft)
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-secondary">Solver Architecture:</span>
                <span className="font-mono text-teal">HiGHS / SciPy v2.4</span>
              </div>
            </div>

            {/* Proceed Action Button */}
            <Button
              size="sm"
              variant="primary"
              className="w-full"
              icon={ArrowRight}
              onClick={onProceedToConstraints}
              disabled={!isValid}
            >
              {isValid
                ? 'Configure Constraints & Priorities →'
                : 'Resolve Validation Errors to Proceed'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
