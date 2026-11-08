import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Scale,
  ShieldAlert,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, CHART_THEME } from '../../../components/charts/index.js';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { RECOVERY_ANALYTICS } from '../data/recoveryData.js';

/**
 * Area 8: Advanced Stochastic & Recovery Analytics Suite
 * Implements all 8 required charts:
 * A. Strategy comparison bar chart
 * B. Monte Carlo outcome distribution (500 runs)
 * C. Recovery-time distribution (quantiles in hours)
 * D. Shortage distribution by beneficiary group
 * E. CVaR comparison (95% worst case)
 * F. Scenario performance comparison
 * G. Recovery timeline restoration curve (0h to 72h)
 * H. Resource utilization after recovery
 */
export function AdvancedRecoveryAnalytics({ analytics = RECOVERY_ANALYTICS }) {
  const {
    strategyComparison = [],
    monteCarloDistribution = [],
    recoveryTimeDistribution = [],
    shortageDistribution = [],
    cvarComparison = [],
    scenarioComparison = [],
    recoveryTimeline = [],
    resourceUtilizationAfterRecovery = [],
  } = analytics;

  return (
    <div className="space-y-4">
      {/* Row 1: A. Strategy comparison, B. Monte Carlo distribution, G. Recovery Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* A. Strategy Comparison Bar Chart */}
        <ChartContainer
          title="A. Strategy Performance Index Comparison"
          subtitle="Critical coverage, equity, and restoration speed index"
          height={220}
          isEmpty={!strategyComparison || strategyComparison.length === 0}
          emptyMessage="Run the simulation to generate strategy comparison data."
        >
          <BarChart data={strategyComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="metric" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} domain={[0, 100]} />
            <RechartsTooltip content={<ChartTooltip unit="%" />} />
            <Bar dataKey="disrupted" name="Disrupted (No Action)" fill={CHART_THEME.colors.critical} radius={[3, 3, 0, 0]} />
            <Bar dataKey="stratAlpha" name="Strat Alpha (Recommended)" fill={CHART_THEME.colors.teal} radius={[3, 3, 0, 0]} />
            <Bar dataKey="stratBeta" name="Strat Beta (Detour)" fill={CHART_THEME.colors.steelBlue} radius={[3, 3, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </BarChart>
        </ChartContainer>

        {/* B. Monte Carlo Outcome Distribution */}
        <ChartContainer
          title="B. Monte Carlo Service Level Distribution"
          subtitle="Histogram of fulfilled service levels across 500 stochastic runs"
          height={220}
          isEmpty={!monteCarloDistribution || monteCarloDistribution.length === 0}
          emptyMessage="Run the simulation to generate Monte Carlo distribution data."
        >
          <BarChart data={monteCarloDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="bin" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="runs" />} />
            <Bar dataKey="runsDisrupted" name="Disrupted Baseline" fill={CHART_THEME.colors.critical} radius={[3, 3, 0, 0]} />
            <Bar dataKey="runsAlpha" name="Strat Alpha (Barge/Air)" fill={CHART_THEME.colors.teal} radius={[3, 3, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </BarChart>
        </ChartContainer>

        {/* G. Recovery Timeline Progression */}
        <ChartContainer
          title="G. Hourly Restoration Timeline Progression"
          subtitle="Service level trajectory from Hour 0 to Hour 72 post-disruption"
          height={220}
          isEmpty={!recoveryTimeline || recoveryTimeline.length === 0}
          emptyMessage="Run the simulation to generate recovery timeline data."
        >
          <LineChart data={recoveryTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="hour" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} domain={[0, 100]} />
            <RechartsTooltip content={<ChartTooltip unit="%" />} />
            <Line type="monotone" dataKey="disrupted" name="Disrupted (No Action)" stroke={CHART_THEME.colors.critical} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="stratAlpha" name="Strat Alpha" stroke={CHART_THEME.colors.teal} strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="stratBeta" name="Strat Beta" stroke={CHART_THEME.colors.steelBlue} strokeWidth={1.5} strokeDasharray="3 3" />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </LineChart>
        </ChartContainer>
      </div>

      {/* Row 2: C. Recovery-time distribution, D. Shortage distribution, E. CVaR comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* C. Recovery-Time Distribution (Box Plot Data Table) */}
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
              <span className="text-card-title text-text-primary">C. Recovery-Time Quantiles (Hours)</span>
              <StatusBadge variant="teal" size="xs">STOCHASTIC SIM</StatusBadge>
            </div>

            <p className="text-xs text-text-secondary mb-3">
              Quartile breakdown ($Q_1$, Median, $Q_3$) of time required to restore supply under weather variance.
            </p>

            <div className="space-y-2">
              {recoveryTimeDistribution.map((item) => (
                <div key={item.strategy} className="p-2 rounded bg-brand-bg border border-brand-border text-xs space-y-1">
                  <div className="flex justify-between font-bold text-navy-primary">
                    <span>{item.strategy}</span>
                    <span className="font-mono text-teal">Median: {item.median}h</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-text-secondary font-mono">
                    <span>Min: {item.min}h</span>
                    <span>Q1: {item.q1}h</span>
                    <span>Q3: {item.q3}h</span>
                    <span>Max: {item.max}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-brand-border-light text-[10px] text-text-secondary font-mono flex justify-between">
            <span>DISTRIBUTION: 500 RUNS</span>
            <span className="text-teal font-semibold">ALPHA FASTEST (14.5h)</span>
          </div>
        </div>

        {/* D. Shortage Distribution by Beneficiary Group */}
        <ChartContainer
          title="D. Shortage Reduction by Beneficiary Group"
          subtitle="Disrupted deficit vs residual deficit after Strategy Alpha"
          height={220}
          isEmpty={!shortageDistribution || shortageDistribution.length === 0}
          emptyMessage="Run the simulation to generate shortage distribution data."
        >
          <BarChart data={shortageDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="group" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="units" />} />
            <Bar dataKey="disruptedShortage" name="Disrupted Shortage" fill={CHART_THEME.colors.critical} radius={[3, 3, 0, 0]} />
            <Bar dataKey="recoveredShortage" name="Residual Shortage (Alpha)" fill={CHART_THEME.colors.teal} radius={[3, 3, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </BarChart>
        </ChartContainer>

        {/* E. CVaR (Conditional Value-at-Risk at 95% Confidence Level) */}
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
              <span className="text-card-title text-text-primary">E. Risk Evaluation: CVaR (95%)</span>
              <StatusBadge variant="critical" size="xs">TAIL RISK</StatusBadge>
            </div>

            <p className="text-xs text-text-secondary mb-3">
              Conditional Value-at-Risk quantifying expected shortage in the worst 5% of stochastic disruption scenarios.
            </p>

            <div className="space-y-2">
              {cvarComparison.map((c) => (
                <div key={c.strategy} className="p-2 rounded bg-brand-bg border border-brand-border text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-navy-primary block">{c.strategy}</span>
                    <span className="text-[10px] text-text-secondary font-mono">
                      Expected Loss: {new Intl.NumberFormat().format(c.expectedLoss)} units
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-status-critical block text-xs">
                      CVaR: {new Intl.NumberFormat().format(c.cvar95)}
                    </span>
                    <StatusBadge
                      variant={c.riskTier === 'LOW_RISK' ? 'success' : c.riskTier === 'MEDIUM_RISK' ? 'warning' : 'critical'}
                      size="xs"
                    >
                      {c.riskTier}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-brand-border-light text-[10px] text-text-secondary font-mono flex justify-between">
            <span>CONFIDENCE LEVEL: 95%</span>
            <span className="text-status-success font-bold">ALPHA MINIMIZES TAIL RISK</span>
          </div>
        </div>
      </div>

      {/* Row 3: F. Scenario Performance Comparison & H. Post-Recovery Resource Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* F. Scenario Performance Comparison */}
        <Card
          title="F. Cross-Disruption Scenario Robustness Comparison"
          subtitle="How Strategy Alpha performs across Flood, Armed Conflict, and Pandemic events"
          badge={<StatusBadge variant="teal" size="xs">CROSS-SCENARIO</StatusBadge>}
          noPadding
        >
          <div className="p-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-text-secondary font-mono text-[11px]">
                  <th className="pb-2 font-semibold">Disruption Scenario</th>
                  <th className="pb-2 font-semibold text-right">Demand Coverage</th>
                  <th className="pb-2 font-semibold text-right">Restoration Time</th>
                  <th className="pb-2 font-semibold text-right">Operating Cost (USD)</th>
                  <th className="pb-2 font-semibold text-center">Robustness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-light">
                {scenarioComparison.map((row) => (
                  <tr key={row.scenario} className="hover:bg-brand-bg/60">
                    <td className="py-2.5 font-bold text-navy-primary">{row.scenario}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-teal">{row.demandCoverage}%</td>
                    <td className="py-2.5 text-right font-mono">{row.recoveryHours}h</td>
                    <td className="py-2.5 text-right font-mono">${new Intl.NumberFormat().format(row.costUSD)}</td>
                    <td className="py-2.5 text-center">
                      <StatusBadge variant="success" size="xs">ROBUST</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* H. Resource Utilization After Recovery */}
        <Card
          title="H. Post-Recovery Staging &amp; Fleet Asset Utilization"
          subtitle="Capacity loading on warehouses, barges, helicopters, and truck fleets following recovery"
          badge={<StatusBadge variant="teal" size="xs">RESOURCE USAGE</StatusBadge>}
          noPadding
        >
          <div className="p-4 space-y-3 text-xs">
            {resourceUtilizationAfterRecovery.map((res) => (
              <div key={res.asset} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-navy-primary">{res.asset}</span>
                  <span className="font-mono text-text-secondary text-[11px]">
                    Before: {res.before}% → <strong className="text-teal font-bold">After: {res.after}%</strong>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-steel-light overflow-hidden">
                  <div
                    className="h-full bg-teal rounded-full transition-all duration-300"
                    style={{ width: `${res.after}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
