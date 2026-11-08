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
  CheckCircle2,
  AlertTriangle,
  Clock,
  Thermometer,
  Droplets,
  Package,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, CHART_THEME } from '../../../components/charts/index.js';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';

export function CommodityAnalytics({
  activeCommodity,
  foodAnalytics,
  waterAnalytics,
  medicalAnalytics,
}) {
  // --- 1. FOOD ANALYTICS SUITE ---
  if (activeCommodity === 'FOOD') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Food Stock by Category */}
        <ChartContainer
          title="Food Stock by Category"
          subtitle="Stockpile breakdown across nutritional categories"
          height={200}
        >
          <BarChart data={foodAnalytics.categories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="name" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="pkts" />} />
            <Bar dataKey="count" name="Stockpile (Packets)" fill={CHART_THEME.colors.navySecondary} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>

        {/* Expiry Distribution */}
        <ChartContainer
          title="Shelf-Life Expiry Distribution"
          subtitle="Batches grouped by days until expiration"
          height={200}
        >
          <BarChart data={foodAnalytics.expiryDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="range" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="pkts" />} />
            <Bar dataKey="count" name="Volume (Packets)">
              {foodAnalytics.expiryDistribution.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Inbound vs Outbound Velocity & FEFO Compliance */}
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
              <span className="text-card-title text-text-primary">FEFO Operational Compliance</span>
              <StatusBadge variant="success" size="xs">TARGET: 95%</StatusBadge>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-kpi font-bold text-teal font-mono">
                {foodAnalytics.fefoCompliancePct}%
              </span>
              <span className="text-xs text-status-success font-medium">Compliance Rate</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              98.4% of dispatches in the last 7 days honored First-Expiry, First-Out sequence, minimizing shelf-life loss.
            </p>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-text-secondary block">
                Warehouse Staging Capacity (m³)
              </span>
              {foodAnalytics.facilityStorageM3.map((f) => {
                const pct = Math.round((f.utilized / f.capacity) * 100);
                return (
                  <div key={f.facility} className="space-y-1">
                    <div className="flex justify-between text-[11px] text-text-primary">
                      <span>{f.facility}</span>
                      <span className="font-mono">{f.utilized} / {f.capacity} m³ ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-steel-light overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct > 85 ? 'bg-status-warning' : 'bg-teal'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-brand-border-light text-[10px] text-text-secondary flex justify-between">
            <span>AUDIT CYCLE: WEEKLY</span>
            <span className="font-mono">DEPOT CODE: CSD-01</span>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. WATER ANALYTICS SUITE ---
  if (activeCommodity === 'WATER') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Potable vs Pending QC Callout */}
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
              <span className="text-card-title text-text-primary">Water Potability Verification</span>
              <StatusBadge variant="teal" size="xs">WHO STANDARD</StatusBadge>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-status-success-bg border border-status-success-border">
                <span className="text-[10px] font-mono text-status-success uppercase font-bold block">
                  1. Confirmed Potable Water
                </span>
                <span className="text-kpi font-bold text-status-success font-mono">
                  {new Intl.NumberFormat().format(waterAnalytics.verifiedPotableCount)}
                </span>
                <span className="text-xs text-text-secondary ml-1.5">containers (10L) verified safe</span>
              </div>

              <div className="p-3 rounded-lg bg-status-warning-bg border border-status-warning-border">
                <span className="text-[10px] font-mono text-status-warning uppercase font-bold block">
                  2. Awaiting Quality Verification (Locked)
                </span>
                <span className="text-kpi font-bold text-status-warning font-mono">
                  {new Intl.NumberFormat().format(waterAnalytics.awaitingQcCount)}
                </span>
                <span className="text-xs text-text-secondary ml-1.5">liters bulk intake in testing</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-brand-border-light text-[11px] text-text-secondary">
            <strong>Restriction:</strong> Unverified bulk intake water cannot be dispatched until residual chlorine and turbidity tests pass.
          </div>
        </div>

        {/* Quality Status Breakdown (Donut) */}
        <ChartContainer
          title="Water Quality Test Status"
          subtitle="Tested volume proportion"
          height={200}
        >
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={waterAnalytics.qualityStatusBreakdown}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={70}
              paddingAngle={4}
            >
              {waterAnalytics.qualityStatusBreakdown.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip content={<ChartTooltip unit="%" />} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </PieChart>
        </ChartContainer>

        {/* Water Distribution Trend */}
        <ChartContainer
          title="5-Day Potable Water Distribution"
          subtitle="Packaged 10L containers dispatched to clusters"
          height={200}
        >
          <AreaChart data={waterAnalytics.distributionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_THEME.colors.teal} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_THEME.colors.teal} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="date" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="containers" />} />
            <Area type="monotone" dataKey="delivered" name="Containers Issued" stroke={CHART_THEME.colors.teal} strokeWidth={2} fill="url(#waterGrad)" />
          </AreaChart>
        </ChartContainer>
      </div>
    );
  }

  // --- 3. MEDICAL ANALYTICS SUITE ---
  if (activeCommodity === 'MEDICAL') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Cold Chain Compliance Gauge */}
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
              <span className="text-card-title text-text-primary">Cold-Chain Compliance</span>
              <StatusBadge variant="teal" size="xs">+2°C TO +8°C</StatusBadge>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-kpi font-bold text-teal font-mono">
                {medicalAnalytics.coldChainCompliancePct}%
              </span>
              <span className="text-xs text-status-success font-medium">Compliance Rate</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              Continuous wireless data-logger tracking across refrigerated storage rooms and passive cold boxes.
            </p>

            {/* Cold storage capacity */}
            <div className="p-2.5 bg-brand-bg border border-brand-border rounded-md text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-text-secondary">Cold Room Storage:</span>
                <span className="font-mono font-bold text-navy-primary">
                  {medicalAnalytics.coldStorageCapacityM3.utilized} / {medicalAnalytics.coldStorageCapacityM3.total} m³ ({medicalAnalytics.coldStorageCapacityM3.utilizationPct}%)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-steel-light overflow-hidden">
                <div className="h-full bg-teal rounded-full" style={{ width: `${medicalAnalytics.coldStorageCapacityM3.utilizationPct}%` }} />
              </div>
            </div>
          </div>

          {/* Temperature Excursion Alert */}
          <div className="mt-3 pt-2.5 border-t border-brand-border-light">
            <div className="p-2 rounded bg-status-critical-bg border border-status-critical-border flex items-center justify-between text-xs text-status-critical">
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 shrink-0" />
                <span><strong>1 Temperature Excursion Flagged:</strong> Batch #23880 Locked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Expiry Distribution */}
        <ChartContainer
          title="Medicine Shelf-Life Distribution"
          subtitle="Vials and treatment packs by expiration window"
          height={200}
        >
          <BarChart data={medicalAnalytics.expiryDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="range" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="items" />} />
            <Bar dataKey="count" name="Medical Items">
              {medicalAnalytics.expiryDistribution.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Quarantined Medical Inventory Log */}
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
              <span className="text-card-title text-status-critical flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Quarantined Medical Stock
              </span>
              <StatusBadge variant="critical" size="xs">NON-ISSUABLE</StatusBadge>
            </div>

            <div className="space-y-2">
              {medicalAnalytics.quarantinedLots.map((lot) => (
                <div key={lot.batchId} className="p-2.5 rounded-lg bg-status-critical-bg/40 border border-status-critical-border/50 text-xs space-y-1">
                  <div className="flex justify-between items-baseline font-bold text-navy-primary">
                    <span>{lot.name}</span>
                    <span className="font-mono text-status-critical">{lot.qty} {lot.unit}</span>
                  </div>
                  <div className="text-[10px] font-mono text-text-secondary">Lot: {lot.batchId}</div>
                  <p className="text-[11px] text-text-primary leading-snug">{lot.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-text-secondary font-mono">
            DISPOSAL PROTOCOL: MOH-WASTE-V3
          </div>
        </div>
      </div>
    );
  }

  // --- 4. ALL COMMODITIES MULTI-SECTOR OVERVIEW ---
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Depot Storage Utilization (Food & General M3) */}
      <ChartContainer
        title="Warehouse Staging Volume by Depot"
        subtitle="Current physical capacity utilization (m³)"
        height={200}
      >
        <BarChart data={foodAnalytics.facilityStorageM3} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
          <XAxis dataKey="facility" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
          <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
          <RechartsTooltip content={<ChartTooltip unit="m³" />} />
          <Bar dataKey="utilized" name="Utilized Space (m³)" fill={CHART_THEME.colors.navySecondary} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartContainer>

      {/* Water Potability Quality Breakdown (Donut) */}
      <ChartContainer
        title="Water Quality & Potability Status"
        subtitle="Distribution of tested and pending raw supply"
        height={200}
      >
        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Pie
            data={waterAnalytics.qualityStatusBreakdown}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={46}
            outerRadius={70}
            paddingAngle={4}
          >
            {waterAnalytics.qualityStatusBreakdown.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip content={<ChartTooltip unit="%" />} />
          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
        </PieChart>
      </ChartContainer>

      {/* Cold Chain & Quality Control Compliance Card */}
      <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
            <span className="text-card-title text-text-primary">Quality & Cold-Chain Integrity</span>
            <StatusBadge variant="teal" size="xs">ALL SECTORS</StatusBadge>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 rounded bg-brand-bg border border-brand-border text-xs">
              <div>
                <span className="font-semibold text-text-primary block">FEFO Food Shelf-Life</span>
                <span className="text-[11px] text-text-secondary">Earliest-expiring issued first</span>
              </div>
              <span className="font-mono font-bold text-teal text-sm">{foodAnalytics.fefoCompliancePct}%</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-brand-bg border border-brand-border text-xs">
              <div>
                <span className="font-semibold text-text-primary block">Medical Cold-Chain</span>
                <span className="text-[11px] text-text-secondary">+2°C to +8°C verified compliance</span>
              </div>
              <span className="font-mono font-bold text-status-success text-sm">{medicalAnalytics.coldChainCompliancePct}%</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-brand-bg border border-brand-border text-xs">
              <div>
                <span className="font-semibold text-text-primary block">Potable Water Security</span>
                <span className="text-[11px] text-text-secondary">Strictly verified batches</span>
              </div>
              <span className="font-mono font-bold text-navy-primary text-sm">3,500 10L</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-brand-border-light text-[10px] text-text-secondary flex justify-between">
          <span>OPERATIONAL STANDARD: SPHERE PROJECT</span>
          <span className="font-mono text-status-success">100% AUDIT READY</span>
        </div>
      </div>
    </div>
  );
}
