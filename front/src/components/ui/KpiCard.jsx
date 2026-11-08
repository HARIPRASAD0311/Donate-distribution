import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

/**
 * Enterprise KPI Telemetry Card
 * High density, prominent tabular typography, thin borders, restrained shadow.
 */
export function KpiCard({
  title,
  value,
  unit,
  trend,
  status = 'neutral',
  icon: Icon,
  subtext,
  categories = null,
  onCategoryClick,
  className = '',
  onClick,
}) {
  const statusAccent = {
    neutral: 'border-l-steel',
    teal: 'border-l-teal',
    success: 'border-l-status-success',
    warning: 'border-l-status-warning',
    critical: 'border-l-status-critical',
  };

  const iconBg = {
    neutral: 'bg-steel-light text-steel',
    teal: 'bg-teal-light text-teal',
    success: 'bg-status-success-bg text-status-success',
    warning: 'bg-status-warning-bg text-status-warning',
    critical: 'bg-status-critical-bg text-status-critical',
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-brand-border rounded-lg p-4 shadow-subtle
        border-l-4 ${statusAccent[status] || statusAccent.neutral}
        h-full flex flex-col justify-between
        ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-card transition-all' : ''}
        ${className}
      `}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[13px] font-semibold text-text-secondary truncate uppercase tracking-wider" title={typeof title === 'string' ? title : undefined}>
            {title}
          </span>
          {Icon && (
            <div className={`p-1.5 rounded-md shrink-0 ${iconBg[status] || iconBg.neutral}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-2xl md:text-[28px] font-bold text-text-primary text-tabular leading-tight">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-medium text-text-secondary truncate">
              {unit}
            </span>
          )}
        </div>
      </div>

      {(trend || subtext) && (
        <div className="mt-2.5 pt-2 border-t border-brand-border-light flex items-center justify-between text-xs">
          {trend && (
            <div className="flex items-center gap-1 font-medium">
              {trend.direction === 'up' && (
                <ArrowUpRight className={`w-3.5 h-3.5 ${trend.isPositive ? 'text-status-success' : 'text-status-critical'}`} />
              )}
              {trend.direction === 'down' && (
                <ArrowDownRight className={`w-3.5 h-3.5 ${trend.isPositive ? 'text-status-success' : 'text-status-critical'}`} />
              )}
              {trend.direction === 'neutral' && (
                <Minus className="w-3.5 h-3.5 text-steel" />
              )}
              <span className={trend.isPositive ? 'text-status-success' : trend.direction === 'neutral' ? 'text-steel' : 'text-status-critical'}>
                {trend.value}
              </span>
              {trend.label && (
                <span className="text-text-secondary text-[11px] ml-0.5">
                  {trend.label}
                </span>
              )}
            </div>
          )}
          {subtext && !trend && (
            <span className="text-text-secondary text-[11px] truncate">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
