import React from 'react';
import {
  AlertTriangle,
  GitBranch,
  Building,
  CheckSquare,
  History,
  ArrowRight,
  ShieldAlert,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';

export function OperationalPanels({
  panelsData,
  onInspectDisruption,
  onAuthorizeDecision,
  onInspectIncident,
}) {
  const {
    criticalIncidents = [],
    activeDisruptions = [],
    facilityStatus = [],
    pendingDecisions = [],
    recentEvents = [],
  } = panelsData || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
      {/* 1. Critical Incidents */}
      <Card
        title="Critical Incidents"
        badge={<StatusBadge variant="critical" size="xs" pulse>{criticalIncidents.length} ACTIVE</StatusBadge>}
        noPadding
        className="h-full"
      >
        <div className="divide-y divide-brand-border-light p-2.5 space-y-2">
          {criticalIncidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => onInspectIncident?.(inc)}
              className="p-1.5 rounded bg-brand-surface-hover hover:bg-brand-bg cursor-pointer transition-colors text-xs"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-status-critical flex items-center gap-1 truncate text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {inc.title}
                </span>
                <span className="text-[10px] font-mono text-text-secondary shrink-0">{inc.time}</span>
              </div>
              <div className="text-[10px] text-text-secondary truncate mt-0.5 font-mono">
                {inc.summary}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. Active Disruptions */}
      <Card
        title="Corridor Disruptions"
        badge={<StatusBadge variant="warning" size="xs">{activeDisruptions.length} ROADBLOCKS</StatusBadge>}
        noPadding
        className="h-full"
      >
        <div className="divide-y divide-brand-border-light p-2.5 space-y-2">
          {activeDisruptions.map((disr) => (
            <div
              key={disr.id}
              onClick={() => onInspectDisruption?.(disr)}
              className="p-1.5 rounded bg-status-warning-bg/40 border border-status-warning-border/50 hover:bg-status-warning-bg/70 cursor-pointer transition-colors text-xs"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-navy-primary truncate text-xs">{disr.name}</span>
                <span className="text-[10px] font-mono text-status-warning font-bold shrink-0">{disr.delay}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-text-secondary mt-0.5">
                <span className="truncate">{disr.corridor}</span>
                <span className="text-teal font-medium text-[9px] font-mono shrink-0">{disr.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Facility Operational Status */}
      <Card
        title="Facility Readiness"
        badge={<StatusBadge variant="teal" size="xs">DEPOTS</StatusBadge>}
        noPadding
        className="h-full"
      >
        <div className="p-2.5 space-y-2.5 text-xs">
          {facilityStatus.map((fac) => (
            <div key={fac.code} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-text-primary truncate">{fac.name}</span>
                <span className="font-mono text-text-secondary font-bold text-[10px] shrink-0">{fac.util}%</span>
              </div>
              {/* Capacity Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-steel-light overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    fac.util > 85 ? 'bg-status-warning' : 'bg-teal'
                  }`}
                  style={{ width: `${fac.util}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Pending Coordinator Decisions */}
      <Card
        title="Pending Sign-Offs"
        badge={<StatusBadge variant="navy" size="xs">{pendingDecisions.length} REQUIRED</StatusBadge>}
        noPadding
        className="h-full"
      >
        <div className="divide-y divide-brand-border-light p-2.5 space-y-2">
          {pendingDecisions.map((dec) => (
            <div key={dec.id} className="p-1.5 rounded bg-brand-bg text-xs space-y-1">
              <div className="font-semibold text-text-primary flex items-center gap-1 text-xs">
                <CheckSquare className="w-3 h-3 text-teal shrink-0" />
                <span className="truncate">{dec.title}</span>
              </div>
              <div className="text-[10px] text-text-secondary truncate font-mono">
                {dec.consequence}
              </div>
              <button
                type="button"
                onClick={() => onAuthorizeDecision?.(dec)}
                className="w-full mt-0.5 py-0.5 px-2 bg-teal hover:bg-teal-hover text-white rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
              >
                <span>Sign Action</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Recent Operational Events */}
      <Card
        title="Recent Events Log"
        badge={<StatusBadge variant="neutral" size="xs">LIVE FEED</StatusBadge>}
        noPadding
        className="h-full"
      >
        <div className="p-2.5 divide-y divide-brand-border-light space-y-1.5 text-xs">
          {recentEvents.map((evt) => (
            <div key={evt.id} className="pt-1 first:pt-0">
              <div className="flex items-center gap-1 text-[10px] font-mono text-text-secondary">
                <Clock className="w-2.5 h-2.5 text-steel shrink-0" />
                <span>{evt.time}</span>
              </div>
              <div className="text-[10px] text-text-primary truncate font-medium mt-0.5">
                {evt.text}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
