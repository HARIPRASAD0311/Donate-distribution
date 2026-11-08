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
  ResponsiveContainer,
} from 'recharts';
import {
  Utensils,
  Droplets,
  HeartPulse,
  Users,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, CHART_THEME } from '../../../components/charts/index.js';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';

/**
 * Enterprise Demand Visualizations Suite
 * Implements:
 * B. Commodity demand distribution (Food, Water, Medical separated)
 * C. Beneficiary-group distribution (Vulnerability breakdown)
 * D. Demand priority breakdown (Critical, High, Medium, Normal)
 * E. Demand trends over time (Reported vs Verified vs Fulfilled)
 * F. Regional fulfilment comparison
 */
export function DemandVisualizations({
  commodityDistribution = [],
  beneficiaryGroupDistribution = [],
  priorityBreakdown = [],
  demandTrend = [],
  regionalComparison = [],
}) {
  return (
    <div className="space-y-4">
      {/* Top Visualizations Row: Priority Breakdown + Commodity Distribution + Regional Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* B. Commodity Demand Distribution (Strict Unit Separation) */}
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
              <span className="text-card-title text-text-primary">Commodity Demand Streams</span>
              <StatusBadge variant="teal" size="xs">SEPARATED UNITS</StatusBadge>
            </div>

            <p className="text-xs text-text-secondary mb-3">
              Distress requests segmented by commodity stream to prevent incompatible unit aggregation.
            </p>

            <div className="space-y-3">
              {commodityDistribution.map((item) => {
                const pct = item.totalRequired > 0 ? Math.round((item.fulfilled / item.totalRequired) * 100) : 0;
                let Icon = Utensils;
                let colorClass = 'text-navy-primary';
                if (item.category === 'WATER') {
                  Icon = Droplets;
                  colorClass = 'text-teal';
                } else if (item.category === 'MEDICAL') {
                  Icon = HeartPulse;
                  colorClass = 'text-status-critical';
                }

                return (
                  <div key={item.category} className="p-2.5 rounded-lg bg-brand-bg border border-brand-border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-4 h-4 ${colorClass}`} />
                        <span className="text-xs font-bold text-navy-primary">{item.commodity}</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white text-text-secondary border border-brand-border">
                        {item.verifiedLots} Verified Lots
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-mono font-bold text-navy-primary">
                        {new Intl.NumberFormat().format(item.totalRequired)}{' '}
                        <span className="text-[10px] font-normal text-text-secondary">{item.unit}</span>
                      </span>
                      <span className="text-[11px] font-mono text-status-success font-medium">
                        {pct}% Fulfilled ({new Intl.NumberFormat().format(item.fulfilled)})
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-steel-light overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.category === 'WATER' ? 'bg-teal' : item.category === 'MEDICAL' ? 'bg-navy-secondary' : 'bg-status-success'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-brand-border-light text-[10px] text-text-secondary flex justify-between font-mono">
            <span>RULE: NO CROSS-UNIT SUMS</span>
            <span className="text-status-success">SPHERE COMPLIANT</span>
          </div>
        </div>

        {/* D. Demand Priority Breakdown */}
        <ChartContainer
          title="Demand Priority Breakdown"
          subtitle="Triage urgency based on life-safety impact"
          height={230}
        >
          <BarChart data={priorityBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="label" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="requests" />} />
            <Bar dataKey="count" name="Total Reported" radius={[3, 3, 0, 0]}>
              {priorityBreakdown.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} />
              ))}
            </Bar>
            <Bar dataKey="verifiedCount" name="Verified Eligible" fill={CHART_THEME.colors.navyPrimary} radius={[3, 3, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </BarChart>
        </ChartContainer>

        {/* F. Regional Fulfilment Comparison */}
        <ChartContainer
          title="Regional Fulfilment Comparison"
          subtitle="Verified distress volume vs fulfilled delivery"
          height={230}
        >
          <BarChart data={regionalComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="region" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="units" />} />
            <Bar dataKey="verifiedDemand" name="Verified Demand" fill={CHART_THEME.colors.steelBlue} radius={[3, 3, 0, 0]} />
            <Bar dataKey="fulfilled" name="Delivered Supply" fill={CHART_THEME.colors.teal} radius={[3, 3, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Bottom Visualizations Row: E. Demand Trends + C. Beneficiary Group Vulnerabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* E. Demand Over Time (Reported vs Verified vs Fulfilled) */}
        <ChartContainer
          title="Demand Trajectory Over Time"
          subtitle="Reported field distress vs reconnaissance-verified demand vs fulfilled consignments"
          height={220}
        >
          <AreaChart data={demandTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="reportedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_THEME.colors.steelBlue} stopOpacity={0.25} />
                <stop offset="95%" stopColor={CHART_THEME.colors.steelBlue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="verifiedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_THEME.colors.navyPrimary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_THEME.colors.navyPrimary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fulfilledGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_THEME.colors.teal} stopOpacity={0.35} />
                <stop offset="95%" stopColor={CHART_THEME.colors.teal} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="day" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="items" />} />
            <Area type="monotone" dataKey="reported" name="Reported Distress (Unscreened)" stroke={CHART_THEME.colors.steelBlue} strokeWidth={1.5} strokeDasharray="3 3" fill="url(#reportedGrad)" />
            <Area type="monotone" dataKey="verified" name="Verified Demand" stroke={CHART_THEME.colors.navyPrimary} strokeWidth={2} fill="url(#verifiedGrad)" />
            <Area type="monotone" dataKey="fulfilled" name="Fulfilled Consignments" stroke={CHART_THEME.colors.teal} strokeWidth={2} fill="url(#fulfilledGrad)" />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </AreaChart>
        </ChartContainer>

        {/* C. Beneficiary-Group Demographics & Vulnerability Distribution */}
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
              <span className="text-card-title text-text-primary">
                Beneficiary Groups &amp; Vulnerability Matrix
              </span>
              <StatusBadge variant="neutral" size="xs">AGGREGATED (PRIVACY PRESERVED)</StatusBadge>
            </div>

            <p className="text-xs text-text-secondary mb-3">
              Anonymized population figures with high-risk sub-demographics (under 5s, pregnant/lactating).
            </p>

            <div className="space-y-2 max-h-[155px] overflow-y-auto pr-1">
              {beneficiaryGroupDistribution.map((group) => (
                <div
                  key={group.code}
                  className="p-2 rounded bg-brand-bg border border-brand-border text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-navy-primary flex items-center gap-1.5">
                      <span>{group.name}</span>
                      <span className="text-[10px] font-mono text-text-secondary">({group.region})</span>
                    </div>
                    <div className="text-[11px] text-text-secondary mt-0.5">
                      {group.category}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold font-mono text-navy-primary">
                      {new Intl.NumberFormat().format(group.population)} <span className="text-[10px] font-normal">census</span>
                    </div>
                    <div className="text-[10px] font-mono text-status-warning">
                      ~{new Intl.NumberFormat().format(group.underFiveCount)} children &lt;5
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-brand-border-light text-[10px] text-text-secondary flex justify-between font-mono">
            <span>DATA INTEGRITY: VERIFIED FIELD CENSUS</span>
            <span className="text-teal">NO PII EXPOSURE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
