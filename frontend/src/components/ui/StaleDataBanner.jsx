import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * StaleDataBanner
 * A slim amber warning strip indicating that displayed data is from a previous
 * successful request and may no longer reflect the current backend state.
 *
 * Props:
 *   timestamp  — ISO 8601 string of when the last valid data was obtained
 *   onRefresh  — callback to re-fetch; when provided, shows a Refresh button
 *   label      — descriptive label (default: 'Displaying cached data')
 *   className  — extra class string
 */
export function StaleDataBanner({
  timestamp,
  onRefresh,
  label = 'Displaying cached data',
  className = '',
}) {
  return (
    <div
      className={`flex items-center justify-between p-2.5 bg-status-warning-bg border border-status-warning-border rounded-lg text-xs animate-in fade-in duration-200 ${className}`}
    >
      <div className="flex items-center gap-2 text-text-secondary">
        <Clock className="w-3.5 h-3.5 text-status-warning shrink-0" />
        <span>
          <strong className="text-status-warning">{label}</strong>
          {timestamp && (
            <span className="ml-1.5 font-mono">
              from {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
          . Current request failed — data may be outdated.
        </span>
      </div>
      {onRefresh && (
        <Button
          size="xs"
          variant="secondary"
          onClick={onRefresh}
          icon={RefreshCw}
          className="shrink-0 ml-3"
        >
          Refresh
        </Button>
      )}
    </div>
  );
}
