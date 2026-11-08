import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  ALERT_SEVERITY,
  ALERT_SEVERITY_STYLES,
} from '../../../domain/geographicAlertsModel.js';

export function GeographicAlertPanel({
  alerts = [],
  onSelectAlert,
  onDismissAlert,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!alerts || alerts.length === 0) {
    return null;
  }

  const criticalCount = alerts.filter((a) => a.severity === ALERT_SEVERITY.CRITICAL).length;
  const highCount = alerts.filter((a) => a.severity === ALERT_SEVERITY.HIGH).length;
  const warningCount = alerts.filter((a) => a.severity === ALERT_SEVERITY.WARNING).length;

  return (
    <div className="absolute top-14 right-3 z-20 max-w-sm sm:max-w-md w-full pointer-events-auto select-none transition-all duration-200">
      <div className="bg-white/95 backdrop-blur-md border border-brand-border rounded-xl shadow-dropdown overflow-hidden">
        {/* Header Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer bg-slate-50/80 hover:bg-slate-100/80 transition-colors border-b border-brand-border/60"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-status-critical-bg text-status-critical">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-text-primary tracking-wide">
                  Geographic Risk Alerts
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-critical-bg text-status-critical border border-status-critical-border">
                  {alerts.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-0.5">
                {criticalCount > 0 && (
                  <span className="text-status-critical font-medium">
                    {criticalCount} Critical
                  </span>
                )}
                {criticalCount > 0 && highCount > 0 && <span>•</span>}
                {highCount > 0 && (
                  <span className="text-status-warning font-medium">
                    {highCount} High
                  </span>
                )}
                {(criticalCount > 0 || highCount > 0) && warningCount > 0 && <span>•</span>}
                {warningCount > 0 && (
                  <span className="text-amber-600 font-medium">
                    {warningCount} Warning
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-slate-200/50 transition-colors"
              title={isExpanded ? 'Collapse alerts' : 'Expand alerts'}
              aria-label={isExpanded ? 'Collapse alerts' : 'Expand alerts'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Alert List */}
        {isExpanded && (
          <div className="max-h-80 overflow-y-auto divide-y divide-brand-border/60 bg-white">
            {alerts.map((alert) => {
              const style = ALERT_SEVERITY_STYLES[alert.severity] || ALERT_SEVERITY_STYLES[ALERT_SEVERITY.INFO];

              return (
                <div
                  key={alert.id}
                  className="p-3 hover:bg-slate-50 transition-colors flex flex-col gap-1.5 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Severity Pill */}
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: style.bg,
                          color: style.color,
                          border: `1px solid ${style.border}`,
                        }}
                      >
                        {alert.severity}
                      </span>

                      {/* Exposure Classification Tag */}
                      {alert.isPotentialExposure && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          Potential Exposure
                        </span>
                      )}
                      {alert.isConfirmedIncident && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Confirmed Disruption
                        </span>
                      )}
                      {!alert.isPotentialExposure && !alert.isConfirmedIncident && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Data Notice
                        </span>
                      )}
                    </div>

                    {/* Dismiss Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismissAlert?.(alert.id);
                      }}
                      className="text-text-muted hover:text-status-critical p-1 rounded hover:bg-slate-100 transition-colors"
                      title="Dismiss alert"
                      aria-label="Dismiss alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary leading-snug">
                      {alert.title}
                    </h4>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>

                  {/* Footer & Actions */}
                  <div className="flex items-center justify-between pt-1 text-[10px] text-text-muted border-t border-slate-100 mt-1">
                    <span className="truncate max-w-[200px]" title={alert.source}>
                      Src: {alert.source || 'Operational Telemetry'}
                    </span>

                    {alert.coordinates && (
                      <button
                        type="button"
                        onClick={() => onSelectAlert?.(alert)}
                        className="inline-flex items-center gap-1 font-semibold text-brand-primary hover:text-brand-primary-dark transition-colors"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Locate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

