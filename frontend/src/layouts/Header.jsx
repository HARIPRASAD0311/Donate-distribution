import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  ChevronRight,
  Radio,
  Clock,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  User,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { CRISIS_TYPES, REGIONS, MOCK_INCIDENTS } from '../mock-data/incidents.mock.js';
import { DEMO_CONFIG } from '../mock-data/config.js';
import { NotificationCenter } from './NotificationCenter.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

const ROUTE_NAMES = {
  '/command-center': 'Command Centre',
  '/network-map': 'Network Map',
  '/resources': 'Resources & Inventory',
  '/demand': 'Demand & Beneficiaries',
  '/allocation': 'Allocation Planning',
  '/recovery': 'Recovery Simulator',
  '/dispatch': 'Dispatch & Verification',
  '/audit': 'Audit & Reports',
  '/design-system': 'Design System Showcase',
};

export function Header() {
  const location = useLocation();
  const currentRouteName = ROUTE_NAMES[location.pathname] || 'Overview';

  const {
    selectedIncident,
    selectedCrisisType,
    selectedRegion,
    lastDataFreshness,
    setSelectedIncident,
    setSelectedCrisisType,
    setSelectedRegion,
    setMobileMenuOpen,
    operatorRole,
    isDemoMode,
    dataMode,
    setDataMode,
    incidents,
  } = useAppStore();

  const incidentList = incidents?.length ? incidents : MOCK_INCIDENTS;

  return (
    <header className="h-14 bg-white border-b border-brand-border px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-subtle">
      {/* Left: Mobile hamburger & Dynamic Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-brand-bg transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs truncate">
          <span className="text-text-secondary hidden sm:inline">Operations</span>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted hidden sm:inline shrink-0" />
          <span className="font-bold text-text-primary truncate">
            {currentRouteName}
          </span>
        </nav>
      </div>

      {/* Middle: Operational Context Selectors (Crisis Type, Incident, Region) */}
      <div className="hidden md:flex items-center gap-2 flex-wrap justify-center">
        {/* Crisis Type Selector */}
        <div className="relative inline-flex items-center">
          <select
            value={selectedCrisisType}
            onChange={(e) => setSelectedCrisisType(e.target.value)}
            className="h-7 pl-2.5 pr-6 text-[11px] font-semibold rounded bg-brand-bg border border-brand-border text-navy-primary appearance-none cursor-pointer hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-teal"
            title="Crisis Type Filter"
          >
            {CRISIS_TYPES.map((ct) => (
              <option key={ct.id} value={ct.id}>
                {ct.label}
              </option>
            ))}
            {selectedCrisisType === 'Unknown' && (
              <option value="Unknown">Telemetry Unavailable</option>
            )}
          </select>
          <ChevronDown className="w-3 h-3 text-text-secondary absolute right-1.5 pointer-events-none" />
        </div>

        {/* Active Incident Selector */}
        <div className="relative inline-flex items-center">
          <select
            value={selectedIncident?.id}
            onChange={(e) => {
              const inc = incidentList.find((i) => i.id === e.target.value);
              if (inc) setSelectedIncident(inc);
            }}
            className="h-7 pl-2.5 pr-6 text-[11px] font-semibold rounded bg-teal-light text-teal border border-teal/30 appearance-none cursor-pointer hover:bg-teal/15 focus:outline-hidden focus:ring-1 focus:ring-teal max-w-[210px] truncate"
            title="Active Incident"
          >
            {!incidentList.some((inc) => inc.id === selectedIncident?.id) && selectedIncident && (
              <option value={selectedIncident.id}>
                {selectedIncident.code || selectedIncident.id}: {selectedIncident.name}
              </option>
            )}
            {incidentList.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.code || inc.id}: {inc.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-teal absolute right-1.5 pointer-events-none" />
        </div>

        {/* Region Selector */}
        <div className="relative inline-flex items-center">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="h-7 pl-2.5 pr-6 text-[11px] font-medium rounded bg-brand-bg border border-brand-border text-text-secondary appearance-none cursor-pointer hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-teal max-w-[170px] truncate"
            title="Operational Region"
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-text-secondary absolute right-1.5 pointer-events-none" />
        </div>
      </div>

      {/* Right: Freshness, Mode Pill, Notifications, User Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Data Freshness Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-brand-bg border border-brand-border text-[11px] font-mono text-text-secondary">
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span>{lastDataFreshness}</span>
        </div>

        {/* Data Mode Indicator & Quick Toggle */}
        {isDemoMode ? (
          <button
            type="button"
            onClick={() => setDataMode('live')}
            title="Currently in Demo Mode (Synthetic Benchmark Data). Click to switch to Live API Mode."
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-status-warning-bg text-status-warning border border-status-warning-border hover:bg-status-warning/20 transition-all cursor-pointer shadow-2xs"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>DEMO MODE</span>
            <span className="hidden sm:inline text-[9px] opacity-80 font-normal ml-0.5">| Switch to Live →</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDataMode('demo')}
            title="Currently in Live API Mode (Direct Backend Solver). Click to switch to Demo Mode."
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-teal-light text-teal border border-teal/40 hover:bg-teal-light/80 transition-all cursor-pointer shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            <span>LIVE API MODE</span>
            <span className="hidden sm:inline text-[9px] opacity-80 font-normal ml-0.5">| Switch to Demo →</span>
          </button>
        )}

        {/* Notification Centre */}
        <NotificationCenter />

        {/* Compact User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-brand-border">
          <div className="w-7 h-7 rounded-full bg-navy-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
            SV
          </div>
          <div className="hidden 2xl:block text-left">
            <div className="text-xs font-semibold text-text-primary leading-tight">
              {operatorRole ? `${operatorRole.split(' ')[0]} ${operatorRole.split(' ')[1] || ''}` : 'Operational Lead'}
            </div>
            <div className="text-[10px] text-text-secondary font-mono leading-none">
              LOGISTICS CHIEF
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
