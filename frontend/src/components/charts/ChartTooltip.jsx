import React from 'react';

/**
 * Enterprise Recharts Custom Tooltip
 * High contrast, tabular numbers, color swatch indicator.
 */
export function ChartTooltip({ active, payload, label, unit = '', valueFormatter }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-brand-border rounded-lg shadow-dropdown p-2.5 text-xs z-50">
      {label && (
        <div className="font-semibold text-text-primary pb-1.5 mb-1.5 border-b border-brand-border-light">
          {label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const formattedVal = valueFormatter
            ? valueFormatter(entry.value)
            : new Intl.NumberFormat('en-US').format(entry.value);

          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-xs shrink-0"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-text-secondary">{entry.name}:</span>
              </div>
              <span className="font-bold text-text-primary text-tabular">
                {formattedVal} {unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
