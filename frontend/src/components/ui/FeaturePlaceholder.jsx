import React from 'react';
import { Layers, Cpu, Globe, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { DEMO_CONFIG } from '../../mock-data/config.js';
import { Card } from './Card.jsx';
import { PageHeader } from './PageHeader.jsx';
import { StatusBadge } from './StatusBadge.jsx';

export function FeaturePlaceholder({
  moduleNumber,
  title,
  subtitle,
  icon: Icon = Layers,
  coreCapabilities = [],
}) {
  const { selectedIncident, selectedCrisisType, selectedRegion } = useAppStore();

  return (
    <div className="space-y-5">
      {/* Reusable Page Header with Persistent Global Selections */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={Icon}
        badge={
          <StatusBadge variant="teal" size="xs">
            {DEMO_CONFIG.demoWatermark}
          </StatusBadge>
        }
        actions={
          <div className="flex items-center gap-1.5 text-xs font-mono text-steel bg-white px-2.5 py-1.5 rounded-md border border-brand-border shadow-subtle">
            <Cpu className="w-3.5 h-3.5 text-status-warning" />
            <span>MODULE {moduleNumber} OPERATIONAL</span>
          </div>
        }
      />

      {/* Synchronized Context Telemetry Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white border border-brand-border rounded-lg shadow-subtle flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-teal-light text-teal flex items-center justify-center font-bold text-xs">
            INC
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-text-secondary uppercase block">ACTIVE INCIDENT</span>
            <span className="text-xs font-semibold text-text-primary truncate block">{selectedIncident?.name}</span>
          </div>
        </div>

        <div className="p-3 bg-white border border-brand-border rounded-lg shadow-subtle flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-navy-secondary text-white flex items-center justify-center font-bold text-xs">
            CLS
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-text-secondary uppercase block">CRISIS CLASSIFICATION</span>
            <span className="text-xs font-semibold text-navy-primary truncate block">{selectedCrisisType}</span>
          </div>
        </div>

        <div className="p-3 bg-white border border-brand-border rounded-lg shadow-subtle flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-steel-light text-steel flex items-center justify-center font-bold text-xs">
            REG
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-text-secondary uppercase block">ACTIVE CORRIDOR</span>
            <span className="text-xs font-semibold text-text-primary truncate block">{selectedRegion}</span>
          </div>
        </div>
      </div>

      {/* Structured Wireframe Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card
            title="Operational Analytical Workspace"
            subtitle="Configured for subsequent domain implementation"
            noPadding
          >
            <div className="h-64 flex flex-col items-center justify-center p-6 text-center bg-brand-bg/40">
              <div className="w-10 h-10 rounded-full bg-steel-light flex items-center justify-center text-steel mb-2.5">
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-text-primary mb-1">
                {title} Analytical Viewport
              </p>
              <p className="text-xs text-text-secondary max-w-sm">
                Responsive workspace configured with fixed sidebar offset, compact global header, and synchronized Zustand state.
              </p>
            </div>
          </Card>
        </div>

        <div>
          <Card
            title="Planned Architecture & Specifications"
            subtitle="Module Specifications"
          >
            <ul className="space-y-2.5">
              {coreCapabilities.map((cap, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="text-teal font-bold font-mono mt-0.5">•</span>
                  <span className="leading-relaxed">{cap}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
