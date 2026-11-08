import React, { useState } from 'react';
import {
  Layers,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Truck,
  Building,
  Users,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { NETWORK_STATES } from '../data/recoveryData.js';

/**
 * Area 3 & 6: Before-and-After Network State Visualization
 * Toggles and compares:
 * 1. BASELINE NETWORK (Pre-disruption)
 * 2. DISRUPTED NETWORK (Severed culverts, starving IDP clusters)
 * 3. PROPOSED RECOVERED NETWORK (River barges, helicopter winches, restored delivery)
 */
export function BeforeAfterNetworkView() {
  const [activeNetworkKey, setActiveNetworkKey] = useState('DISRUPTED'); // 'BASELINE' | 'DISRUPTED' | 'RECOVERED'
  const state = NETWORK_STATES[activeNetworkKey];

  return (
    <Card
      title="3 &amp; 6. Multi-State Network Topology Comparison"
      subtitle="Before-and-after spatial visualization comparing nominal, disrupted, and recovered supply routes"
      badge={<StatusBadge variant={state.statusVariant} size="xs">{state.label}</StatusBadge>}
      action={
        <div className="flex items-center gap-1.5 p-1 bg-brand-bg border border-brand-border rounded-lg">
          {['BASELINE', 'DISRUPTED', 'RECOVERED'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setActiveNetworkKey(k)}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                activeNetworkKey === k
                  ? 'bg-white text-navy-primary shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {k === 'BASELINE' ? '1. Baseline' : k === 'DISRUPTED' ? '2. Disrupted' : '3. Recovered'}
            </button>
          ))}
        </div>
      }
      noPadding
    >
      <div className="p-4 space-y-4">
        {/* Narrative Description Banner */}
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
          activeNetworkKey === 'DISRUPTED'
            ? 'bg-status-critical-bg/30 border-status-critical-border text-status-critical'
            : activeNetworkKey === 'RECOVERED'
            ? 'bg-teal-light/40 border-teal/40 text-navy-primary'
            : 'bg-brand-bg border-brand-border text-text-primary'
        }`}>
          <div className="flex items-center gap-2">
            {activeNetworkKey === 'DISRUPTED' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-status-critical" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-teal" />
            )}
            <span className="font-medium">{state.description}</span>
          </div>

          <StatusBadge variant={state.statusVariant} size="xs">
            {activeNetworkKey}
          </StatusBadge>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {state.nodes.map((node) => {
            let badgeVariant = 'neutral';
            let bgClass = 'bg-white border-brand-border';

            if (node.state === 'OPERATIONAL' || node.state === 'RESTORED' || node.state === 'AIR_RESTORED') {
              badgeVariant = 'success';
            } else if (node.state === 'STARVED_DEFICIT' || node.state === 'CUT_OFF') {
              badgeVariant = 'critical';
              bgClass = 'bg-status-critical-bg/20 border-status-critical-border';
            } else if (node.state === 'PARTIALLY_FLOODED' || node.state === 'ISOLATED' || node.state === 'CONSTRAINED') {
              badgeVariant = 'warning';
              bgClass = 'bg-status-warning-bg/20 border-status-warning-border';
            } else if (node.state === 'BARGE_CONNECTED' || node.state === 'RECONFIGURED') {
              badgeVariant = 'teal';
              bgClass = 'bg-teal-light/20 border-teal/30';
            }

            return (
              <div
                key={node.id}
                className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${bgClass}`}
              >
                <div>
                  <div className="font-mono text-[10px] font-bold text-navy-primary mb-0.5">
                    {node.id}
                  </div>
                  <div className="font-semibold text-text-primary text-[11px] leading-tight mb-2">
                    {node.name}
                  </div>
                </div>

                <StatusBadge variant={badgeVariant} size="xs">
                  {node.state.replace('_', ' ')}
                </StatusBadge>
              </div>
            );
          })}
        </div>

        {/* Connections & Transit Throughput Table */}
        <div className="border border-brand-border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-surface border-b border-brand-border text-text-secondary font-mono text-[11px]">
              <tr>
                <th className="py-2 px-3 font-semibold">Origin Node</th>
                <th className="py-2 px-3 font-semibold">Destination Node</th>
                <th className="py-2 px-3 font-semibold">Corridor Status</th>
                <th className="py-2 px-3 font-semibold text-right">Throughput Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {state.connections.map((conn, idx) => (
                <tr key={idx} className="hover:bg-brand-bg/50">
                  <td className="py-2 px-3 font-mono font-bold text-navy-primary">{conn.from}</td>
                  <td className="py-2 px-3 font-mono font-bold text-navy-primary">{conn.to}</td>
                  <td className="py-2 px-3">
                    <StatusBadge
                      variant={
                        conn.state.includes('SEVERED') || conn.state.includes('CRITICAL')
                          ? 'critical'
                          : conn.state.includes('BARGE') || conn.state.includes('AIR')
                          ? 'teal'
                          : 'success'
                      }
                      size="xs"
                    >
                      {conn.state.replace('_', ' ')}
                    </StatusBadge>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-navy-primary">
                    {conn.throughput}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
