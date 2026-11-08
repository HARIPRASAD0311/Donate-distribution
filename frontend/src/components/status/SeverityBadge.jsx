import React from 'react';
import { INCIDENT_SEVERITY, DEMAND_PRIORITY } from '../../types/constants.js';

export function SeverityBadge({ level }) {
  const isCritical = level === INCIDENT_SEVERITY.LEVEL_3_EMERGENCY || 
                     level === INCIDENT_SEVERITY.LEVEL_4_CATASTROPHIC || 
                     level === DEMAND_PRIORITY.CRITICAL;

  const isWarning = level === INCIDENT_SEVERITY.LEVEL_2_ELEVATED || 
                    level === DEMAND_PRIORITY.HIGH;

  if (isCritical) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-status-critical-bg text-status-critical border border-status-critical-border">
        <span className="w-1.5 h-1.5 rounded-full bg-status-critical animate-pulse" />
        {level}
      </span>
    );
  }

  if (isWarning) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-status-warning-bg text-status-warning border border-status-warning-border">
        <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
        {level}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-steel-light text-text-secondary border border-brand-border">
      <span className="w-1.5 h-1.5 rounded-full bg-steel" />
      {level || 'NORMAL'}
    </span>
  );
}
