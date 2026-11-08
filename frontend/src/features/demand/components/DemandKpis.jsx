import React from 'react';
import {
  Users,
  Building,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { KpiCard } from '../../../components/ui/KpiCard.jsx';

/**
 * Six Required Enterprise Demand KPI Cards
 * 1. Affected population
 * 2. Registered beneficiary groups
 * 3. Total verified demand
 * 4. Critical unmet demand
 * 5. Pending verification
 * 6. Verified fulfilled demand
 */
export function DemandKpis({ metrics, activeRegion, activeCommodity, onKpiClick }) {
  const {
    totalAffectedPopulation = 0,
    totalRegisteredGroups = 0,
    totalVerifiedCount = 0,
    criticalUnmetCount = 0,
    totalPendingCount = 0,
    totalVerifiedFulfilled = 0,
    fulfilmentPct = 0,
  } = metrics || {};

  const kpis = [
    {
      id: 'kpi-affected-population',
      title: 'Affected Population',
      value: new Intl.NumberFormat().format(totalAffectedPopulation),
      unit: 'people census',
      status: 'neutral',
      trend: {
        value: activeRegion === 'ALL' ? 'All Sectors' : activeRegion,
        isPositive: true,
        direction: 'neutral',
        label: 'registered',
      },
      icon: Users,
      tooltip: 'Total aggregated census across active IDP settlements, clinics, and cut-off enclaves.',
    },
    {
      id: 'kpi-registered-groups',
      title: 'Beneficiary Clusters',
      value: totalRegisteredGroups,
      unit: 'registered groups',
      status: 'teal',
      trend: { value: 'Geo-Anchored', isPositive: true, direction: 'neutral' },
      icon: Building,
      tooltip: 'Formally recorded humanitarian assistance clusters with verified community focal points.',
    },
    {
      id: 'kpi-verified-demand',
      title: 'Total Verified Demand',
      value: totalVerifiedCount,
      unit: 'audited lots',
      status: 'neutral',
      trend: { value: 'Evidence Grounded', isPositive: true, direction: 'neutral' },
      icon: CheckCircle2,
      tooltip: 'Humanitarian distress requests verified by field assessment teams or satellite imagery.',
    },
    {
      id: 'kpi-critical-unmet',
      title: 'Critical Unmet Demand',
      value: criticalUnmetCount,
      unit: 'urgent pockets',
      status: criticalUnmetCount > 0 ? 'critical' : 'success',
      trend: {
        value: criticalUnmetCount > 0 ? '<24h Life-Threat' : 'Zero Deficit',
        isPositive: criticalUnmetCount === 0,
        direction: criticalUnmetCount > 0 ? 'up' : 'neutral',
      },
      icon: AlertTriangle,
      tooltip: 'Verified life-saving distress requests with zero or insufficient supply buffer in the next 24h.',
    },
    {
      id: 'kpi-pending-verification',
      title: 'Pending Verification',
      value: totalPendingCount,
      unit: 'requests in triage',
      status: totalPendingCount > 0 ? 'warning' : 'neutral',
      trend: { value: 'Field Recon Active', isPositive: false, direction: 'neutral' },
      icon: Clock,
      tooltip: 'Crowd-sourced or rapid-alert reports awaiting formal reconnaissance or partner signoff.',
    },
    {
      id: 'kpi-fulfilled-demand',
      title: 'Verified Fulfilled Demand',
      value: `${fulfilmentPct}%`,
      unit: `${new Intl.NumberFormat().format(totalVerifiedFulfilled)} lots receiving aid`,
      status: fulfilmentPct >= 70 ? 'success' : 'teal',
      trend: {
        value: `${fulfilmentPct}% Rate`,
        isPositive: fulfilmentPct >= 50,
        direction: 'up',
      },
      icon: Truck,
      tooltip: 'Proportion of verified humanitarian demand fulfilled through confirmed consignment dispatches.',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.id}
          title={kpi.title}
          value={kpi.value}
          unit={kpi.unit}
          status={kpi.status}
          trend={kpi.trend}
          icon={kpi.icon}
          tooltip={kpi.tooltip}
          onClick={() => onKpiClick?.(kpi.id)}
        />
      ))}
    </div>
  );
}
