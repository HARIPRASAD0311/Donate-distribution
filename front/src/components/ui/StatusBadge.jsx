import React from 'react';

/**
 * Enterprise Status & Priority Badge
 * High contrast, legible tabular badge for triage, verification, and logistics milestones.
 */
export function StatusBadge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = true,
  pulse = false,
  className = '',
}) {
  const variants = {
    success: 'bg-status-success-bg text-status-success border-status-success-border',
    warning: 'bg-status-warning-bg text-status-warning border-status-warning-border',
    critical: 'bg-status-critical-bg text-status-critical border-status-critical-border',
    teal: 'bg-teal-light text-teal border-teal/30',
    info: 'bg-teal-light text-teal border-teal/30',
    neutral: 'bg-steel-light text-text-secondary border-brand-border',
    navy: 'bg-[#EEF3F8] text-navy-primary border-[#C8D6E5]',
  };

  const dotColors = {
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    critical: 'bg-status-critical',
    teal: 'bg-teal',
    info: 'bg-teal',
    neutral: 'bg-steel',
    navy: 'bg-navy-primary',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.25 gap-1 font-mono',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  const dotSizes = {
    xs: 'w-1.25 h-1.25',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded border tracking-wide uppercase select-none
        ${variants[variant] || variants.neutral}
        ${sizes[size] || sizes.sm}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`
            rounded-full shrink-0
            ${dotColors[variant] || dotColors.neutral}
            ${dotSizes[size] || dotSizes.sm}
            ${pulse ? 'animate-pulse' : ''}
          `}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
