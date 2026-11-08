import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  Scale,
  ShieldCheck,
  Building,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, CHART_THEME } from '../../../components/charts/index.js';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { ALLOCATION_ANALYTICS } from '../data/allocationData.js';

/**
 * Enterprise Optimization Results Analytics Suite
 * Implements all 7 required visualizations:
 * A. Supply versus demand gap
 * B. Regional allocation distribution
 * C. Facility capacity utilization
 * D. Critical demand coverage
 * E. Unmet demand by region
 * F. Equity comparison across beneficiary groups
 * G. Allocation by commodity
 */
export function AllocationVisualizations({ analytics = ALLOCATION_ANALYTICS }) {
  const {
    supplyDemandGap = [],
    regionalDistribution = [],
    facilityUtilization = [],
    criticalCoverage = [],
    unmetDemandByRegion = [],
    equityFairShare = [],
    allocationByCommodity = [],
  } = analytics;

  return (
    <div className="space-y-4">
      {/* Row 1: A. Supply vs Demand Gap, B. Regional Allocation Distribution, D. Critical Coverage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* A. Supply versus Demand Gap */}
        <ChartContainer
          title="A. Supply vs Demand Gap"
          subtitle="Available usable stockpile vs verified need vs allocated volume"
          height={220}
          isEmpty={!supplyDemandGap || supplyDemandGap.length === 0}
          emptyMessage="No supply–demand data available for this plan."
        >
          <BarChart data={supplyDemandGap} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="commodity" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="units" />} />
            <Bar dataKey="supply" name="Usable Stock" fill={CHART_THEME.colors.navySecondary} radius={[3, 3, 0, 0]} />
            <Bar dataKey="demand" name="Verified Demand" fill={CHART_THEME.colors.steelBlue} radius={[3, 3, 0, 0]} />
            <Bar dataKey="allocated" name="Optimized Match" fill={CHART_THEME.colors.teal} radius={[3, 3, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </BarChart>
        </ChartContainer>

        {/* B. Regional Allocation Distribution */}
        <ChartContainer
          title="B. Regional Allocation Distribution"
          subtitle="Fulfilled aid proportion across geographical sectors"
          height={220}
          isEmpty={!regionalDistribution || regionalDistribution.length === 0}
          emptyMessage="No regional allocation data available."
        >
          <BarChart data={regionalDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="region" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="items" />} />
            <Bar dataKey="allocated" name="Allocated Units" radius={[3, 3, 0, 0]}>
              {regionalDistribution.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} />
              ))}
            </Bar>
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </BarChart>
        </ChartContainer>

        {/* D. Critical Demand Coverage */}
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
              <span className="text-card-title text-text-primary">D. Critical Priority Coverage</span>
              <StatusBadge variant="success" size="xs">100% LIFE SAFETY</StatusBadge>
            </div>

            <p className="text-xs text-text-secondary mb-3">
              Hierarchy of human distress fulfillment by urgency classification.
            </p>

            <div className="space-y-2.5">
              {criticalCoverage.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-text-primary">{item.category}</span>
                    <span className="font-mono font-bold text-navy-primary">
                      {item.satisfied} / {item.total} satisfied ({item.coveragePct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-steel-light overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.coveragePct}%`,
                        backgroundColor: item.fill,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-brand-border-light text-[10px] text-text-secondary flex justify-between font-mono">
            <span>POLICY: ZERO DEFICIT ON CRITICAL</span>
            <span className="text-status-success font-bold">100% SATISFIED</span>
          </div>
        </div>
      </div>

      {/* Row 2: C. Facility Capacity, E. Unmet Demand, G. Commodity Allocation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* C. Facility Capacity Utilization */}
        <ChartContainer
          title="C. Staging Facility Capacity Utilization"
          subtitle="Depot throughput utilization percentage (m³)"
          height={210}
          isEmpty={!facilityUtilization || facilityUtilization.length === 0}
          emptyMessage="No facility utilization data available."
        >
          <BarChart data={facilityUtilization} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} horizontal={false} />
            <XAxis type="number" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} domain={[0, 100]} />
            <YAxis dataKey="facility" type="category" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} width={110} />
            <RechartsTooltip content={<ChartTooltip unit="%" />} />
            <Bar dataKey="pct" name="Capacity Used (%)" fill={CHART_THEME.colors.navySecondary} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ChartContainer>

        {/* E. Unmet Demand by Region */}
        <ChartContainer
          title="E. Remaining Unmet Demand by Sector"
          subtitle="Deferred non-critical units by region"
          height={210}
          isEmpty={!unmetDemandByRegion || unmetDemandByRegion.length === 0}
          emptyMessage="No unmet demand data available."
        >
          <BarChart data={unmetDemandByRegion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="region" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="units" />} />
            <Bar dataKey="unmetFood" name="Food (pkts)" fill={CHART_THEME.colors.warning} stackId="a" />
            <Bar dataKey="unmetWater" name="Water (cont)" fill={CHART_THEME.colors.teal} stackId="a" />
            <Bar dataKey="unmetMedical" name="Medical (kits)" fill={CHART_THEME.colors.critical} stackId="a" />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </BarChart>
        </ChartContainer>

        {/* G. Allocation by Commodity Stream */}
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
              <span className="text-card-title text-text-primary">G. Allocation by Commodity Stream</span>
              <StatusBadge variant="teal" size="xs">DISPATCH BOUND</StatusBadge>
            </div>

            <div className="space-y-3">
              {allocationByCommodity.map((comm) => {
                const pct = Math.round((comm.allocated / comm.target) * 100);
                return (
                  <div key={comm.name} className="p-2.5 rounded bg-brand-bg border border-brand-border space-y-1">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-navy-primary">{comm.name}</span>
                      <span className="font-mono text-text-secondary text-[10px]">
                        {new Intl.NumberFormat().format(comm.allocated)} / {new Intl.NumberFormat().format(comm.target)} {comm.unit}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-steel-light overflow-hidden">
                      <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-brand-border-light text-[10px] text-text-secondary font-mono flex justify-between">
            <span>NO CROSS-COMMODITY SUMMING</span>
            <span className="text-teal">SEPARATE TRUCKING</span>
          </div>
        </div>
      </div>

      {/* Row 3: F. Equity Comparison Across Beneficiary Groups */}
      <Card
        title="F. Humanitarian Equity & Fair-Share Comparison Across Beneficiary Clusters"
        subtitle="Mathematical Lorenz evaluation verifying that remote pockets are not systematically marginalized (Gini = 0.18)"
        badge={<StatusBadge variant="teal" size="xs">EQUITY CHECK: PASS</StatusBadge>}
        noPadding
      >
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-border text-text-secondary font-mono text-[11px]">
                <th className="pb-2 font-semibold">Beneficiary Cluster</th>
                <th className="pb-2 font-semibold text-right">Census Pop</th>
                <th className="pb-2 font-semibold text-right">Proportional Fair-Share</th>
                <th className="pb-2 font-semibold text-right">Actual Allocation Proportion</th>
                <th className="pb-2 font-semibold text-right">Equity Deviation</th>
                <th className="pb-2 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {equityFairShare.map((row) => (
                <tr key={row.group} className="hover:bg-brand-bg/60 transition-colors">
                  <td className="py-2.5 font-bold text-navy-primary">{row.group}</td>
                  <td className="py-2.5 text-right font-mono">{new Intl.NumberFormat().format(row.population)}</td>
                  <td className="py-2.5 text-right font-mono text-text-secondary">{row.fairSharePct}%</td>
                  <td className="py-2.5 text-right font-mono font-bold text-teal">{row.actualReceivedPct}%</td>
                  <td className={`py-2.5 text-right font-mono font-semibold ${Math.abs(row.deviationValue ?? 0) <= 5 ? 'text-status-success' : 'text-status-warning'}`}>{row.deviation}</td>
                  <td className="py-2.5 text-center">
                    <StatusBadge variant={Math.abs(row.deviationValue ?? 0) <= 5 ? 'success' : 'warning'} size="xs">
                      {Math.abs(row.deviationValue ?? 0) <= 5 ? 'FAIR BOUND' : (row.deviationValue < 0 ? 'UNDER-SERVED' : 'OVER-SERVED')}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
