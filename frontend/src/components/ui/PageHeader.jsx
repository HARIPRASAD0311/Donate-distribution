import React from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { StatusBadge } from './StatusBadge.jsx';

/**
 * Enterprise Reusable Page Header
 * Standardizes title, subtitle, global context metadata, and action slots.
 */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  className = '',
}) {
  const { selectedIncident, selectedCrisisType, selectedRegion } = useAppStore();

  return (
    <div className={`pb-4 mb-5 border-b border-brand-border flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}>
      {/* Title & Description */}
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-2.5 rounded-lg bg-teal-light text-teal border border-teal/20 shrink-0 mt-0.5">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-page-title text-text-primary tracking-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
            <StatusBadge variant="navy" size="xs">
              {selectedCrisisType}
            </StatusBadge>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
            {subtitle && <span>{subtitle}</span>}
            <span className="hidden sm:inline text-text-muted">•</span>
            <span className="font-mono text-text-secondary text-[11px] hidden sm:inline">
              Scope: <strong className="text-text-primary font-medium">{selectedRegion}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
