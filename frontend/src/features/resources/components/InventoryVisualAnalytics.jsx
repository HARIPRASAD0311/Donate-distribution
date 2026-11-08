import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Package,
  ShieldCheck,
  Archive,
  Clock,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Eye,
  Filter,
  Layers,
  Utensils,
  Droplets,
  HeartPulse,
  Building,
  Thermometer,
  Calendar,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, CHART_THEME } from '../../../components/charts/index.js';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import {
  getInventorySummaryMetrics,
  getCategoryDistribution,
  getStockAvailabilityByResource,
  getQualityDistribution,
  getExpiryRiskTimeline,
  getFacilityInventoryAnalysis,
  getResourceVariationAnalysis,
} from '../utils/inventoryAnalyticsUtils.js';

export function InventoryVisualAnalytics({
  items = [],
  selectedFacility = 'ALL',
  selectedCommodity = 'ALL',
  onSelectBatch,
  selectedBatchId,
}) {
  // Interactive drill-down filters (cross-filtering from chart clicks)
  const [drillCategory, setDrillCategory] = useState(null);
  const [drillQuality, setDrillQuality] = useState(null);
  const [drillFacility, setDrillFacility] = useState(null);
  const [drillExpiryTier, setDrillExpiryTier] = useState(null);
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState('ALL');

  // Compute effective filter values
  const activeCategory = drillCategory || (selectedCommodity !== 'ALL' ? selectedCommodity : null);
  const activeFacility = drillFacility || (selectedFacility !== 'ALL' ? selectedFacility : null);

  // Apply drill-down filters to the dataset for synchronized analytics
  const filteredBatches = useMemo(() => {
    return items.filter(item => {
      if (activeCategory && String(item.commodity || item.commodityId).toUpperCase() !== activeCategory.toUpperCase()) {
        return false;
      }
      if (activeFacility && item.facilityId !== activeFacility) {
        return false;
      }
      if (drillQuality) {
        if (drillQuality === 'EXPIRED') {
          if (item.qualityStatus !== 'EXPIRED' && (item.daysToExpiry === null || item.daysToExpiry > 0)) {
            return false;
          }
        } else if (item.qualityStatus !== drillQuality) {
          return false;
        }
      }
      if (drillExpiryTier) {
        const days = item.daysToExpiry;
        if (drillExpiryTier === 'EXPIRED' && (days === null || days > 0)) return false;
        if (drillExpiryTier === 'CRITICAL_7D' && (days === null || days <= 0 || days > 7)) return false;
        if (drillExpiryTier === 'URGENT_30D' && (days === null || days <= 7 || days > 30)) return false;
        if (drillExpiryTier === 'MEDIUM_90D' && (days === null || days <= 30 || days > 90)) return false;
        if (drillExpiryTier === 'STABLE' && (days === null || days <= 90)) return false;
        if (drillExpiryTier === 'UNKNOWN' && (days !== null && item.expiryDate)) return false;
      }
      return true;
    });
  }, [items, activeCategory, activeFacility, drillQuality, drillExpiryTier]);

  // Derived analytical models
  const summaryMetrics = useMemo(() => getInventorySummaryMetrics(filteredBatches), [filteredBatches]);
  const categoryDist = useMemo(() => getCategoryDistribution(filteredBatches), [filteredBatches]);
  const stockAvailability = useMemo(() => getStockAvailabilityByResource(filteredBatches), [filteredBatches]);
  const qualityDist = useMemo(() => getQualityDistribution(filteredBatches), [filteredBatches]);
  const expiryTimeline = useMemo(() => getExpiryRiskTimeline(filteredBatches), [filteredBatches]);
  const facilityAnalysis = useMemo(() => getFacilityInventoryAnalysis(filteredBatches), [filteredBatches]);
  const resourceVariation = useMemo(
    () => getResourceVariationAnalysis(filteredBatches, resourceCategoryFilter),
    [filteredBatches, resourceCategoryFilter]
  );

  const hasActiveFilters = Boolean(
    drillCategory || drillQuality || drillFacility || drillExpiryTier
  );

  const resetDrillFilters = () => {
    setDrillCategory(null);
    setDrillQuality(null);
    setDrillFacility(null);
    setDrillExpiryTier(null);
  };

  return (
    <div className="space-y-6">
      {/* Interactive Active Filters Chip Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-brand-surface border border-teal/30 rounded-lg text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-navy-primary flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-teal" />
              Active Analytics Filters:
            </span>

            {drillCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal border border-teal/30 font-medium">
                Category: {drillCategory}
                <button
                  type="button"
                  onClick={() => setDrillCategory(null)}
                  className="hover:text-status-critical ml-1 text-xs"
                >
                  ×
                </button>
              </span>
            )}

            {drillQuality && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                Quality: {drillQuality}
                <button
                  type="button"
                  onClick={() => setDrillQuality(null)}
                  className="hover:text-status-critical ml-1 text-xs"
                >
                  ×
                </button>
              </span>
            )}

            {drillFacility && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-navy-primary border border-slate-300 font-medium">
                Facility: {drillFacility}
                <button
                  type="button"
                  onClick={() => setDrillFacility(null)}
                  className="hover:text-status-critical ml-1 text-xs"
                >
                  ×
                </button>
              </span>
            )}

            {drillExpiryTier && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-status-critical border border-rose-200 font-medium">
                Expiry: {drillExpiryTier}
                <button
                  type="button"
                  onClick={() => setDrillExpiryTier(null)}
                  className="hover:text-status-critical ml-1 text-xs"
                >
                  ×
                </button>
              </span>
            )}

            <span className="text-text-secondary text-[11px] ml-1">
              ({filteredBatches.length} matching batches)
            </span>
          </div>

          <Button
            size="xs"
            variant="ghost"
            icon={RotateCcw}
            onClick={resetDrillFilters}
            className="text-text-secondary hover:text-navy-primary"
          >
            Clear Analytics Filters
          </Button>
        </div>
      )}

      {/* PHASE 3 - A: Inventory Summary (Four Compact KPI Cards + Indicator Badges) */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Card 1: Total Physical Stock */}
          <div className="bg-white border border-brand-border rounded-lg p-4 shadow-subtle border-l-4 border-l-steel flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                  Total Physical Stock
                </span>
                <div className="p-1.5 rounded bg-slate-100 text-slate-700">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-navy-primary text-tabular">
                  {summaryMetrics.totalItemCount}
                </span>
                <span className="text-xs font-medium text-text-secondary">active batches</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-brand-border-light space-y-1 text-[11px]">
              {summaryMetrics.physicalByUnit.slice(0, 3).map((u, i) => (
                <div key={i} className="flex items-center justify-between text-text-secondary">
                  <span>{u.commodity}:</span>
                  <span className="font-semibold text-text-primary text-tabular">
                    {new Intl.NumberFormat().format(u.quantity)} {u.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Usable Stock */}
          <div className="bg-white border border-brand-border rounded-lg p-4 shadow-subtle border-l-4 border-l-status-success flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                  Usable Verified Stock
                </span>
                <div className="p-1.5 rounded bg-emerald-50 text-status-success">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-status-success text-tabular">
                  {summaryMetrics.usableLotsCount}
                </span>
                <span className="text-xs font-medium text-text-secondary">lots QC cleared</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-brand-border-light space-y-1 text-[11px]">
              {summaryMetrics.usableByUnit.slice(0, 3).map((u, i) => (
                <div key={i} className="flex items-center justify-between text-text-secondary">
                  <span>{u.commodity}:</span>
                  <span className="font-semibold text-status-success text-tabular">
                    {new Intl.NumberFormat().format(u.quantity)} {u.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Reserved Stock */}
          <div className="bg-white border border-brand-border rounded-lg p-4 shadow-subtle border-l-4 border-l-teal flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                  Reserved Allocations
                </span>
                <div className="p-1.5 rounded bg-teal-50 text-teal">
                  <Archive className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-teal text-tabular">
                  {summaryMetrics.reservedLotsCount}
                </span>
                <span className="text-xs font-medium text-text-secondary">committed batches</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-brand-border-light space-y-1 text-[11px]">
              {summaryMetrics.reservedByUnit.length > 0 ? (
                summaryMetrics.reservedByUnit.slice(0, 3).map((u, i) => (
                  <div key={i} className="flex items-center justify-between text-text-secondary">
                    <span>{u.commodity}:</span>
                    <span className="font-semibold text-teal text-tabular">
                      {new Intl.NumberFormat().format(u.quantity)} {u.unit}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-text-muted italic block">0 units held in reservation</span>
              )}
            </div>
          </div>

          {/* Card 4: Pending Quality Review */}
          <div className="bg-white border border-brand-border rounded-lg p-4 shadow-subtle border-l-4 border-l-status-warning flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                  Pending Quality Review
                </span>
                <div className="p-1.5 rounded bg-amber-50 text-status-warning">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-status-warning text-tabular">
                  {summaryMetrics.pendingLotsCount}
                </span>
                <span className="text-xs font-medium text-text-secondary">batches in QC lab</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-brand-border-light space-y-1 text-[11px]">
              {summaryMetrics.pendingByUnit.length > 0 ? (
                summaryMetrics.pendingByUnit.slice(0, 3).map((u, i) => (
                  <div key={i} className="flex items-center justify-between text-text-secondary">
                    <span>{u.commodity}:</span>
                    <span className="font-semibold text-status-warning text-tabular">
                      {new Intl.NumberFormat().format(u.quantity)} {u.unit}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-text-muted italic block">All batches QC processed</span>
              )}
            </div>
          </div>
        </div>

        {/* Quality & Expiry Indicator Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mr-1">
            Risk & Restriction Flags:
          </span>

          <button
            type="button"
            onClick={() => setDrillQuality(drillQuality === 'QUARANTINED' ? null : 'QUARANTINED')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
              drillQuality === 'QUARANTINED'
                ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Quarantined: {summaryMetrics.quarantinedLotsCount} lots</span>
          </button>

          <button
            type="button"
            onClick={() => setDrillExpiryTier(drillExpiryTier === 'EXPIRED' ? null : 'EXPIRED')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
              drillExpiryTier === 'EXPIRED'
                ? 'bg-red-700 text-white border-red-800 shadow-xs'
                : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Expired: {summaryMetrics.expiredLotsCount} lots</span>
          </button>

          <button
            type="button"
            onClick={() => setDrillExpiryTier(drillExpiryTier === 'URGENT_30D' ? null : 'URGENT_30D')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
              drillExpiryTier === 'URGENT_30D'
                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Expiring &le; 30d: {summaryMetrics.expiringSoonLotsCount} lots</span>
          </button>
        </div>
      </div>

      {/* PHASE 3 - B & D: Category Distribution and Quality Analysis Donut Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* B. Inventory Category Distribution */}
        <ChartContainer
          title="Inventory Category Distribution"
          subtitle="Lot allocation across Food, Water, and Medical commodities (click to filter)"
          height={240}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
            <div className="w-full sm:w-1/2 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDist}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    onClick={(entry) => setDrillCategory(drillCategory === entry.category ? null : entry.category)}
                    cursor="pointer"
                  >
                    {categoryDist.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={drillCategory === entry.category ? '#142B43' : '#fff'}
                        strokeWidth={drillCategory === entry.category ? 3 : 1}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-brand-border rounded-lg shadow-dropdown p-2.5 text-xs z-50">
                          <span className="font-bold text-navy-primary block">{data.label}</span>
                          <span className="text-text-secondary block mt-0.5">
                            {data.count} batches ({data.percentage}%)
                          </span>
                          <div className="mt-1.5 pt-1 border-t border-brand-border-light space-y-0.5 text-[11px]">
                            {data.units.map((u, i) => (
                              <div key={i} className="text-text-primary">
                                • {new Intl.NumberFormat().format(u.quantity)} {u.unit}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Category Legend with Unit Totals */}
            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              {categoryDist.map((cat) => {
                const isSelected = drillCategory === cat.category;
                return (
                  <div
                    key={cat.category}
                    onClick={() => setDrillCategory(isSelected ? null : cat.category)}
                    className={`p-2 rounded border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal bg-teal-50/50 shadow-xs'
                        : 'border-brand-border-light hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-bold text-navy-primary">{cat.label}</span>
                      </div>
                      <span className="font-mono text-text-secondary">
                        {cat.count} lots ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="space-y-0.5 pl-4 text-[11px] text-text-secondary">
                      {cat.units.map((u, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span>{u.unit}:</span>
                          <span className="font-semibold text-text-primary text-tabular">
                            {new Intl.NumberFormat().format(u.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartContainer>

        {/* D. Quality & Verification Analysis */}
        <ChartContainer
          title="Quality &amp; Verification Analysis"
          subtitle="Proportion of verified usable vs restricted lots (click to filter)"
          height={240}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
            <div className="w-full sm:w-1/2 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityDist}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    onClick={(entry) => setDrillQuality(drillQuality === entry.status ? null : entry.status)}
                    cursor="pointer"
                  >
                    {qualityDist.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={drillQuality === entry.status ? '#142B43' : '#fff'}
                        strokeWidth={drillQuality === entry.status ? 3 : 1}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-brand-border rounded-lg shadow-dropdown p-2 text-xs">
                          <span className="font-bold text-navy-primary block">{data.name}</span>
                          <span className="text-text-secondary block mt-0.5">
                            {data.count} batches ({data.percentage}%)
                          </span>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Quality Status Legend */}
            <div className="w-full sm:w-1/2 space-y-1.5 text-xs">
              {qualityDist.map((stat) => {
                const isSelected = drillQuality === stat.status;
                return (
                  <div
                    key={stat.status}
                    onClick={() => setDrillQuality(isSelected ? null : stat.status)}
                    className={`flex items-center justify-between p-1.5 rounded border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal bg-teal-50/50 shadow-xs'
                        : 'border-brand-border-light hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stat.color }} />
                      <span className="font-medium text-navy-primary">{stat.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-text-primary text-tabular">
                      {stat.count} lots ({stat.percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* PHASE 3 - C: Stock Availability Analysis (Stacked Bar Chart) */}
      <ChartContainer
        title="Stock Availability Analysis"
        subtitle="Operational eligibility breakdown: Usable (Green) vs Reserved (Steel Blue) vs Pending QC (Amber) vs Quarantined / Expired (Red)"
        height={280}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stockAvailability}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 110, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E9EFF4" horizontal={true} vertical={true} />
            <XAxis type="number" stroke="#CAD4DE" tick={{ fontSize: 10, fill: '#667085' }} />
            <YAxis
              type="category"
              dataKey="shortName"
              stroke="#CAD4DE"
              tick={{ fontSize: 10, fill: '#142B43' }}
              width={100}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div className="bg-white border border-brand-border rounded-lg shadow-dropdown p-3 text-xs z-50">
                    <span className="font-bold text-navy-primary block">{d.name}</span>
                    <span className="text-[11px] text-text-secondary block">
                      Ref: {d.batchId} • {d.facilityName}
                    </span>
                    <div className="mt-2 pt-2 border-t border-brand-border-light space-y-1 text-[11px]">
                      <div className="flex justify-between gap-3 text-status-success">
                        <span>Usable:</span>
                        <span className="font-bold text-tabular">{new Intl.NumberFormat().format(d.usable)} {d.unit}</span>
                      </div>
                      <div className="flex justify-between gap-3 text-teal">
                        <span>Reserved:</span>
                        <span className="font-bold text-tabular">{new Intl.NumberFormat().format(d.reserved)} {d.unit}</span>
                      </div>
                      {d.pending > 0 && (
                        <div className="flex justify-between gap-3 text-status-warning">
                          <span>Pending QC:</span>
                          <span className="font-bold text-tabular">{new Intl.NumberFormat().format(d.pending)} {d.unit}</span>
                        </div>
                      )}
                      {d.unavailable > 0 && (
                        <div className="flex justify-between gap-3 text-status-critical">
                          <span>Unavailable:</span>
                          <span className="font-bold text-tabular">{new Intl.NumberFormat().format(d.unavailable)} {d.unit}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-3 text-text-primary pt-1 border-t border-brand-border-light font-bold">
                        <span>Total Stock:</span>
                        <span className="text-tabular">{new Intl.NumberFormat().format(d.total)} {d.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
              formatter={(value) => <span className="text-text-secondary font-medium">{value}</span>}
            />
            <Bar dataKey="usable" stackId="a" fill="#27856F" name="Usable Stock" cursor="pointer" onClick={(data) => onSelectBatch?.(data.rawItem)} />
            <Bar dataKey="reserved" stackId="a" fill="#60758A" name="Reserved Stock" cursor="pointer" onClick={(data) => onSelectBatch?.(data.rawItem)} />
            <Bar dataKey="pending" stackId="a" fill="#D99A35" name="Pending Verification" cursor="pointer" onClick={(data) => onSelectBatch?.(data.rawItem)} />
            <Bar dataKey="unavailable" stackId="a" fill="#C94C4C" name="Unavailable / Quarantined" cursor="pointer" onClick={(data) => onSelectBatch?.(data.rawItem)} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* PHASE 3 - E & F: Expiry Risk Timeline and Facility-Wise Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* E. Expiry Risk Timeline */}
        <ChartContainer
          title="FEFO Expiry Risk Timeline"
          subtitle="Batch count organized by shelf-life urgency horizons (click to filter)"
          height={240}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={expiryTimeline}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E9EFF4" vertical={false} />
              <XAxis dataKey="daysLabel" stroke="#CAD4DE" tick={{ fontSize: 10, fill: '#667085' }} />
              <YAxis stroke="#CAD4DE" tick={{ fontSize: 10, fill: '#667085' }} allowDecimals={false} />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-brand-border rounded-lg shadow-dropdown p-2.5 text-xs z-50">
                      <span className="font-bold text-navy-primary block">{d.label}</span>
                      <span className="text-text-secondary block mt-0.5">
                        {d.count} batches ({d.daysLabel})
                      </span>
                      {d.unitsBreakdown.length > 0 && (
                        <div className="mt-1.5 pt-1 border-t border-brand-border-light space-y-0.5 text-[11px]">
                          {d.unitsBreakdown.map((u, i) => (
                            <div key={i} className="text-text-primary">
                              • {new Intl.NumberFormat().format(u.quantity)} {u.unit}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="count"
                name="Batches"
                cursor="pointer"
                onClick={(entry) => setDrillExpiryTier(drillExpiryTier === entry.tier ? null : entry.tier)}
              >
                {expiryTimeline.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={drillExpiryTier === entry.tier ? '#142B43' : 'none'}
                    strokeWidth={drillExpiryTier === entry.tier ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* F. Facility-Wise Inventory Analysis */}
        <ChartContainer
          title="Facility-Wise Inventory Staging"
          subtitle="Usable vs Reserved vs Quality-restricted batches per depot (click to filter)"
          height={240}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={facilityAnalysis}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E9EFF4" vertical={false} />
              <XAxis dataKey="shortName" stroke="#CAD4DE" tick={{ fontSize: 10, fill: '#667085' }} />
              <YAxis stroke="#CAD4DE" tick={{ fontSize: 10, fill: '#667085' }} allowDecimals={false} />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-white border border-brand-border rounded-lg shadow-dropdown p-2.5 text-xs z-50">
                      <span className="font-bold text-navy-primary block">{d.facilityName}</span>
                      <span className="text-[11px] text-text-secondary block">
                        Facility ID: {d.facilityId} • {d.totalBatches} total lots
                      </span>
                      <div className="mt-1.5 pt-1 border-t border-brand-border-light space-y-1 text-[11px]">
                        <div className="flex justify-between gap-3 text-status-success">
                          <span>Usable Lots:</span>
                          <span className="font-bold">{d.usableBatches}</span>
                        </div>
                        <div className="flex justify-between gap-3 text-teal">
                          <span>Reserved Lots:</span>
                          <span className="font-bold">{d.reservedBatches}</span>
                        </div>
                        <div className="flex justify-between gap-3 text-status-critical">
                          <span>Quality Flags:</span>
                          <span className="font-bold">{d.qualityIssueBatches}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 4, fontSize: 11 }} />
              <Bar dataKey="usableBatches" name="Usable Lots" fill="#27856F" cursor="pointer" onClick={(data) => setDrillFacility(drillFacility === data.facilityId ? null : data.facilityId)} />
              <Bar dataKey="reservedBatches" name="Reserved Lots" fill="#60758A" cursor="pointer" onClick={(data) => setDrillFacility(drillFacility === data.facilityId ? null : data.facilityId)} />
              <Bar dataKey="qualityIssueBatches" name="Quality Issues" fill="#C94C4C" cursor="pointer" onClick={(data) => setDrillFacility(drillFacility === data.facilityId ? null : data.facilityId)} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* PHASE 3 - G: Resource Variation Analysis */}
      <ChartContainer
        title="Resource SKU Variation Analysis"
        subtitle="Quantitative comparison of individual commodities with explicit unit preservation"
        action={
          <div className="flex items-center gap-1 bg-brand-bg p-0.5 rounded-md border border-brand-border text-xs">
            {['ALL', 'FOOD', 'WATER', 'MEDICAL'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setResourceCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  resourceCategoryFilter === cat
                    ? 'bg-white text-navy-primary shadow-subtle'
                    : 'text-text-secondary hover:text-navy-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        }
        height={260}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={resourceVariation}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 110, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E9EFF4" horizontal={true} vertical={true} />
            <XAxis type="number" stroke="#CAD4DE" tick={{ fontSize: 10, fill: '#667085' }} />
            <YAxis
              type="category"
              dataKey="shortName"
              stroke="#CAD4DE"
              tick={{ fontSize: 10, fill: '#142B43' }}
              width={100}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div className="bg-white border border-brand-border rounded-lg shadow-dropdown p-2.5 text-xs z-50">
                    <span className="font-bold text-navy-primary block">{d.name}</span>
                    <span className="text-[11px] text-text-secondary block">
                      Commodity: {d.commodity} • {d.batchCount} batch{d.batchCount > 1 ? 'es' : ''}
                    </span>
                    <div className="mt-2 pt-1.5 border-t border-brand-border-light space-y-0.5 text-[11px]">
                      <div className="flex justify-between gap-3 text-status-success">
                        <span>Usable:</span>
                        <span className="font-bold text-tabular">{new Intl.NumberFormat().format(d.usableQty)} {d.unit}</span>
                      </div>
                      <div className="flex justify-between gap-3 text-teal">
                        <span>Reserved:</span>
                        <span className="font-bold text-tabular">{new Intl.NumberFormat().format(d.reservedQty)} {d.unit}</span>
                      </div>
                      {d.quarantinedQty > 0 && (
                        <div className="flex justify-between gap-3 text-status-critical">
                          <span>Quarantined:</span>
                          <span className="font-bold text-tabular">{new Intl.NumberFormat().format(d.quarantinedQty)} {d.unit}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-3 text-text-primary pt-1 border-t border-brand-border-light font-bold">
                        <span>Total:</span>
                        <span className="text-tabular">{new Intl.NumberFormat().format(d.totalQty)} {d.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />
            <Bar dataKey="usableQty" name="Usable Quantity" fill="#27856F" />
            <Bar dataKey="reservedQty" name="Reserved Quantity" fill="#60758A" />
            <Bar dataKey="quarantinedQty" name="Quarantined Quantity" fill="#C94C4C" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* PHASE 4 & 5: Interactive Filtered Batch Drill-Down List */}
      <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-brand-border-light">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-navy-primary">
              Filtered Batches Matching Visual Criteria
            </h4>
            <StatusBadge variant="neutral" size="xs">
              {filteredBatches.length} BATCHES
            </StatusBadge>
          </div>
          <span className="text-xs text-text-secondary">
            Click any batch or chart element to inspect complete ledger dossier
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-brand-border text-text-secondary text-[11px] uppercase tracking-wider bg-brand-surface/40">
                <th className="py-2 px-3">Batch Ref</th>
                <th className="py-2 px-3">Resource Name</th>
                <th className="py-2 px-3">Commodity</th>
                <th className="py-2 px-3">Facility</th>
                <th className="py-2 px-3 text-right">Usable Qty</th>
                <th className="py-2 px-3 text-right">Reserved Qty</th>
                <th className="py-2 px-3">Expiry Date</th>
                <th className="py-2 px-3">Quality Status</th>
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {filteredBatches.map((batch) => {
                const isSelected = selectedBatchId === batch.id;
                const isQuarantined = batch.qualityStatus === 'QUARANTINED';
                const isUsable = batch.qualityStatus === 'VERIFIED_USABLE';

                return (
                  <tr
                    key={batch.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-teal-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-medium text-navy-primary">
                      {batch.batchId}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-text-primary block truncate max-w-[200px]">
                        {batch.name}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">{batch.id}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-slate-100 text-slate-700">
                        {batch.commodity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-text-secondary truncate max-w-[140px]">
                      {batch.facilityName || batch.facilityId}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-status-success">
                      {new Intl.NumberFormat().format(batch.usableQty)} <span className="text-[10px] font-normal text-text-secondary">{batch.unit}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-teal">
                      {batch.reservedQty > 0 ? (
                        <>
                          {new Intl.NumberFormat().format(batch.reservedQty)} <span className="text-[10px] text-text-secondary">{batch.unit}</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[11px] block text-text-secondary">{batch.expiryDate || 'N/A'}</span>
                      {batch.daysToExpiry !== null && (
                        <span
                          className={`text-[10px] font-medium ${
                            batch.daysToExpiry <= 0
                              ? 'text-status-critical font-bold'
                              : batch.daysToExpiry <= 30
                              ? 'text-status-warning'
                              : 'text-text-muted'
                          }`}
                        >
                          {batch.daysToExpiry <= 0 ? 'Expired' : `${batch.daysToExpiry}d left`}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge
                        variant={isUsable ? 'success' : isQuarantined ? 'critical' : 'warning'}
                        size="xs"
                      >
                        {batch.qualityStatus}
                      </StatusBadge>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Button
                        size="xs"
                        variant="secondary"
                        icon={Eye}
                        onClick={() => onSelectBatch?.(batch)}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

