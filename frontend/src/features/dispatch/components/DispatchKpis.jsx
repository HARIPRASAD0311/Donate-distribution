import React from 'react';
import {
  Truck,
  Clock,
  Navigation,
  CheckCircle2,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';
import { KpiCard } from '../../../components/ui/KpiCard.jsx';

/**
 * Six Required Enterprise Dispatch & Verification KPI Cards
 */
export function DispatchKpis({ dispatches = [], onKpiClick }) {
  const total = dispatches.length;
  const inTransit = dispatches.filter((d) => d.status === 'IN_TRANSIT').length;
  const delivered = dispatches.filter((d) => d.status === 'DELIVERED' || d.status === 'VERIFIED').length;
  const pendingPOD = dispatches.filter((d) => d.status === 'DELIVERED').length;
  const pendingDispatch = dispatches.filter((d) => d.status === 'PREPARING' || d.status === 'READY' || d.status === 'APPROVED').length;
  const failedDisrupted = dispatches.filter((d) => d.status === 'FAILED_DISRUPTED').length;

  const kpis = [
    {
      id: 'kpi-total-dispatches',
      title: 'Total Dispatch Orders',
      value: total,
      unit: 'active consignments',
      status: 'neutral',
      trend: { value: 'All Corridors', isPositive: true, direction: 'neutral' },
      icon: Truck,
      tooltip: 'Total active humanitarian consignment dispatch orders generated from approved allocation plans.',
    },
    {
      id: 'kpi-pending-dispatches',
      title: 'Pending Staging / Loading',
      value: pendingDispatch,
      unit: 'awaiting release',
      status: 'teal',
      trend: { value: 'Loading Docks', isPositive: true, direction: 'neutral' },
      icon: Clock,
      tooltip: 'Orders approved and actively undergoing warehouse palletizing or loading dock staging.',
    },
    {
      id: 'kpi-in-transit',
      title: 'Shipments in Transit',
      value: inTransit,
      unit: 'active convoys',
      status: 'teal',
      trend: { value: 'Moving Live', isPositive: true, direction: 'up' },
      icon: Navigation,
      tooltip: 'Convoys, barges, or air-slings currently traversing designated humanitarian corridors.',
    },
    {
      id: 'kpi-delivered-shipments',
      title: 'Delivered Consignments',
      value: delivered,
      unit: 'at destination gate',
      status: 'success',
      trend: { value: 'Offloaded', isPositive: true, direction: 'up' },
      icon: CheckCircle2,
      tooltip: 'Consignments that have safely arrived and completed physical offloading at destination hubs.',
    },
    {
      id: 'kpi-pending-verification',
      title: 'Pending POD Verification',
      value: pendingPOD,
      unit: 'awaiting signoff',
      status: pendingPOD > 0 ? 'warning' : 'neutral',
      trend: {
        value: pendingPOD > 0 ? 'Signoff Req' : 'Fully Audited',
        isPositive: pendingPOD === 0,
        direction: 'neutral',
      },
      icon: FileCheck2,
      tooltip: 'Delivered goods awaiting official field receiver inspection and electronic Proof-of-Delivery.',
    },
    {
      id: 'kpi-failed-disrupted',
      title: 'Disrupted / Halted Shipments',
      value: failedDisrupted,
      unit: 'exceptions flagged',
      status: failedDisrupted > 0 ? 'critical' : 'success',
      trend: {
        value: failedDisrupted > 0 ? 'Reroute Req' : 'Zero Breaches',
        isPositive: failedDisrupted === 0,
        direction: failedDisrupted > 0 ? 'up' : 'neutral',
      },
      icon: AlertTriangle,
      tooltip: 'Shipments interrupted by road washouts, security checkpoints, or mechanical failures.',
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
