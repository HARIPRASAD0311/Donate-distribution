import React from 'react';

/**
 * Enterprise Icon Button
 * Compact square button for data tables, toolbars, and panel controls.
 */
export function IconButton({
  icon: Icon,
  variant = 'secondary',
  size = 'sm',
  label,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none shrink-0';

  const variants = {
    secondary: 'bg-white text-text-secondary border border-brand-border hover:text-text-primary hover:bg-brand-surface-hover hover:border-[#CAD4DE] focus:ring-steel/20 active:bg-steel-light shadow-subtle',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-brand-bg focus:ring-steel/20',
    teal: 'bg-teal-light text-teal border border-teal/20 hover:bg-teal hover:text-white focus:ring-teal/20',
    navy: 'bg-navy-primary text-white hover:bg-navy-secondary focus:ring-navy-secondary/30',
    critical: 'bg-status-critical-bg text-status-critical border border-status-critical-border hover:bg-status-critical hover:text-white focus:ring-status-critical/20',
  };

  const sizes = {
    xs: 'w-6 h-6 p-1',
    sm: 'w-8 h-8 p-1.5',
    md: 'w-9 h-9 p-2',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.secondary}
        ${sizes[size] || sizes.sm}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className={iconSizes[size] || iconSizes.sm} />}
    </button>
  );
}
