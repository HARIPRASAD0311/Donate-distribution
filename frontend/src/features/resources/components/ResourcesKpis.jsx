import React from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Archive,
} from 'lucide-react';
import { KpiCard } from '../../../components/ui/KpiCard.jsx';
import { Tooltip } from '../../../components/ui/Tooltip.jsx';

export function ResourcesKpis({ metrics, activeCommodity, onKpiClick, activeFilter }) {
  const {
    totalItemCount = 0,
    totalUsableLots = 0,
    totalReservedLots = 0,
    totalLowStockLots = 0,
    totalExpiringLots = 0,
    totalQuarantinedLots = 0,
  } = metrics || {};

  const kpis = [
    {
      id: 'kpi-total-inventory',
      title: 'Total Active Lots',
      value: totalItemCount,
      unit: 'batches',
      status: 'neutral',
      trend: { value: `${activeCommodity}`, isPositive: true, direction: 'neutral', label: 'monitored' },
      icon: Package,
      tooltip: 'Total active inventory batches currently staged across filtered warehouses.',
    },
    {
      id: 'kpi-usable-inventory',
      title: 'Usable Verified Stock',
      value: totalUsableLots,
      unit: 'batches ready',
      status: 'success',
      trend: { value: 'QC Cleared', isPositive: true, direction: 'neutral' },
      icon: CheckCircle2,
      tooltip: 'Batches confirmed compliant with food safety, water potability, or medical QC standards.',
    },
    {
      id: 'kpi-reserved-inventory',
      title: 'Reserved Allocations',
      value: totalReservedLots,
      unit: 'batches staged',
      status: 'teal',
      trend: { value: 'Convoy Hold', isPositive: true, direction: 'neutral' },
      icon: Archive,
      tooltip: 'Stock earmarked for active convoy corridors and not available for new assignments.',
    },
    {
      id: 'kpi-low-stock',
      title: 'Low Stock Warnings',
      value: totalLowStockLots,
      unit: 'thresholds breached',
      status: totalLowStockLots > 0 ? 'warning' : 'neutral',
      trend: { value: 'Refill Alert', isPositive: false, direction: 'up' },
      icon: AlertTriangle,
      tooltip: 'Commodity items with remaining usable quantity below its configured commodity-specific threshold.',
    },
    {
      id: 'kpi-expiring-items',
      title: 'Expiring Soon (< 30d)',
      value: totalExpiringLots,
      unit: 'urgent lots',
      status: totalExpiringLots > 0 ? 'critical' : 'success',
      trend: { value: 'FEFO High Priority', isPositive: false, direction: 'up' },
      icon: Clock,
      tooltip: 'Commodities reaching expiration within 30 days. Must be prioritized in dispatch allocation.',
    },
    {
      id: 'kpi-quarantined-items',
      title: 'Quarantined Inventory',
      value: totalQuarantinedLots,
      unit: 'locked lots',
      status: totalQuarantinedLots > 0 ? 'critical' : 'neutral',
      trend: { value: 'Hold Locked', isPositive: false, direction: 'neutral' },
      icon: ShieldAlert,
      tooltip: 'Lots locked due to failed seal vacuum, turbidity breach, or cold-chain temperature excursion. Non-issuable.',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isSelected = activeFilter === kpi.id;

        return (
          <Tooltip key={kpi.id} content={kpi.tooltip} position="bottom" className="w-full">
            <div className="w-full">
              <KpiCard
                title={kpi.title}
                value={kpi.value}
                unit={kpi.unit}
                status={kpi.status}
                trend={kpi.trend}
                icon={Icon}
                onClick={() => onKpiClick?.(kpi.id)}
                className={`transition-all ${
                  isSelected ? 'ring-2 ring-teal border-teal shadow-card' : ''
                }`}
              />
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
