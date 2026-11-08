import React from 'react';
import {
  ArrowRight,
  Plus,
  AlertTriangle,
  Zap,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';

/**
 * Area 4: Mathematical State Transition Visualization
 * Models S(t) + A(i) + E(t) -> S(t+1) -> O(i)
 */
export function StateTransitionDiagram({
  selectedStrategyName = 'Strategy Alpha: River Barge & Aerial Winch',
  activeScenarioName = 'Major Culvert Washout at Km 42',
  expectedOutcomeScore = '94.62 / 100',
  recoveryTimeHours = 14.5,
}) {
  return (
    <Card
      title="Dynamic Operational State Transition Formulation"
      subtitle="Theoretical Markov Decision Formulation: S(t) + A(i) + E(t) → S(t+1) → O(i)"
      badge={<StatusBadge variant="teal" size="xs">THEORETICAL MODEL</StatusBadge>}
      noPadding
    >
      <div className="p-4 bg-brand-surface border-b border-brand-border">
        {/* Horizontal Mathematical Flow */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          {/* 1. Current State S(t) */}
          <div className="p-3 rounded-lg border border-brand-border bg-white space-y-1.5 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-navy-primary bg-brand-bg px-1 rounded">
                S(t)
              </span>
              <StatusBadge variant="teal" size="xs">CURRENT</StatusBadge>
            </div>
            <div className="font-bold text-navy-primary text-xs">Current Operational State</div>
            <p className="text-[10px] text-text-secondary leading-snug">
              Baseline inventory staged, 7 operational facilities, 5 verified open routes.
            </p>
          </div>

          {/* Plus E(t) */}
          <div className="p-3 rounded-lg border border-status-critical-border bg-status-critical-bg/30 space-y-1.5 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-status-critical bg-white px-1 rounded">
                + E(t)
              </span>
              <StatusBadge variant="critical" size="xs">SHOCK</StatusBadge>
            </div>
            <div className="font-bold text-status-critical text-xs">External Disruption</div>
            <p className="text-[10px] text-text-primary leading-snug">
              {activeScenarioName} (-60% transit throughput).
            </p>
          </div>

          {/* Plus A(i) */}
          <div className="p-3 rounded-lg border border-teal/40 bg-teal-light/30 space-y-1.5 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-teal bg-white px-1 rounded">
                + A(i)
              </span>
              <StatusBadge variant="teal" size="xs">ACTION</StatusBadge>
            </div>
            <div className="font-bold text-navy-primary text-xs">Candidate Recovery Action</div>
            <p className="text-[10px] text-text-secondary leading-snug truncate" title={selectedStrategyName}>
              {selectedStrategyName}
            </p>
          </div>

          {/* Arrow -> S(t+1) */}
          <div className="p-3 rounded-lg border border-navy-primary bg-navy-primary text-white space-y-1.5 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-teal-light bg-navy-secondary px-1 rounded">
                → S(t+1)
              </span>
              <StatusBadge variant="neutral" size="xs">RESOLVED</StatusBadge>
            </div>
            <div className="font-bold text-white text-xs">Resulting State</div>
            <p className="text-[10px] text-slate-300 leading-snug">
              Bypass corridors active, air-bridge staging initiated, critical deficit sealed.
            </p>
          </div>

          {/* Evaluated Outcome O(i) */}
          <div className="p-3 rounded-lg border border-status-success-border bg-status-success-bg/40 space-y-1.5 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-status-success bg-white px-1 rounded">
                O(i)
              </span>
              <StatusBadge variant="success" size="xs">OUTCOME</StatusBadge>
            </div>
            <div className="font-bold text-status-success text-xs">Evaluated Welfare Index</div>
            <div className="font-mono text-xs font-bold text-navy-primary">
              Score: {expectedOutcomeScore}
            </div>
            <div className="text-[10px] text-text-secondary font-mono">
              Restoration in ~{recoveryTimeHours}h
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
