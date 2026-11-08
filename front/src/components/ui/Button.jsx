import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Enterprise Action Button
 * Supports primary teal, navy, secondary, outline, ghost, critical variants.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'sm',
  icon: Icon,
  rightIcon: RightIcon,
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-teal text-white hover:bg-teal-hover focus:ring-teal/30 active:bg-[#0f4b52] shadow-subtle',
    secondary: 'bg-white text-text-primary border border-brand-border hover:bg-brand-surface-hover hover:border-[#CAD4DE] focus:ring-steel/20 active:bg-steel-light shadow-subtle',
    navy: 'bg-navy-primary text-white hover:bg-navy-secondary focus:ring-navy-secondary/30 active:bg-navy-dark shadow-subtle',
    'outline-teal': 'bg-transparent text-teal border border-teal hover:bg-teal-light focus:ring-teal/20',
    critical: 'bg-status-critical text-white hover:bg-[#B33E3E] focus:ring-status-critical/30 active:bg-[#993434] shadow-subtle',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-brand-bg focus:ring-steel/20',
  };

  const sizes = {
    xs: 'text-[11px] px-2 py-1 gap-1.5 h-6.5',
    sm: 'text-xs px-3 py-1.5 gap-2 h-8',
    md: 'text-sm px-3.5 py-2 gap-2 h-9',
    lg: 'text-sm px-4 py-2.5 gap-2.5 h-10 font-semibold',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.sm}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      
      <span>{children}</span>

      {!isLoading && RightIcon && (
        <RightIcon className="w-3.5 h-3.5 shrink-0 ml-0.5" />
      )}
    </button>
  );
}
