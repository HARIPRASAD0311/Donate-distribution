import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Enterprise Form Select
 * Styled native select element with chevron and consistent border tokens.
 */
export function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  size = 'sm',
  disabled = false,
  error,
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'h-8 text-xs pl-2.5 pr-8',
    md: 'h-9 text-sm pl-3 pr-8',
  };

  return (
    <div className={`relative inline-flex flex-col ${className}`}>
      {label && (
        <label className="text-xs font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={`
            w-full bg-white border rounded-md text-text-primary appearance-none cursor-pointer
            transition-colors focus:outline-hidden focus:border-teal focus:ring-1 focus:ring-teal
            disabled:bg-brand-bg disabled:cursor-not-allowed
            ${error ? 'border-status-critical' : 'border-brand-border hover:border-[#CAD4DE]'}
            ${sizes[size] || sizes.sm}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
      </div>

      {error && (
        <span className="text-[11px] text-status-critical mt-1">{error}</span>
      )}
    </div>
  );
}
