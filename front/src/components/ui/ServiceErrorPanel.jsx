import React from 'react';
import {
  AlertTriangle,
  WifiOff,
  ServerCrash,
  ShieldX,
  Clock,
  AlertCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Button } from './Button.jsx';
import { StatusBadge } from './StatusBadge.jsx';

const VARIANT_CONFIG = {
  API_UNAVAILABLE:   { icon: WifiOff,       color: 'text-status-critical', bg: 'bg-status-critical-bg/40', border: 'border-status-critical-border', badge: 'critical' },
  NETWORK_ERROR:     { icon: ServerCrash,   color: 'text-status-critical', bg: 'bg-status-critical-bg/40', border: 'border-status-critical-border', badge: 'critical' },
  VALIDATION_ERROR:  { icon: AlertCircle,   color: 'text-status-warning',  bg: 'bg-status-warning-bg',     border: 'border-status-warning-border',  badge: 'warning'  },
  INFEASIBLE:        { icon: AlertTriangle, color: 'text-status-warning',  bg: 'bg-status-warning-bg',     border: 'border-status-warning-border',  badge: 'warning'  },
  SOLVER_INFEASIBLE: { icon: AlertTriangle, color: 'text-status-warning',  bg: 'bg-status-warning-bg',     border: 'border-status-warning-border',  badge: 'warning'  },
  PERMISSION_DENIED: { icon: ShieldX,       color: 'text-status-critical', bg: 'bg-status-critical-bg/40', border: 'border-status-critical-border', badge: 'critical' },
  STALE_DATA:        { icon: Clock,         color: 'text-status-warning',  bg: 'bg-status-warning-bg',     border: 'border-status-warning-border',  badge: 'warning'  },
  CANCELLED:         { icon: Clock,         color: 'text-text-secondary',  bg: 'bg-brand-bg',              border: 'border-brand-border',           badge: 'neutral'  },
  INCOMPLETE:        { icon: AlertCircle,   color: 'text-status-warning',  bg: 'bg-status-warning-bg',     border: 'border-status-warning-border',  badge: 'warning'  },
  FAILED:            { icon: ServerCrash,   color: 'text-status-critical', bg: 'bg-status-critical-bg/40', border: 'border-status-critical-border', badge: 'critical' },
};

const DEFAULT_CONFIG = {
  icon: AlertCircle,
  color: 'text-status-critical',
  bg: 'bg-status-critical-bg/40',
  border: 'border-status-critical-border',
  badge: 'critical',
};

/**
 * ServiceErrorPanel
 * Consistent error / failure state panel supporting all ServiceResponseCategory variants.
 *
 * Props:
 *   category      — string key from VARIANT_CONFIG (e.g. 'API_UNAVAILABLE')
 *   title         — short headline
 *   message       — descriptive message
 *   details       — string | string[] | object (shown in a mono code block)
 *   httpStatus    — numeric HTTP status code (optional, displayed when > 0)
 *   onRetry       — retry callback (shows Retry button when provided)
 *   onDismiss     — dismiss callback (shows × button when provided)
 *   retryLabel    — label for retry button (default: 'Retry')
 *   compact       — boolean; renders a slim inline strip instead of a full panel
 *   staleTimestamp— ISO timestamp; when set, shows "last valid at <time>" note
 *   className     — extra class string
 */
export function ServiceErrorPanel({
  category = 'FAILED',
  title,
  message,
  details,
  httpStatus,
  onRetry,
  onDismiss,
  retryLabel = 'Retry',
  compact = false,
  staleTimestamp,
  className = '',
}) {
  const cfg = VARIANT_CONFIG[category] || DEFAULT_CONFIG;
  const Icon = cfg.icon;

  const detailsText = details
    ? Array.isArray(details)
      ? details.join('\n')
      : typeof details === 'object'
      ? JSON.stringify(details, null, 2)
      : String(details)
    : null;

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between p-3 ${cfg.bg} border ${cfg.border} rounded-lg text-xs animate-in fade-in duration-200 ${className}`}
      >
        <div className={`flex items-center gap-2 ${cfg.color}`}>
          <Icon className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{title || category}</span>
          {message && <span className="text-text-secondary font-normal ml-1">{message}</span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onRetry && (
            <Button size="xs" variant="secondary" onClick={onRetry} icon={RefreshCw}>
              {retryLabel}
            </Button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-text-secondary hover:text-text-primary font-bold leading-none ml-1"
              aria-label="Dismiss"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 ${cfg.bg} border ${cfg.border} rounded-xl space-y-3 animate-in fade-in duration-200 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${cfg.bg} border ${cfg.border} shrink-0 mt-0.5`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-bold text-sm ${cfg.color}`}>
                {title || category}
              </span>
              <StatusBadge variant={cfg.badge} size="xs">
                {category}
              </StatusBadge>
              {httpStatus > 0 && (
                <span className="text-[10px] font-mono text-text-secondary">
                  HTTP {httpStatus}
                </span>
              )}
            </div>
            {message && (
              <p className="text-xs text-text-secondary mt-1">{message}</p>
            )}
            {detailsText && (
              <div className="mt-2 p-2 bg-white/90 rounded border border-brand-border font-mono text-[11px] text-text-secondary max-h-24 overflow-auto whitespace-pre-wrap">
                {detailsText}
              </div>
            )}
            {staleTimestamp && (
              <p className="text-[11px] text-text-secondary mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 inline" />
                Last valid result at{' '}
                <strong>{new Date(staleTimestamp).toLocaleTimeString()}</strong> —
                preserved for reference.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          {onRetry && (
            <Button size="xs" variant="primary" onClick={onRetry} icon={RefreshCw}>
              {retryLabel}
            </Button>
          )}
          {onDismiss && (
            <Button size="xs" variant="secondary" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
