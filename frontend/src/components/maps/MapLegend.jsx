import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Enterprise Map Legend
 * Floating or inline legend for Leaflet GIS layers, corridor status, and facility symbols.
 */
export function MapLegend({
  title = 'Map Legend',
  items = [],
  collapsible = true,
  position = 'inline',
  className = '',
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const positionStyles = {
    inline: 'relative',
    'bottom-left': 'absolute bottom-4 left-4 z-20',
    'bottom-right': 'absolute bottom-4 right-4 z-20',
    'top-right': 'absolute top-4 right-4 z-20',
  };

  return (
    <div
      className={`
        bg-white/95 backdrop-blur-xs border border-brand-border rounded-lg shadow-dropdown p-3 text-xs
        ${positionStyles[position] || positionStyles.inline}
        ${className}
      `}
    >
      <div
        className={`flex items-center justify-between gap-2 font-semibold text-text-primary ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-teal" />
          <span>{title}</span>
        </div>
        {collapsible && (
          <button type="button" className="text-text-secondary hover:text-text-primary">
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="mt-2.5 pt-2 border-t border-brand-border-light space-y-1.5">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-2">
                {item.type === 'line' ? (
                  <span
                    className="w-4 h-1 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                ) : item.type === 'dashed' ? (
                  <span
                    className="w-4 h-0.5 border-b-2 border-dashed shrink-0"
                    style={{ borderColor: item.color }}
                  />
                ) : (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="text-text-secondary">{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className="font-mono font-semibold text-text-primary text-[10px] px-1 bg-brand-bg rounded">
                  {item.count}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
