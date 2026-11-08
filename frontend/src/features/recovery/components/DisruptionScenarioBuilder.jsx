import React, { useState } from 'react';
import {
  AlertTriangle,
  CloudRain,
  ShieldAlert,
  HeartPulse,
  Sliders,
  Plus,
  Trash2,
  RotateCcw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { DISRUPTION_TEMPLATES } from '../data/recoveryData.js';

/**
 * Area 2: Disruption Scenario Builder E(t)
 * Configures shock events across Flood, Conflict, and Pandemic archetypes.
 */
export function DisruptionScenarioBuilder({
  activeScenarioKey = 'FLOOD',
  onSelectScenarioKey,
  scenarioData,
  onChangeParameter,
  onResetScenario,
}) {
  const scenario = scenarioData || DISRUPTION_TEMPLATES[activeScenarioKey];

  return (
    <Card
      title="2. Disruption Scenario Builder: External Shock E(t)"
      subtitle="Model acute hazards, infrastructure failures, route blockages, and sudden demand surges"
      badge={<StatusBadge variant="critical" size="xs">EXTERNAL EVENT: E(t)</StatusBadge>}
      action={
        <button
          type="button"
          onClick={onResetScenario}
          className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Parameters
        </button>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Scenario Archetype Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5">
            Crisis Archetype Templates
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { key: 'FLOOD', title: 'Flood / Cyclone Inundation', icon: CloudRain, desc: 'Road washout, bridge submersion, isolated enclaves' },
              { key: 'CONFLICT', title: 'Armed Conflict Blockade', icon: ShieldAlert, desc: 'Perimeter restriction, checkpoints, displacement surge' },
              { key: 'PANDEMIC', title: 'Epidemic Triage & Excursion', icon: HeartPulse, desc: 'Cholera surge, staff quarantine, cold-chain failure' },
            ].map((tmpl) => {
              const isSelected = activeScenarioKey === tmpl.key;
              const Icon = tmpl.icon;
              return (
                <div
                  key={tmpl.key}
                  onClick={() => onSelectScenarioKey?.(tmpl.key)}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5
                    ${isSelected
                      ? 'bg-status-critical-bg/30 border-status-critical-border ring-1 ring-status-critical shadow-sm'
                      : 'bg-white border-brand-border hover:bg-brand-bg/60'
                    }
                  `}
                >
                  <div className={`p-1.5 rounded shrink-0 ${isSelected ? 'bg-status-critical text-white' : 'bg-steel-light text-text-secondary'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-navy-primary block">{tmpl.title}</span>
                    <span className="text-[11px] text-text-secondary leading-snug">{tmpl.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Scenario Narrative */}
        <div className="p-3 bg-brand-bg border border-brand-border rounded-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-navy-primary text-xs">{scenario.name}</span>
            <span className="font-mono text-[10px] text-status-critical font-bold">
              ESTIMATED UNMET IMPACT: +{new Intl.NumberFormat().format(scenario.estimatedUnmetSurge)} units
            </span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            {scenario.description}
          </p>
        </div>

        {/* Editable Disruption Parameters Table */}
        <div className="space-y-2">
          <span className="font-bold text-navy-primary text-[11px] uppercase tracking-wider font-mono block">
            Configurable Disruption Parameters (Impacted Nodes &amp; Corridors)
          </span>

          <div className="border border-brand-border rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-surface border-b border-brand-border text-text-secondary font-mono text-[11px]">
                <tr>
                  <th className="py-2 px-3 font-semibold">Hazard Element</th>
                  <th className="py-2 px-3 font-semibold">Target Asset / Node</th>
                  <th className="py-2 px-3 font-semibold">Disruption Magnitude (Editable)</th>
                  <th className="py-2 px-3 font-semibold text-center">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-light">
                {scenario.parameters.map((param, idx) => (
                  <tr key={param.id} className="hover:bg-brand-bg/50">
                    <td className="py-2 px-3 font-semibold text-navy-primary">{param.name}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-text-secondary">{param.target}</td>
                    <td className="py-1 px-3">
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) => onChangeParameter?.(idx, e.target.value)}
                        className="w-full h-7 px-2 text-xs rounded border border-brand-border font-mono text-navy-primary focus:outline-none focus:border-teal"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <StatusBadge
                        variant={param.severity === 'CRITICAL' ? 'critical' : 'warning'}
                        size="xs"
                      >
                        {param.severity}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
}
