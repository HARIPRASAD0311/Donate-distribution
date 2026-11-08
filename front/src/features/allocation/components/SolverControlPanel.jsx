import React, { useState } from 'react';
import {
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  BarChart2,
  ShieldCheck,
  StopCircle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { MOCK_PLANS } from '../data/allocationData.js';

/**
 * Optimization Solver Execution & Telemetry Control Desk
 * Interfaces with the external Python HiGHS MILP optimization engine.
 */
export function SolverControlPanel({
  selectedPlanId = 'PLAN-ALPHA',
  onSelectPlan,
  isSolving = false,
  onRunOptimization,
  onCancelOptimization,
  onValidateInputs,
  onProceedToResults,
  hasResults = false,
  activePlan = null,
  isDemoMode = true,
}) {
  const plan = activePlan || MOCK_PLANS[selectedPlanId] || MOCK_PLANS['PLAN-ALPHA'];
  const isSolved = hasResults && !!activePlan;

  return (
    <div className="space-y-4">
      <Card
        title="Optimization Solver Engine & Execution Control"
        subtitle="Server-side Mixed-Integer Linear Programming (MILP) solver interface"
        badge={<StatusBadge variant="teal" size="xs">STAGE 04</StatusBadge>}
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onValidateInputs}
              disabled={isSolving}
            >
              Audit Inputs
            </Button>

            {isSolving ? (
              <Button
                size="sm"
                variant="danger"
                icon={StopCircle}
                onClick={onCancelOptimization}
              >
                Cancel Execution
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                icon={Play}
                onClick={onRunOptimization}
              >
                {isSolved ? 'Re-run Optimization' : 'Run Optimization'}
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {/* Plan Comparison Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-navy-primary uppercase tracking-wider font-mono">
                {isDemoMode ? 'Benchmark Plan Profiles (Demonstration Models)' : 'Model Objective Formulation Presets'}
              </span>
              <span className="text-[10px] text-text-secondary font-mono">
                HiGHS Multi-Objective Frontier
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'PLAN-ALPHA',
                  name: 'Plan Alpha: Balanced Multi-Objective',
                  desc: 'Optimal compromise: Max Welfare + 100% Critical Coverage + Fair Equity.',
                  score: '94.62',
                  coverage: '86.5%',
                  critical: '100%',
                  badge: 'RECOMMENDED',
                  variant: 'teal',
                },
                {
                  id: 'PLAN-BETA',
                  name: 'Plan Beta: Highway Speed Push',
                  desc: 'Fastest truck delivery; higher total volume, but leaves 1 remote island unserved.',
                  score: '81.30',
                  coverage: '91.9%',
                  critical: '75%',
                  badge: 'SPEED FIRST',
                  variant: 'warning',
                },
                {
                  id: 'PLAN-GAMMA',
                  name: 'Plan Gamma: High Reserve Retention',
                  desc: 'Retains 25% safety reserve buffers at central depots for sudden Category 3 cyclone upgrade.',
                  score: '78.40',
                  coverage: '66.9%',
                  critical: '100%',
                  badge: 'CONSERVATIVE',
                  variant: 'neutral',
                },
              ].map((p) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectPlan?.(p.id)}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-all text-xs flex flex-col justify-between
                      ${isSelected
                        ? 'bg-brand-surface border-navy-primary ring-2 ring-navy-primary/20 shadow-md'
                        : 'bg-white border-brand-border hover:border-teal'
                      }
                    `}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-[11px] text-navy-primary">{p.id}</span>
                        <StatusBadge variant={p.variant} size="xs">{p.badge}</StatusBadge>
                      </div>

                      <div className="font-bold text-text-primary text-xs leading-snug mb-1">
                        {p.name}
                      </div>

                      <p className="text-[11px] text-text-secondary leading-snug mb-3">
                        {p.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-brand-border-light grid grid-cols-3 gap-1 text-center font-mono">
                      <div className="p-1 rounded bg-brand-bg">
                        <span className="text-[9px] text-text-secondary block">Welfare</span>
                        <span className="font-bold text-teal text-[11px]">{p.score}</span>
                      </div>
                      <div className="p-1 rounded bg-brand-bg">
                        <span className="text-[9px] text-text-secondary block">Coverage</span>
                        <span className="font-bold text-navy-primary text-[11px]">{p.coverage}</span>
                      </div>
                      <div className="p-1 rounded bg-brand-bg">
                        <span className="text-[9px] text-text-secondary block">Critical</span>
                        <span className={`font-bold text-[11px] ${p.critical === '100%' ? 'text-status-success' : 'text-status-critical'}`}>
                          {p.critical}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solver Diagnostics Strip */}
          <div className="p-3.5 bg-brand-bg border border-brand-border rounded-lg text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy-primary text-[11px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-teal" />
                Solver Telemetry &amp; Mathematical Diagnostics
              </span>
              <StatusBadge
                variant={
                  plan.feasibility === 'INFEASIBLE'
                    ? 'critical'
                    : isSolved
                    ? 'success'
                    : 'neutral'
                }
                size="xs"
              >
                {plan.feasibility === 'INFEASIBLE'
                  ? 'INFEASIBLE'
                  : isSolved
                  ? plan.solverStatus || 'SOLVED'
                  : 'UNSOLVED (Pending Optimization)'}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-white border border-brand-border-light">
                <span className="text-[10px] text-text-secondary block">Solver Engine:</span>
                <strong className="text-navy-primary truncate block">
                  {plan.solverName || (isDemoMode ? 'HiGHS MILP (Demo)' : 'External Python HiGHS')}
                </strong>
              </div>
              <div className="p-2 rounded bg-white border border-brand-border-light">
                <span className="text-[10px] text-text-secondary block">Runtime:</span>
                <strong className="text-teal font-bold">
                  {isSolved && plan.runtimeSeconds !== undefined ? `${plan.runtimeSeconds}s` : '—'}
                </strong>
              </div>
              <div className="p-2 rounded bg-white border border-brand-border-light">
                <span className="text-[10px] text-text-secondary block">Optimality Gap:</span>
                <strong className="text-status-success font-bold">
                  {isSolved && plan.optimalityGapPct !== undefined ? `${plan.optimalityGapPct}%` : '—'}
                </strong>
              </div>
              <div className="p-2 rounded bg-white border border-brand-border-light">
                <span className="text-[10px] text-text-secondary block">Objective Value:</span>
                <strong className="text-navy-primary font-bold">
                  {isSolved && plan.objectiveValue !== undefined ? plan.objectiveValue : '—'}
                </strong>
              </div>
              <div className="p-2 rounded bg-white border border-brand-border-light">
                <span className="text-[10px] text-text-secondary block">Gini Equity:</span>
                <strong className="text-status-success font-bold">
                  {isSolved && plan.giniCoefficient !== undefined ? `${plan.giniCoefficient} (Fair)` : '—'}
                </strong>
              </div>
            </div>

            {/* Binding Constraints Summary */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-text-secondary">
                Active Binding Constraints in this Solve:
              </span>
              <div className="space-y-1 text-[11px] text-text-primary">
                {plan.constraintDiagnostics?.bindingConstraints?.length > 0 ? (
                  plan.constraintDiagnostics.bindingConstraints.map((bc, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-white border border-brand-border-light flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-status-warning shrink-0" />
                      <span>{bc}</span>
                    </div>
                  ))
                ) : isSolved ? (
                  <div className="p-1.5 rounded bg-white border border-brand-border-light text-text-secondary text-[11px]">
                    No binding bottlenecks constraining the optimal objective value.
                  </div>
                ) : (
                  <div className="p-1.5 rounded bg-white border border-dashed border-brand-border-light text-text-secondary text-[11px]">
                    Binding constraints and dual values will populate once the solver executes.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-between pt-2 border-t border-brand-border">
            <span className="text-xs text-text-secondary font-mono">
              {isDemoMode
                ? 'SIMULATED SOLVER BENCHMARK • DEMO MODE'
                : 'LIVE MILP BACKEND • VERIFIED SOLVER PIPELINE'}
            </span>
            <Button
              size="sm"
              variant={isSolved ? 'primary' : 'secondary'}
              onClick={onProceedToResults}
              disabled={!isSolved}
            >
              {isSolved ? 'Examine Results & Analytics →' : 'Run Optimization to Produce Results'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
