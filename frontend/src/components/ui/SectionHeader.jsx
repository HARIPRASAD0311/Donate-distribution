import React from 'react';

/**
 * Enterprise Section Header
 * Clean typographic hierarchy, subtitle, badge and action toolbar.
 */
export function SectionHeader({
  title,
  subtitle,
  badge,
  actions,
  className = '',
  compact = false,
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${compact ? 'mb-3' : 'mb-4 pb-3 border-b border-brand-border'} ${className}`}>
      <div className="flex items-center gap-2.5 flex-wrap">
        <h2 className="text-section-title text-text-primary tracking-tight">
          {title}
        </h2>
        {badge && <div>{badge}</div>}
        {subtitle && (
          <p className="w-full text-xs text-text-secondary mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
