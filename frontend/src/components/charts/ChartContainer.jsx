import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { Skeleton } from '../ui/Skeleton.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { BarChart3 } from 'lucide-react';

/**
 * Enterprise Chart Container
 * Standardizes responsive sizing, header controls, empty states, and axis theme tokens.
 */
export function ChartContainer({
  title,
  subtitle,
  action,
  height = 260,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No chart telemetry available',
  children,
  className = '',
}) {
  return (
    <div className={`bg-white border border-brand-border rounded-lg shadow-subtle flex flex-col ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between gap-3 bg-white rounded-t-lg">
          <div>
            {title && (
              <h3 className="text-card-title text-text-primary">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-text-secondary mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col justify-center">
        {isLoading ? (
          <Skeleton variant="rect" height={height} />
        ) : isEmpty ? (
          <EmptyState
            icon={BarChart3}
            title="No chart data"
            description={emptyMessage}
            className="border-0 shadow-none p-4"
          />
        ) : (
          <div style={{ width: '100%', height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

/** Standard Recharts axis and grid styling constants */
export const CHART_THEME = {
  grid: {
    stroke: '#E9EFF4',
    strokeDasharray: '3 3',
  },
  axis: {
    stroke: '#CAD4DE',
    tick: { fill: '#667085', fontSize: 11, fontFamily: 'Inter, sans-serif' },
    tickLine: false,
  },
  colors: {
    navyPrimary: '#142B43',
    navySecondary: '#1D3B56',
    teal: '#176B76',
    steel: '#60758A',
    success: '#27856F',
    warning: '#D99A35',
    critical: '#C94C4C',
  },
};
