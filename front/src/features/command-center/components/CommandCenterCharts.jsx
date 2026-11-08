import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  Package,
  Layers,
  PieChart as PieIcon,
  Activity,
  Building,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, CHART_THEME } from '../../../components/charts/index.js';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';

export function CommandCenterCharts({
  chartsData,
  onCommodityClick,
  onZoneClick,
}) {
  const {
    commodityAvailability = [],
    regionalCoverage = [],
    criticalDemandDonut = [],
    activityTimeline = [],
    facilityReadiness = [],
  } = chartsData || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
      {/* Chart A: Resource Availability by Commodity (Stacked Bar) */}
      <div className="xl:col-span-2">
        <ChartContainer
          title="Stock Availability vs Deficit"
          height={240}
          isEmpty={!commodityAvailability || commodityAvailability.length === 0}
          emptyMessage="No commodity availability data for the selected incident."
          action={<span className="text-[11px] font-mono text-teal font-bold px-2 py-0.5 rounded bg-teal-light">14,200 UNITS BUFFER</span>}
        >
          <BarChart
            data={commodityAvailability}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onClick={(state) => {
              if (state && state.activePayload) {
                onCommodityClick?.(state.activePayload[0]?.payload);
              }
            }}
          >
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="commodity" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="units" />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
            <Bar dataKey="onHand" name="On-Hand Depot Stock" stackId="a" fill={CHART_THEME.colors.navySecondary} />
            <Bar dataKey="dispatched" name="In Transit" stackId="a" fill={CHART_THEME.colors.teal} />
            <Bar dataKey="unmet" name="Unmet Deficit" stackId="a" fill={CHART_THEME.colors.critical} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Chart B: Regional Demand Coverage (Horizontal Bar) */}
      <div>
        <ChartContainer
          title="Regional Fulfilment Rate"
          height={240}
          isEmpty={!regionalCoverage || regionalCoverage.length === 0}
          emptyMessage="No regional coverage data for the selected incident."
          action={<span className="text-[11px] font-mono text-text-secondary font-bold">78% AVG</span>}
        >
          <BarChart
            data={regionalCoverage}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 30, bottom: 0 }}
            onClick={(state) => {
              if (state && state.activePayload) {
                onZoneClick?.(state.activePayload[0]?.payload);
              }
            }}
          >
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} unit="%" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis dataKey="zone" type="category" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="%" />} />
            <Bar dataKey="coverage" name="Fulfilled %" fill={CHART_THEME.colors.teal} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Chart C: Critical Demand Distribution (Donut Chart) */}
      <div>
        <ChartContainer
          title="Critical Need Deficit"
          height={240}
          isEmpty={!criticalDemandDonut || criticalDemandDonut.length === 0}
          emptyMessage="No critical demand breakdown available."
          action={<span className="text-[11px] font-mono text-status-critical font-bold px-1.5 py-0.5 rounded bg-status-critical-bg">23.2K NEED</span>}
        >
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={criticalDemandDonut}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={76}
              paddingAngle={3}
            >
              {criticalDemandDonut.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip content={<ChartTooltip unit="units" />} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
            />
          </PieChart>
        </ChartContainer>
      </div>

      {/* Chart D: Incident Distress vs Dispatch Activity (Timeline) */}
      <div className="xl:col-span-3">
        <ChartContainer
          title="Distress Requests vs Convoys Dispatched"
          height={220}
          isEmpty={!activityTimeline || activityTimeline.length === 0}
          emptyMessage="No activity timeline data for the selected period."
          action={<span className="text-[11px] font-mono text-status-success font-bold">+18% VELOCITY</span>}
        >
          <AreaChart data={activityTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="distressGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_THEME.colors.critical} stopOpacity={0.25} />
                <stop offset="95%" stopColor={CHART_THEME.colors.critical} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dispatchGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_THEME.colors.teal} stopOpacity={0.25} />
                <stop offset="95%" stopColor={CHART_THEME.colors.teal} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="day" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
            <Area
              type="monotone"
              dataKey="distressCalls"
              name="Incoming Distress Requests"
              stroke={CHART_THEME.colors.critical}
              strokeWidth={2}
              fill="url(#distressGrad)"
            />
            <Area
              type="monotone"
              dataKey="dispatches"
              name="Authorized Dispatches"
              stroke={CHART_THEME.colors.teal}
              strokeWidth={2}
              fill="url(#dispatchGrad)"
            />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Chart E: Facility Readiness & Buffer */}
      <div>
        <div className="h-full bg-white border border-brand-border rounded-lg shadow-subtle p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-brand-border-light">
              <span className="text-card-title text-text-primary text-xs">Depot Buffer</span>
              <StatusBadge variant="success" size="xs">HEALTHY</StatusBadge>
            </div>
            <div className="space-y-2.5">
              {facilityReadiness.map((fac) => (
                <div key={fac.code} className="space-y-1 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-text-primary truncate text-[11px]">{fac.name}</span>
                    <span className="font-mono text-text-secondary text-[10px]">{fac.availableM3} m³</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-steel-light overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        fac.capacityPct > 80 ? 'bg-status-warning' : 'bg-teal'
                      }`}
                      style={{ width: `${fac.capacityPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-brand-border-light text-[10px] text-text-secondary flex items-center justify-between">
            <span>Buffer Free:</span>
            <span className="font-bold text-navy-primary font-mono text-xs">14,250 m³ (78%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
