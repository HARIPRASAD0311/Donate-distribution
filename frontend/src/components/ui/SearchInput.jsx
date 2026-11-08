import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Enterprise Search Input
 * Integrated search icon, clear button, and focus styling.
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search by code, facility, or keyword...',
  size = 'sm',
  shortcut,
  className = '',
  disabled = false,
  ...props
}) {
  const sizes = {
    sm: 'h-8 text-xs pl-8 pr-7',
    md: 'h-9 text-sm pl-9 pr-8',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5 left-2.5',
    md: 'w-4 h-4 left-3',
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className={`absolute text-text-secondary pointer-events-none ${iconSizes[size] || iconSizes.sm}`}
      />
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          w-full bg-white border border-brand-border rounded-md text-text-primary placeholder:text-text-muted
          transition-colors focus:outline-hidden focus:border-teal focus:ring-1 focus:ring-teal
          disabled:bg-brand-bg disabled:cursor-not-allowed
          ${sizes[size] || sizes.sm}
        `}
        {...props}
      />

      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 text-text-secondary hover:text-text-primary p-0.5 rounded transition-colors"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {!value && shortcut && (
        <kbd className="absolute right-2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-brand-bg border border-brand-border rounded">
          {shortcut}
        </kbd>
      )}
    </div>
  );
}
