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
  LineChart,
  Line,
} from 'recharts';
import {
  History,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, CHART_THEME } from '../../../components/charts/index.js';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { AUDIT_ANALYTICS } from '../data/auditData.js';

/**
 * Enterprise Audit & Compliance Visual Analytics
 * Implements:
 * - Audit activity timeline
 * - Event-category breakdown
 * - User activity
 * - Approval statistics
 * - Data-quality trends
 */
export function AuditVisualAnalytics({ analytics = AUDIT_ANALYTICS }) {
  const {
    activityTimeline = [],
    categoryBreakdown = [],
    userActivity = [],
    approvalStats = [],
    dataQualityTrend = [],
  } = analytics;

  return (
    <div className="space-y-4">
      {/* Row 1: Activity Timeline, Event Categories, Approval Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Audit Activity Timeline */}
        <ChartContainer
          title="Hourly Audit Event Activity"
          subtitle="Frequency of recorded operational operations"
          height={210}
        >
          <AreaChart data={activityTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="auditGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_THEME.colors.teal} stopOpacity={0.35} />
                <stop offset="95%" stopColor={CHART_THEME.colors.teal} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="hour" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="events" />} />
            <Area type="monotone" dataKey="count" name="Logged Events" stroke={CHART_THEME.colors.teal} strokeWidth={2} fill="url(#auditGrad)" />
          </AreaChart>
        </ChartContainer>

        {/* Event-Category Breakdown (Donut) */}
        <ChartContainer
          title="Event Distribution by Module"
          subtitle="Proportion of events logged across ResQNet subsystems"
          height={210}
        >
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={categoryBreakdown}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={68}
              paddingAngle={3}
            >
              {categoryBreakdown.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} />
              ))}
            </Pie>
            <RechartsTooltip content={<ChartTooltip unit="events" />} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </PieChart>
        </ChartContainer>

        {/* Approval Decisions Statistics */}
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 flex flex-col justify-between text-xs">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
              <span className="text-card-title text-text-primary">Human Authorization Breakdown</span>
              <StatusBadge variant="teal" size="xs">GOVERNANCE</StatusBadge>
            </div>

            <div className="space-y-2">
              {approvalStats.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-2 rounded bg-brand-bg border border-brand-border-light">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="font-semibold text-text-primary text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-navy-primary">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-brand-border-light text-[10px] text-text-secondary font-mono flex justify-between">
            <span>AUDIT COMPLIANCE: 100%</span>
            <span className="text-status-success font-bold">ALL SIGNATURES CAPTURED</span>
          </div>
        </div>
      </div>

      {/* Row 2: User Activity & Data-Quality Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Activity Ledger */}
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 text-xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
            <span className="text-card-title text-text-primary">Top Authorized System Actors</span>
            <span className="text-[10px] font-mono text-text-secondary">Role-Based Access Verified</span>
          </div>

          <div className="space-y-2">
            {userActivity.map((u) => (
              <div key={u.user} className="p-2.5 rounded-lg bg-brand-bg border border-brand-border flex items-center justify-between">
                <div>
                  <div className="font-bold text-navy-primary">{u.user}</div>
                  <div className="text-[10px] text-text-secondary font-mono">{u.role}</div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-teal text-sm">{u.events}</span>
                  <span className="text-[10px] text-text-secondary block font-mono">actions logged</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Quality Trend (% Verified Records Over Time) */}
        <ChartContainer
          title="Data Integrity &amp; Ground Verification Trend"
          subtitle="Proportion of humanitarian data verified with auditable ground/satellite evidence"
          height={210}
        >
          <LineChart data={dataQualityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="day" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} domain={[50, 100]} />
            <RechartsTooltip content={<ChartTooltip unit="%" />} />
            <Line type="monotone" dataKey="qualityPct" name="% Verified Records" stroke={CHART_THEME.colors.statusSuccess} strokeWidth={2.5} dot={{ r: 4 }} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
