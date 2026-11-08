import React, { useState } from 'react';
import {
  ArrowRight,
  AlertTriangle,
  Building,
  Truck,
  Users,
  Layers,
  ShieldAlert,
  CheckCircle2,
  Ship,
  Plane,
  X,
  Info,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { SUPPLY_CHAIN_NETWORK } from '../data/allocationData.js';

/**
 * Enterprise Multi-Echelon Network Flow Diagram
 * Suppliers -> Tier-I Foodbanks -> Tier-II FRRAs -> Distribution Centres -> Beneficiaries
 */
export function SupplyChainFlowDiagram({ network = SUPPLY_CHAIN_NETWORK, onSelectNode }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const echelons = [
    { key: 'SUPPLIER', title: '1. Donors & Suppliers', icon: Building },
    { key: 'TIER_1_DEPOT', title: '2. Tier-I Staging Depots', icon: Layers },
    { key: 'TIER_2_FRRA', title: '3. Tier-II FRRA Hubs', icon: Truck },
    { key: 'DISTRIBUTION_CENTRE', title: '4. Distribution Centres', icon: Building },
    { key: 'BENEFICIARY', title: '5. Beneficiary Settlements', icon: Users },
  ];

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    onSelectNode?.(node);
  };

  return (
    <Card
      title="Multi-Echelon Humanitarian Supply Network Flow"
      subtitle="End-to-end commodity velocity, throughput bottlenecks, and route capacity utilization"
      badge={<StatusBadge variant="teal" size="xs">NETWORK FLOW SOLVER</StatusBadge>}
      noPadding
    >
      <div className="p-4 space-y-4">
        {/* Horizontal Network Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {echelons.map((ech, idx) => {
            const nodesInEchelon = network.nodes.filter((n) => n.echelon === ech.key);
            const Icon = ech.icon;

            return (
              <div key={ech.key} className="flex flex-col space-y-2.5">
                {/* Column Header */}
                <div className="flex items-center gap-1.5 pb-1.5 border-b border-brand-border">
                  <div className="p-1 rounded bg-teal-light text-teal shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-navy-primary truncate">{ech.title}</h4>
                </div>

                {/* Nodes Stack */}
                <div className="space-y-2 flex-1">
                  {nodesInEchelon.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const hasBottleneck = Boolean(node.bottleneck);

                    return (
                      <div
                        key={node.id}
                        onClick={() => handleNodeClick(node)}
                        className={`
                          p-2.5 rounded-lg border cursor-pointer transition-all text-xs flex flex-col justify-between relative
                          ${isSelected
                            ? 'border-navy-primary bg-brand-surface ring-2 ring-navy-primary/20 shadow-md'
                            : hasBottleneck
                            ? 'border-status-warning-border bg-status-warning-bg/25 hover:border-status-warning'
                            : 'border-brand-border bg-white hover:border-teal hover:shadow-subtle'
                          }
                        `}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="font-mono text-[10px] font-bold text-navy-primary bg-brand-bg px-1 rounded">
                              {node.id}
                            </span>
                            <StatusBadge
                              variant={hasBottleneck ? 'warning' : 'success'}
                              size="xs"
                            >
                              {hasBottleneck ? 'CONSTRAINED' : 'ACTIVE'}
                            </StatusBadge>
                          </div>

                          <div className="font-bold text-text-primary text-[11px] leading-tight mb-1">
                            {node.name}
                          </div>

                          {node.stockAvailable && (
                            <div className="text-[10px] text-text-secondary truncate font-mono">
                              Stock: {node.stockAvailable}
                            </div>
                          )}

                          {node.demand && (
                            <div className="text-[10px] text-status-critical font-mono font-semibold truncate">
                              Req: {node.demand}
                            </div>
                          )}

                          {node.capacityM3 && (
                            <div className="mt-1.5 space-y-0.5">
                              <div className="flex justify-between text-[10px] text-text-secondary font-mono">
                                <span>Cap Util:</span>
                                <span>{node.utilizedM3 || 0} / {node.capacityM3} m³</span>
                              </div>
                              <div className="w-full h-1 rounded-full bg-steel-light overflow-hidden">
                                <div
                                  className="h-full bg-teal rounded-full"
                                  style={{ width: `${Math.min(100, Math.round(((node.utilizedM3 || 1) / node.capacityM3) * 100))}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottleneck Warning Callout */}
                        {hasBottleneck && (
                          <div className="mt-2 pt-1 border-t border-status-warning-border/50 flex items-center gap-1 text-[10px] text-status-warning">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span className="truncate">{node.bottleneck}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Route Flows Strip */}
        <div className="p-3 bg-brand-bg border border-brand-border rounded-lg text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-navy-primary text-[11px] uppercase tracking-wider font-mono">
              Synchronized Multi-Echelon Pipeline Flows
            </span>
            <span className="text-[10px] text-text-secondary font-mono">
              9 Active Corridor Assignments
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {network.flows.slice(0, 6).map((flow, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-white border border-brand-border-light flex items-center justify-between text-[11px]"
              >
                <div>
                  <div className="font-mono font-semibold text-navy-primary flex items-center gap-1">
                    <span>{flow.from}</span>
                    <ArrowRight className="w-3 h-3 text-teal" />
                    <span>{flow.to}</span>
                  </div>
                  <div className="text-[10px] text-text-secondary">{flow.mode}</div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-teal">
                    {new Intl.NumberFormat().format(flow.qty)} <span className="text-[9px]">{flow.unit}</span>
                  </div>
                  <span className={`text-[9px] font-mono px-1 rounded ${
                    flow.status === 'BOTTLENECK'
                      ? 'bg-status-warning-bg text-status-warning font-semibold'
                      : 'bg-status-success-bg text-status-success'
                  }`}>
                    {flow.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Node Details Drawer / Popover */}
        {selectedNode && (
          <div className="p-3.5 bg-white border border-brand-border rounded-lg shadow-sm text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-navy-primary text-sm">{selectedNode.id}</span>
                <span className="font-semibold text-text-primary text-sm">{selectedNode.name}</span>
                <StatusBadge variant="teal" size="xs">{selectedNode.echelon}</StatusBadge>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-brand-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded bg-brand-bg">
                <span className="text-text-secondary block">Available Stock:</span>
                <strong className="text-navy-primary">{selectedNode.stockAvailable || 'Terminal Node'}</strong>
              </div>
              <div className="p-2 rounded bg-brand-bg">
                <span className="text-text-secondary block">Physical Capacity:</span>
                <strong className="text-navy-primary">{selectedNode.capacityM3 ? `${selectedNode.capacityM3} m³` : 'N/A'}</strong>
              </div>
              <div className="p-2 rounded bg-brand-bg">
                <span className="text-text-secondary block">Active Bottleneck:</span>
                <strong className={selectedNode.bottleneck ? 'text-status-warning' : 'text-status-success'}>
                  {selectedNode.bottleneck || 'None (Unrestricted)'}
                </strong>
              </div>
              <div className="p-2 rounded bg-brand-bg">
                <span className="text-text-secondary block">Operational State:</span>
                <strong className="text-teal font-mono">{selectedNode.status}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
