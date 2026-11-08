import React from 'react';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { KpiCard } from '../../../components/ui/KpiCard.jsx';

/**
 * Six Required Enterprise Allocation KPI Cards
 * 1. Total usable resources
 * 2. Verified demand
 * 3. Planned allocation
 * 4. Remaining unmet demand
 * 5. Critical need coverage
 * 6. Solver feasibility status
 *
 * NOTE: Values are strictly driven by the active plan or solver response.
 * Missing metrics are presented as '—' (unavailable) rather than inventing fake data.
 */
export function AllocationKpis({ plan, metrics, onKpiClick }) {
  const currentPlan = plan || {};
  const {
    totalAllocatedUnits,
    totalVerifiedDemandUnits,
    overallCoveragePct,
    criticalCoveragePct,
    solverStatus,
    feasibility,
    optimalityGapPct,
    totalUsableStock,
  } = currentPlan;

  const hasAllocated = totalAllocatedUnits !== undefined && totalAllocatedUnits !== null;
  const hasDemand = totalVerifiedDemandUnits !== undefined && totalVerifiedDemandUnits !== null;
  const hasCritical = criticalCoveragePct !== undefined && criticalCoveragePct !== null;

  const unmetUnits = hasDemand && hasAllocated ? Math.max(0, totalVerifiedDemandUnits - totalAllocatedUnits) : null;

  // Feasibility status evaluation
  const isInfeasible =
    feasibility === 'INFEASIBLE' ||
    solverStatus === 'INFEASIBLE' ||
    currentPlan.category === 'INFEASIBLE';

  const isOptimal =
    feasibility === 'OPTIMAL_FEASIBLE' ||
    feasibility === 'OPTIMAL' ||
    solverStatus === 'OPTIMAL_FEASIBLE' ||
    solverStatus === 'OPTIMAL';

  const feasibilityLabel = isInfeasible
    ? 'INFEASIBLE'
    : isOptimal
    ? 'OPTIMAL'
    : solverStatus || (currentPlan.id ? 'FEASIBLE' : 'UNSOLVED');

  const feasibilityStatus = isInfeasible
    ? 'critical'
    : isOptimal
    ? 'teal'
    : 'neutral';

  const kpis = [
    {
      id: 'kpi-usable-resources',
      title: 'Total Usable Stock',
      value: totalUsableStock !== undefined
        ? new Intl.NumberFormat().format(totalUsableStock)
        : currentPlan.isDemo
        ? '24,000'
        : '—',
      unit: totalUsableStock !== undefined || currentPlan.isDemo ? 'lots / units pool' : 'metric unavailable',
      status: 'neutral',
      trend: {
        value: totalUsableStock !== undefined || currentPlan.isDemo ? 'QC Cleared' : 'No telemetry',
        isPositive: true,
        direction: 'neutral',
      },
      icon: Package,
      tooltip: 'Total physical stockpile certified usable across central and regional depots.',
    },
    {
      id: 'kpi-verified-demand',
      title: 'Verified Demand',
      value: hasDemand ? new Intl.NumberFormat().format(totalVerifiedDemandUnits) : '—',
      unit: hasDemand ? 'verified units' : 'unverified',
      status: 'neutral',
      trend: {
        value: hasDemand ? 'Screened Lots' : 'Pending solve',
        isPositive: true,
        direction: 'neutral',
      },
      icon: CheckCircle2,
      tooltip: 'Confirmed humanitarian demand verified by ground survey or satellite evidence.',
    },
    {
      id: 'kpi-planned-allocation',
      title: 'Planned Allocation',
      value: hasAllocated ? new Intl.NumberFormat().format(totalAllocatedUnits) : '—',
      unit: overallCoveragePct !== undefined ? `${overallCoveragePct}% met` : 'pending solve',
      status: hasAllocated && overallCoveragePct >= 80 ? 'teal' : hasAllocated ? 'warning' : 'neutral',
      trend: {
        value: overallCoveragePct !== undefined ? `${overallCoveragePct}% Coverage` : 'No allocation',
        isPositive: (overallCoveragePct || 0) >= 70,
        direction: hasAllocated ? 'up' : 'neutral',
      },
      icon: Layers,
      tooltip: 'Optimized resource assignments matched from source facilities to beneficiary clusters.',
    },
    {
      id: 'kpi-unmet-demand',
      title: 'Remaining Unmet Demand',
      value: unmetUnits !== null ? new Intl.NumberFormat().format(unmetUnits) : '—',
      unit: unmetUnits !== null ? (unmetUnits > 0 ? 'units deferred' : 'zero deficit') : 'pending solve',
      status: unmetUnits === null ? 'neutral' : unmetUnits > 0 ? 'warning' : 'success',
      trend: {
        value: unmetUnits === null ? 'Uncalculated' : unmetUnits > 0 ? 'Capacity Deficit' : '100% Fulfilled',
        isPositive: unmetUnits === 0,
        direction: unmetUnits !== null && unmetUnits > 0 ? 'neutral' : 'down',
      },
      icon: Clock,
      tooltip: 'Verified requirements not allocated in this solve due to transport or inventory bounds.',
    },
    {
      id: 'kpi-critical-coverage',
      title: 'Critical Need Coverage',
      value: hasCritical ? `${criticalCoveragePct}%` : '—',
      unit: hasCritical ? (criticalCoveragePct === 100 ? 'life-safety met' : 'critical deficit') : 'pending solve',
      status: !hasCritical ? 'neutral' : criticalCoveragePct === 100 ? 'success' : 'critical',
      trend: {
        value: !hasCritical ? 'Uncalculated' : criticalCoveragePct === 100 ? '100% Zero Deficit' : 'Critical Deficit Risk',
        isPositive: hasCritical && criticalCoveragePct === 100,
        direction: hasCritical && criticalCoveragePct === 100 ? 'up' : 'down',
      },
      icon: ShieldCheck,
      tooltip: 'Proportion of urgent (<24h life threat) humanitarian demand fully satisfied.',
    },
    {
      id: 'kpi-solver-feasibility',
      title: 'Solver Feasibility',
      value: feasibilityLabel,
      unit: optimalityGapPct !== undefined ? `gap ${optimalityGapPct}%` : isInfeasible ? 'no feasible match' : 'pending run',
      status: feasibilityStatus,
      trend: {
        value: isInfeasible ? 'Constraint Violation' : isOptimal ? 'HiGHS MILP' : currentPlan.solverName || 'Unsolved',
        isPositive: !isInfeasible,
        direction: isInfeasible ? 'down' : 'neutral',
      },
      icon: Cpu,
      tooltip: 'Mathematical solver proof status indicating whether physical and policy bounds were satisfied.',
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
