import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

/**
 * SuccessBanner
 * A slim auto-dismissable success strip.
 *
 * Props:
 *   message      — primary success text
 *   detail       — secondary detail (smaller, muted)
 *   onDismiss    — callback when user dismisses (or auto-dismiss fires)
 *   autoDismissMs— milliseconds before auto-dismiss (default: 5000, 0 = never)
 *   className    — extra class string
 */
export function SuccessBanner({
  message,
  detail,
  onDismiss,
  autoDismissMs = 5000,
  className = '',
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoDismissMs) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className={`flex items-center justify-between p-3 bg-status-success-bg border border-status-success-border rounded-xl text-xs animate-in fade-in duration-200 ${className}`}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
        <div>
          {message && (
            <span className="font-semibold text-text-primary">{message}</span>
          )}
          {detail && (
            <span className="text-text-secondary ml-2">{detail}</span>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="text-text-secondary hover:text-text-primary ml-2 shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
