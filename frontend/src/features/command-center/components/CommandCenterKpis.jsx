import React from 'react';
import {
  Package,
  Droplets,
  Sparkles,
  HeartPulse,
  ShieldAlert,
  Archive,
  Truck,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Users,
  MapPin,
  GitBranch,
  Utensils,
} from 'lucide-react';
import { KpiCard } from '../../../components/ui/KpiCard.jsx';
import { Tooltip } from '../../../components/ui/Tooltip.jsx';

/**
 * ResQNet Command Centre Multi-Section Enterprise KPI Grid
 * Enforces strict unit and commodity separation across five core operational sections:
 * - A. Inventory Availability (5 cards)
 * - B. Resource Movement & Reservations (2 cards)
 * - C. Verified Fulfilment (5 cards)
 * - D. Remaining Verified Demand (5 cards)
 * - E. Operational Impact & Performance (5 cards)
 */
export function CommandCenterKpis({
  sections = [],
  kpis = [],
  onKpiClick,
  activeFilter,
}) {
  // If flat kpis are passed instead of sections, render fallback single grid
  if ((!sections || sections.length === 0) && kpis && kpis.length > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {kpis.map((kpi) => {
          const isSelected = activeFilter === kpi.id;
          const Icon = kpi.icon || Package;

          return (
            <Tooltip key={kpi.id} content={kpi.tooltip} position="bottom" className="w-full">
              <div className="w-full h-full min-h-[116px]">
                <KpiCard
                  title={kpi.title}
                  value={kpi.value}
                  unit={kpi.unit}
                  status={kpi.status}
                  trend={kpi.trend}
                  icon={Icon}
                  subtext={kpi.subtext}
                  onClick={() => onKpiClick?.(kpi.id)}
                  className={`transition-all ${isSelected ? 'ring-2 ring-teal border-teal shadow-card' : ''
                    }`}
                />
              </div>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        return (
          <section key={section.id} className="space-y-2.5">
            {/* Section Heading & Classification */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-brand-border-light">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider bg-navy-primary/10 text-navy-primary uppercase">
                  {section.code}
                </span>
                <h3 className="text-[18px] md:text-[19px] font-bold text-navy-primary tracking-tight">
                  {section.title}
                </h3>
              </div>
              {section.subtitle && (
                <span className="text-xs text-text-secondary font-medium">
                  {section.subtitle}
                </span>
              )}
            </div>

            {/* Five-Column Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {section.cards.map((kpi) => {
                const isSelected = activeFilter === kpi.id;
                const Icon = kpi.icon || Package;

                return (
                  <Tooltip key={kpi.id} content={kpi.tooltip} position="bottom" className="w-full">
                    <div className="w-full h-full min-h-[116px]">
                      <KpiCard
                        title={kpi.title}
                        value={kpi.value}
                        unit={kpi.unit}
                        status={kpi.status}
                        trend={kpi.trend}
                        icon={Icon}
                        subtext={kpi.subtext}
                        onClick={() => onKpiClick?.(kpi.id)}
                        className={`transition-all ${isSelected ? 'ring-2 ring-teal border-teal shadow-card' : ''
                          }`}
                      />
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
