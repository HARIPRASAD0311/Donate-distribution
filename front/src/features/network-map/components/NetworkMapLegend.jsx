import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { GEO_TYPE_STYLES } from './GeoModelMarkerLayer.jsx';
import { GEOGRAPHIC_LOCATION_TYPE } from '../../../domain/geographicModel.js';

export function NetworkMapLegend() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute bottom-4 right-4 z-20 pointer-events-auto bg-white/95 backdrop-blur-md border border-brand-border rounded-xl shadow-dropdown p-3 text-xs max-w-xs transition-all">
      <div
        className="flex items-center justify-between gap-3 font-bold text-navy-primary cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-teal" />
          <span>Network Map Symbology</span>
        </div>
        <button type="button" className="text-text-secondary hover:text-text-primary">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded ? (
        <div className="mt-3 pt-2.5 border-t border-brand-border-light space-y-3">
          {/* Entity Types */}
          <div>
            <div className="text-[10px] font-mono text-text-secondary uppercase font-bold mb-1.5">
              1. Echelon Nodes
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#142B43] border border-white shrink-0" />
                <span className="text-text-primary truncate">Institutional Donor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#1D3B56] border border-white shrink-0" />
                <span className="text-text-primary truncate">Supplier</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#142B43] border border-teal shrink-0" />
                <span className="text-text-primary truncate">Tier-I Depot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#176B76] border border-white shrink-0" />
                <span className="text-text-primary truncate">Tier-II FRRA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#60758A] border border-white shrink-0" />
                <span className="text-text-primary truncate">Field DC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#C94C4C] border border-white shrink-0" />
                <span className="text-text-primary truncate">Beneficiary Camp</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#D99A35] border border-white shrink-0" />
                <span className="text-text-primary truncate">Community Pocket</span>
              </div>
            </div>
          </div>

          {/* GIS Entity Types (Stage 4.2) */}
          <div>
            <div className="text-[10px] font-mono text-text-secondary uppercase font-bold mb-1.5">
              2. GIS Geographic Entities
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
              {Object.values(GEOGRAPHIC_LOCATION_TYPE).map((type) => {
                const style = GEO_TYPE_STYLES[type];
                if (!style) return null;
                return (
                  <div key={type} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-white"
                      style={{ backgroundColor: style.bg }}
                    />
                    <span className="text-text-primary truncate">{style.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-3 text-[10px] text-text-secondary border-t border-brand-border-light pt-1.5">
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-500" /> Operational</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Constrained</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-500" /> Critical</span>
            </div>
          </div>

          {/* Corridor States (Stage 4.3 Standardized) */}
          <div>
            <div className="text-[10px] font-mono text-text-secondary uppercase font-bold mb-1.5 flex items-center justify-between">
              <span>3. Transport Corridors</span>
              <span className="text-[9px] text-teal">Directional Chevrons</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-1 rounded-full bg-status-success shrink-0" />
                  <span className="text-text-primary">Active (In-Transit)</span>
                </div>
                <span className="text-[10px] text-status-success font-medium">Moving</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-1 border-b-2 border-dashed border-status-warning shrink-0" />
                  <span className="text-text-primary">Delayed / Restricted</span>
                </div>
                <span className="text-[10px] text-status-warning font-medium">Caution</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-1 border-b-2 border-dashed border-status-critical shrink-0" />
                  <span className="text-text-primary">Blocked / Impassable</span>
                </div>
                <span className="text-[10px] text-status-critical font-medium">Closed</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-1 border-b-2 border-dotted border-blue-500 shrink-0" />
                  <span className="text-text-primary">Planned / Staged</span>
                </div>
                <span className="text-[10px] text-blue-600 font-medium">Queued</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-1 border-b-2 border-dotted border-steel shrink-0" />
                  <span className="text-text-primary">Completed / Delivered</span>
                </div>
                <span className="text-[10px] text-steel font-medium">Verified</span>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-text-secondary border-t border-brand-border-light pt-1.5 flex items-center justify-between font-mono">
              <span>[GIS ROAD] Road-following</span>
              <span>[DEMO] Illustrative</span>
            </div>
          </div>

          {/* 4. Disaster Risk Severity Overlays (Stage 4.4) */}
          <div>
            <div className="text-[10px] font-mono text-text-secondary uppercase font-bold mb-1.5 flex items-center justify-between">
              <span>4. Geographical Disaster Risk</span>
              <span className="text-[9px] text-teal font-mono">GeoJSON Boundaries</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-3 rounded border border-red-500 bg-red-500/20 shrink-0" />
                <span className="text-text-primary">Critical Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-3 rounded border border-orange-500 bg-orange-500/20 shrink-0" />
                <span className="text-text-primary">High Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-3 rounded border border-amber-500 bg-amber-500/20 shrink-0" />
                <span className="text-text-primary">Moderate Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-3 rounded border border-emerald-500 bg-emerald-500/20 shrink-0" />
                <span className="text-text-primary">Low Risk</span>
              </div>
            </div>
            <div className="mt-1.5 text-[9px] text-text-secondary italic">
              Transparent GeoJSON fills preserve underlying facilities and transport routes.
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-2 text-[10px] text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-success" /> Accessible
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-warning" /> Restricted
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-critical" /> Blocked
          </span>
        </div>
      )}
    </div>
  );
}
