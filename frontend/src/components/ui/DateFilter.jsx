import React from 'react';
import { Calendar } from 'lucide-react';

const DEFAULT_PRESETS = [
  { id: '24h', label: 'Last 24h' },
  { id: 'today', label: 'Today (Live)' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'all', label: 'All Incident' },
];

/**
 * Enterprise Date & Operational Time Horizon Filter
 */
export function DateFilter({
  selected = 'today',
  onChange,
  presets = DEFAULT_PRESETS,
  className = '',
}) {
  return (
    <div className={`inline-flex items-center p-0.5 bg-steel-light border border-brand-border rounded-md ${className}`}>
      <div className="pl-2 pr-1 text-steel">
        <Calendar className="w-3.5 h-3.5" />
      </div>
      {presets.map((preset) => {
        const isActive = selected === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange?.(preset.id)}
            className={`
              px-2.5 py-1 text-xs font-medium rounded transition-all select-none
              ${isActive
                ? 'bg-white text-navy-primary shadow-subtle font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/50'
              }
            `}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
