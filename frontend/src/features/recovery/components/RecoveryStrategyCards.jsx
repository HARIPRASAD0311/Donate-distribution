import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Scale,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { MOCK_RECOVERY_STRATEGIES } from '../data/recoveryData.js';

/**
 * Area 4 & 7: Candidate Recovery Strategy Cards & Trade-Off Comparison
 */
export function RecoveryStrategyCards({
  strategies = MOCK_RECOVERY_STRATEGIES,
  selectedStrategyId = 'STRAT-ALPHA',
  onSelectStrategy,
  onProceedToAnalytics,
  onOpenApproval,
}) {
  return (
    <Card
      title="4 &amp; 7. Candidate Recovery Strategies &amp; Multi-Objective Trade-Offs"
      subtitle="Evaluated Pareto candidates restoring network throughput following external disruption"
      badge={<StatusBadge variant="teal" size="xs">CANDIDATE ACTIONS: A(i)</StatusBadge>}
    >
      <div className="space-y-4">
        {/* Strategy Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strategies.map((strat) => {
            const isSelected = selectedStrategyId === strat.id;

            return (
              <div
                key={strat.id}
                onClick={() => onSelectStrategy?.(strat.id)}
                className={`
                  p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-xs
                  ${isSelected
                    ? 'border-navy-primary bg-brand-surface ring-2 ring-navy-primary/20 shadow-md'
                    : 'border-brand-border bg-white hover:border-teal hover:shadow-subtle'
                  }
                `}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-navy-primary">{strat.id}</span>
                    <div className="flex items-center gap-1">
                      <StatusBadge
                        variant={strat.riskLevel === 'LOW' ? 'success' : strat.riskLevel === 'MEDIUM' ? 'warning' : 'critical'}
                        size="xs"
                      >
                        {strat.riskLevel} RISK
                      </StatusBadge>
                      {strat.isRecommended && (
                        <StatusBadge variant="teal" size="xs">RECOMMENDED</StatusBadge>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-text-primary text-sm mb-1">{strat.name}</h4>
                  <p className="text-[11px] text-text-secondary leading-snug mb-3">{strat.description}</p>

                  {/* Operational Metrics Matrix (All 9 Required Fields) */}
                  <div className="space-y-1.5 p-2.5 rounded-lg bg-brand-bg border border-brand-border-light font-mono text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary font-sans">1. Critical Need Coverage:</span>
                      <strong className={strat.criticalCoveragePct === 100 ? 'text-status-success font-bold' : 'text-status-critical'}>
                        {strat.criticalCoveragePct}%
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary font-sans">2. Remaining Unmet Demand:</span>
                      <strong className="text-navy-primary font-bold">
                        {new Intl.NumberFormat().format(strat.remainingUnmetDemand)} units
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary font-sans">3. Worst Normalized Shortage:</span>
                      <strong className={strat.worstNormalizedShortagePct < 10 ? 'text-status-success' : 'text-status-warning'}>
                        {strat.worstNormalizedShortagePct}%
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary font-sans">4. Service Equity (Gini):</span>
                      <strong className="text-teal font-bold">{strat.serviceEquityGini} (Fair)</strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary font-sans">5. Expected Recovery Time:</span>
                      <strong className="text-navy-primary font-bold">{strat.expectedRecoveryTimeHours}h</strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary font-sans">6. Resource Wastage / Spoilage:</span>
                      <strong className="text-text-secondary">{strat.resourceWastageUnits} units</strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary font-sans">7. Operating Cost (USD):</span>
                      <strong className="text-navy-primary font-bold">
                        ${new Intl.NumberFormat().format(strat.operatingCostUSD)}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary font-sans">8. Mathematical Feasibility:</span>
                      <StatusBadge variant={strat.feasibility === 'FEASIBLE' ? 'success' : 'warning'} size="xs">
                        {strat.feasibility}
                      </StatusBadge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary font-sans">9. Operational Risk Level:</span>
                      <span className="font-sans font-bold text-text-primary">{strat.riskLevel}</span>
                    </div>
                  </div>

                  {/* Actions Applied List */}
                  <div className="mt-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono block">
                      Tactical Recovery Actions:
                    </span>
                    <ul className="space-y-0.5 text-[10px] text-text-primary">
                      {strat.actionsApplied.map((act, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-teal font-bold">•</span>
                          <span className="leading-tight">{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-brand-border-light flex items-center justify-between">
                  <span className="text-[10px] font-mono text-text-secondary">
                    Cost Delta: {strat.costDeltaUSD}
                  </span>
                  <Button
                    size="xs"
                    variant={isSelected ? 'primary' : 'secondary'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStrategy?.(strat.id);
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-brand-border text-xs">
          <span className="text-text-secondary font-mono">
            Candidate strategies evaluated across 500 Monte Carlo simulation runs under uncertainty.
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onProceedToAnalytics}
            >
              View Advanced Analytics (Monte Carlo &amp; CVaR)
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={onOpenApproval}
            >
              Authorize Selected Strategy →
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
