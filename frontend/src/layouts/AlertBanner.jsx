import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';

export function AlertBanner() {
  const { alerts, dismissAlert } = useAppStore();

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-status-critical-bg border-b border-status-critical-border px-4 py-2 flex items-center justify-between text-xs text-status-critical shadow-subtle">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-status-critical shrink-0 animate-pulse" />
        <span className="font-bold font-mono text-[11px] uppercase tracking-wide">
          TACTICAL ALERT:
        </span>
        <span className="text-text-primary font-medium">{alerts[0].message}</span>
      </div>
      <button
        type="button"
        onClick={() => dismissAlert(alerts[0].id)}
        className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-black/5 transition-colors"
        title="Dismiss Alert"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
