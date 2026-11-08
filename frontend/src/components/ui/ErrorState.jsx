import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Enterprise Error State
 * Clean fallback for interrupted queries or failed telemetry streams.
 */
export function ErrorState({
  title = 'Failed to load telemetry',
  message = 'An unexpected network error interrupted data synchronization.',
  onRetry,
  compact = false,
  className = '',
}) {
  if (compact) {
    return (
      <div className={`flex items-center justify-between p-3 bg-status-critical-bg border border-status-critical-border rounded-lg text-xs text-status-critical ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{title}</span>
        </div>
        {onRetry && (
          <Button size="xs" variant="secondary" onClick={onRetry} icon={RefreshCw}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white border border-brand-border rounded-lg ${className}`}>
      <div className="w-10 h-10 rounded-full bg-status-critical-bg flex items-center justify-center text-status-critical mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-xs text-text-secondary max-w-sm mb-4">
        {message}
      </p>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry} icon={RefreshCw}>
          Retry Connection
        </Button>
      )}
    </div>
  );
}
