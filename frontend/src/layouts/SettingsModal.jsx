import React from 'react';
import { Settings, X, Database, Globe, Sliders, Shield } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { Button } from '../components/ui/Button.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export function SettingsModal() {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    dataMode,
    setDataMode,
    selectedIncident,
    selectedCrisisType,
    selectedRegion,
  } = useAppStore();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-dark/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsSettingsOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white border border-brand-border rounded-xl shadow-dropdown z-10 p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-light text-teal">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-section-title text-text-primary">ResQNet Platform Settings</h2>
              <p className="text-xs text-text-secondary">Configuration & Telemetry Parameters</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-brand-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Telemetry Data Mode */}
          <div className="p-3.5 bg-brand-bg border border-brand-border rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-teal" />
              <div>
                <div className="font-semibold text-text-primary">Data Feed Mode</div>
                <div className="text-text-secondary text-[11px]">
                  Switch between synthetic scenario data and API telemetry.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 p-0.5 bg-white border border-brand-border rounded-md">
              <button
                type="button"
                onClick={() => setDataMode('demo')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  dataMode === 'demo'
                    ? 'bg-status-warning text-white font-semibold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Demo
              </button>
              <button
                type="button"
                onClick={() => setDataMode('live')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  dataMode === 'live'
                    ? 'bg-teal text-white font-semibold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Live API
              </button>
            </div>
          </div>

          {/* Active Context Overview */}
          <div className="p-3.5 bg-white border border-brand-border rounded-lg space-y-2">
            <div className="font-semibold text-text-primary flex items-center justify-between">
              <span>Active Scope Settings</span>
              <StatusBadge variant="teal" size="xs">SYNCHRONIZED</StatusBadge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-text-secondary block">Incident Code:</span>
                <span className="font-mono font-medium text-navy-primary">{selectedIncident?.code}</span>
              </div>
              <div>
                <span className="text-text-secondary block">Crisis Classification:</span>
                <span className="font-medium text-text-primary">{selectedCrisisType}</span>
              </div>
              <div className="col-span-2">
                <span className="text-text-secondary block">Active Corridor / Region:</span>
                <span className="font-medium text-text-primary">{selectedRegion}</span>
              </div>
            </div>
          </div>

          {/* System Telemetry Info */}
          <div className="p-3 bg-brand-bg/60 border border-brand-border-light rounded-lg flex items-center justify-between text-[11px] text-text-secondary font-mono">
            <span>RESQNET RUNTIME v0.2.0-p2</span>
            <span>API: FASTAPI_READY</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-brand-border flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setIsSettingsOpen(false)}>
            Close Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
