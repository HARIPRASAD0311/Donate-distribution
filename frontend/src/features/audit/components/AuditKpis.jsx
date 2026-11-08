import React from 'react';
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  ShieldCheck,
  History,
} from 'lucide-react';
import { KpiCard } from '../../../components/ui/KpiCard.jsx';

/**
 * Six Required Enterprise Audit & Compliance KPI Cards
 */
export function AuditKpis({ events = [], onKpiClick }) {
  const totalEvents = events.length;
  const verifiedCount = events.filter((e) => e.status === 'VERIFIED').length;
  const disputedCount = events.filter((e) => e.status === 'DISPUTED' || e.action.includes('DISPUTE')).length;
  const pendingReviews = events.filter((e) => e.status === 'PENDING' || e.previousValue === 'PENDING_APPROVAL').length;
  const uniqueUsers = new Set(events.map((e) => e.user)).size;

  const kpis = [
    {
      id: 'kpi-audit-events',
      title: 'Total Audit Events',
      value: totalEvents,
      unit: 'logged operations',
      status: 'neutral',
      trend: { value: 'Immutable Ledger', isPositive: true, direction: 'neutral' },
      icon: History,
      tooltip: 'Total timestamped operational decisions and system state transitions recorded.',
    },
    {
      id: 'kpi-active-users',
      title: 'Active Authorized Actors',
      value: uniqueUsers,
      unit: 'personnel keys',
      status: 'teal',
      trend: { value: 'Role Verified', isPositive: true, direction: 'neutral' },
      icon: Users,
      tooltip: 'Unique humanitarian coordinators, logisticians, and inspectors with logged actions.',
    },
    {
      id: 'kpi-verified-records',
      title: 'Verified Compliance Records',
      value: verifiedCount,
      unit: 'audited entries',
      status: 'success',
      trend: { value: 'Ground Backed', isPositive: true, direction: 'up' },
      icon: CheckCircle2,
      tooltip: 'Actions authenticated with formal evidence references or multi-signature signoffs.',
    },
    {
      id: 'kpi-pending-reviews',
      title: 'Pending Supervisory Reviews',
      value: pendingReviews,
      unit: 'awaiting signoff',
      status: pendingReviews > 0 ? 'warning' : 'neutral',
      trend: {
        value: pendingReviews > 0 ? 'Action Req' : 'Zero Backlog',
        isPositive: pendingReviews === 0,
        direction: 'neutral',
      },
      icon: Clock,
      tooltip: 'Emergency overrides or candidate plans waiting for final supervisory authorization.',
    },
    {
      id: 'kpi-disputed-records',
      title: 'Disputed Claims Flagged',
      value: disputedCount,
      unit: 'investigations active',
      status: disputedCount > 0 ? 'critical' : 'success',
      trend: {
        value: disputedCount > 0 ? 'Audit Hold' : 'Zero Breaches',
        isPositive: disputedCount === 0,
        direction: 'neutral',
      },
      icon: AlertTriangle,
      tooltip: 'Claims flagged for duplicate counting, access discrepancies, or quantity mismatches.',
    },
    {
      id: 'kpi-reports-generated',
      title: 'Reports Generated',
      value: '9',
      unit: 'standard templates',
      status: 'teal',
      trend: { value: 'PDF / CSV / XLSX', isPositive: true, direction: 'neutral' },
      icon: Download,
      tooltip: 'Pre-configured compliance, resource utilization, and situational summary reports.',
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
