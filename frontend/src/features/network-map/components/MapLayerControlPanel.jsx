import React, { useState } from 'react';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
  AlertTriangle,
  Building,
  Users,
  Route as RouteIcon,
  Sparkles,
  Droplets,
  Shield,
  Activity,
  RotateCcw,
  MapPin,
} from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { GEO_TYPE_STYLES } from './GeoModelMarkerLayer.jsx';
import { GEOGRAPHIC_LOCATION_TYPE } from '../../../domain/geographicModel.js';
import { DISASTER_TYPE, RISK_SEVERITY } from '../../../domain/disasterZoneModel.js';

export function MapLayerControlPanel({
  layers,
  onToggleLayer,
  filters,
  onChangeFilter,
  onResetFilters,
  activeFilterCount = 0,
  crisisType,
  isOpen,
  onToggleOpen,
  entities = [],
  routes = [],
  crisisOverlays = {},
  // Stage 4.2 GIS props
  geoLocations = [],
  geoVisibleTypes = [],
  onToggleGeoType,
  // Stage 4.4 Disaster Risk props
  disasterZones = [],
  disasterFilters = { disasterType: 'ALL', severity: 'ALL', classification: 'ALL' },
  onChangeDisasterFilter,
}) {
  const facilitiesCount = entities.filter((e) =>
    ['INSTITUTIONAL_DONOR', 'SUPPLIER', 'TIER_1_FOODBANK', 'TIER_2_FRRA', 'DISTRIBUTION_CENTRE'].includes(e.category)
  ).length;
  const beneficiariesCount = entities.filter((e) =>
    ['BENEFICIARY_LOCATION', 'AFFECTED_COMMUNITY'].includes(e.category)
  ).length;
  const routesCount = routes.length;
  const affectedZonesCount = disasterZones.length || crisisOverlays.affectedZones?.length || 0;
  const damageCount = crisisOverlays.infrastructureDamage?.length || 0;
  const geoCount = geoLocations.length;

  const layerDefinitions = [
    { key: 'facilities', label: 'Facilities & Staging Hubs', icon: Building, count: facilitiesCount },
    { key: 'beneficiaries', label: 'Beneficiary Settlements', icon: Users, count: beneficiariesCount },
    { key: 'routes', label: 'Transport Corridors', icon: RouteIcon, count: routesCount },
    { key: 'affectedAreas', label: crisisType === 'Armed Conflict' ? 'Conflict Hazard Zones' : crisisType === 'Pandemic' ? 'Quarantine Perimeters' : 'Crisis Inundation Zones', icon: Droplets, count: affectedZonesCount },
    { key: 'infrastructureDamage', label: 'Infrastructure Damage Points', icon: AlertTriangle, count: damageCount },
    { key: 'demandConcentration', label: 'Demand Deficit Pockets', icon: Sparkles, count: beneficiariesCount },
    { key: 'resourceAvailability', label: 'Depot Stock Capacities', icon: Building, count: facilitiesCount },
    { key: 'disruptions', label: 'Roadblock & Impasse Nodes', icon: AlertTriangle, count: damageCount },
    { key: 'geoModel', label: 'GIS Geographic Entities', icon: MapPin, count: geoCount },
  ];

  return (
    <div
      className={`
        absolute top-14 bottom-4 left-3 z-20 transition-all duration-200 flex select-none pointer-events-auto
        ${isOpen ? 'w-72 sm:w-80' : 'w-10'}
      `}
    >
      {/* Panel Surface */}
      <div
        className={`
          flex-1 bg-white/95 backdrop-blur-md border border-brand-border rounded-xl shadow-dropdown flex flex-col overflow-hidden transition-all duration-200
          ${!isOpen ? 'hidden' : 'flex'}
        `}
      >
        {/* Panel Header */}
        <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between bg-brand-surface">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal" />
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Map Layers &amp; Filters
            </h3>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-subtle text-teal border border-teal/30">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleOpen}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-brand-bg transition-colors"
            title="Collapse Layer Panel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Panel Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* SECTION 1: TOGGLEABLE MAP LAYERS */}
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-brand-border-light">
              <span className="font-bold text-[11px] text-text-secondary uppercase tracking-wider">
                Active Map Layers
              </span>
              <span className="text-[10px] font-mono text-teal font-semibold">
                {Object.values(layers).filter(Boolean).length} ON
              </span>
            </div>

            <div className="space-y-1.5">
              {layerDefinitions.map((def) => {
                const Icon = def.icon;
                const isChecked = Boolean(layers[def.key]);

                return (
                  <label
                    key={def.key}
                    className={`
                      flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors
                      ${isChecked
                        ? 'bg-teal-subtle/50 border-teal/30 text-navy-primary font-medium'
                        : 'bg-white border-brand-border-light text-text-secondary hover:bg-brand-bg'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleLayer(def.key)}
                        className="rounded border-brand-border text-teal focus:ring-teal cursor-pointer"
                      />
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isChecked ? 'text-teal' : 'text-steel'}`} />
                      <span className="text-[11px] truncate">{def.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-text-secondary bg-white px-1.5 py-0.2 rounded border border-brand-border/60">
                      {def.count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: GIS GEOGRAPHIC MODEL LAYER (Stage 4.2) */}
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-brand-border-light">
              <span className="font-bold text-[11px] text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal" />
                GIS Geographic Entities
              </span>
              <span className="text-[10px] font-mono text-teal font-semibold">{geoCount} locations</span>
            </div>

            {/* GIS layer master toggle */}
            <label className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors mb-2 ${
              Boolean(layers.geoModel !== false)
                ? 'bg-teal-subtle/50 border-teal/30 text-navy-primary font-medium'
                : 'bg-white border-brand-border-light text-text-secondary hover:bg-brand-bg'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(layers.geoModel !== false)}
                  onChange={() => onToggleLayer('geoModel')}
                  className="rounded border-brand-border text-teal focus:ring-teal cursor-pointer"
                />
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${Boolean(layers.geoModel !== false) ? 'text-teal' : 'text-steel'}`} />
                <span className="text-[11px]">Show All GIS Locations</span>
              </div>
              <span className="text-[10px] font-mono text-text-secondary bg-white px-1.5 py-0.5 rounded border border-brand-border/60">
                {geoCount}
              </span>
            </label>

            {/* Per-type visibility toggles */}
            {Boolean(layers.geoModel !== false) && geoCount > 0 && (
              <div className="space-y-1 ml-1 pl-2 border-l-2 border-brand-border-light">
                {Object.values(GEOGRAPHIC_LOCATION_TYPE).map((type) => {
                  const style = GEO_TYPE_STYLES[type];
                  if (!style) return null;
                  const isVisible = geoVisibleTypes.includes(type);
                  const typeCount = geoLocations.filter((l) => l.type === type).length;
                  return (
                    <label
                      key={type}
                      className="flex items-center justify-between gap-2 py-1 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => onToggleGeoType?.(type)}
                          className="rounded border-brand-border text-teal focus:ring-teal cursor-pointer"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-white"
                          style={{ backgroundColor: style.bg }}
                        />
                        <span className={`text-[11px] truncate ${isVisible ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {style.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-text-secondary shrink-0">{typeCount}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: CRISIS-SPECIFIC OVERLAYS */}
          <div className="p-3 bg-brand-bg border border-brand-border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-navy-primary uppercase tracking-wider flex items-center gap-1.5">
                {crisisType === 'Flood' && <Droplets className="w-3.5 h-3.5 text-blue-500" />}
                {crisisType === 'Armed Conflict' && <Shield className="w-3.5 h-3.5 text-status-critical" />}
                {crisisType === 'Pandemic' && <Activity className="w-3.5 h-3.5 text-status-warning" />}
                <span>{crisisType} Overlays</span>
              </span>
              <StatusBadge variant="teal" size="xs">ACTIVE</StatusBadge>
            </div>
            <p className="text-[10px] text-text-secondary leading-snug">
              {crisisType === 'Flood' && 'Surfaces inundation perimeters, cut-off isochrones, and submerged culverts.'}
              {crisisType === 'Armed Conflict' && 'Surfaces verified UN demining corridors and security checkpoints.'}
              {crisisType === 'Pandemic' && 'Surfaces quarantine isolation clusters and triage health post readiness.'}
            </p>
          </div>

          {/* SECTION 4: ENTITY TYPE & STATUS FILTER */}
          <div className="space-y-2">
            <span className="font-bold text-[11px] text-text-secondary uppercase tracking-wider block">
              Facility Filters
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {[
                { id: 'ALL', label: 'All Entities' },
                { id: 'TIER_1_FOODBANK', label: 'Tier-I Depots' },
                { id: 'TIER_2_FRRA', label: 'Tier-II FRRAs' },
                { id: 'DISTRIBUTION_CENTRE', label: 'Field DCs' },
                { id: 'BENEFICIARY_LOCATION', label: 'Beneficiaries' },
                { id: 'SUPPLIER', label: 'Suppliers' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeFilter('entityType', opt.id)}
                  className={`px-2 py-1.5 rounded text-left truncate transition-colors border ${
                    (filters.entityType || filters.facilityType) === opt.id
                      ? 'bg-navy-primary text-white font-semibold border-navy-primary'
                      : 'bg-white text-text-secondary border-brand-border hover:bg-brand-bg hover:text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[10px] text-text-secondary font-medium block mb-1">
                Operational Status:
              </label>
              <select
                value={filters.facilityStatus || 'ALL'}
                onChange={(e) => onChangeFilter('facilityStatus', e.target.value)}
                className="w-full text-[11px] py-1.5 px-2 bg-white border border-brand-border rounded text-text-primary focus:outline-none focus:border-teal"
              >
                <option value="ALL">All Operational Statuses</option>
                <option value="OPERATIONAL">Operational</option>
                <option value="CONSTRAINED">Constrained</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {/* SECTION 5: ROUTE STATUS & TRANSPORT MODE FILTER */}
          <div className="space-y-2">
            <span className="font-bold text-[11px] text-text-secondary uppercase tracking-wider block">
              Corridor Filters
            </span>
            <div className="space-y-1 text-[11px]">
              {[
                { id: 'ALL', label: 'All Corridors' },
                { id: 'ACTIVE', label: 'Active (In-Transit)', color: 'text-emerald-600' },
                { id: 'COMPLETED', label: 'Completed / Delivered', color: 'text-slate-500' },
                { id: 'DELAYED', label: 'Delayed / Restricted', color: 'text-status-warning' },
                { id: 'BLOCKED', label: 'Confirmed Blocked', color: 'text-status-critical' },
                { id: 'PLANNED', label: 'Planned / Staged', color: 'text-blue-600' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeFilter('routeStatus', opt.id)}
                  className={`w-full px-2.5 py-1.5 rounded text-left transition-colors flex items-center justify-between border ${
                    filters.routeStatus === opt.id
                      ? 'bg-navy-secondary text-white font-semibold border-navy-secondary'
                      : 'bg-white text-text-secondary border-brand-border hover:bg-brand-bg'
                  }`}
                >
                  <span className={opt.color || ''}>{opt.label}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="text-[10px] text-text-secondary font-medium block mb-1">
                Transport Mode:
              </label>
              <select
                value={filters.transportMode || 'ALL'}
                onChange={(e) => onChangeFilter('transportMode', e.target.value)}
                className="w-full text-[11px] py-1.5 px-2 bg-white border border-brand-border rounded text-text-primary focus:outline-none focus:border-teal"
              >
                <option value="ALL">All Transport Modes</option>
                <option value="HEAVY_TRUCK">Heavy Truck Convoy</option>
                <option value="LIGHT_4WD">Light 4WD Vehicle</option>
                <option value="RIVER_BARGE">River Barge / Waterway</option>
                <option value="AIR_CARGO">Air Freight / Rotary</option>
              </select>
            </div>
          </div>

          {/* SECTION 5B: DATA CLASSIFICATION (DEMO / LIVE) */}
          <div>
            <span className="font-bold text-[11px] text-text-secondary uppercase tracking-wider block mb-1">
              Data Classification
            </span>
            <select
              value={filters.dataClassification || 'ALL'}
              onChange={(e) => onChangeFilter('dataClassification', e.target.value)}
              className="w-full text-[11px] py-1.5 px-2 bg-white border border-brand-border rounded text-text-primary focus:outline-none focus:border-teal"
            >
              <option value="ALL">All Records (DEMO &amp; LIVE)</option>
              <option value="DEMO">DEMO Operational Records</option>
              <option value="LIVE">LIVE Telemetry Records</option>
            </select>
          </div>

          {/* SECTION 6: DISASTER RISK LAYER FILTERS (Stage 4.4) */}
          {layers.affectedAreas && (
            <div className="space-y-3 pt-2 border-t border-brand-border-light">
              <span className="font-bold text-[11px] text-text-secondary uppercase tracking-wider block">
                Disaster Hazard Filters
              </span>

              {/* Disaster Type Filter */}
              <div>
                <label className="text-[10px] text-text-secondary font-medium block mb-1">
                  Hazard Type:
                </label>
                <select
                  value={disasterFilters?.disasterType || 'ALL'}
                  onChange={(e) => onChangeDisasterFilter?.('disasterType', e.target.value)}
                  className="w-full text-[11px] py-1.5 px-2 bg-white border border-brand-border rounded text-text-primary focus:outline-none focus:border-teal"
                >
                  <option value="ALL">All Hazard Types</option>
                  <option value="FLOOD">Flood Inundation Area</option>
                  <option value="CONFLICT">Armed Conflict Zone</option>
                  <option value="PANDEMIC">Epidemic Containment</option>
                  <option value="RESTRICTED_ACCESS">Restricted Access Sector</option>
                  <option value="EVACUATION_ZONE">Evacuation Perimeter</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div>
                <label className="text-[10px] text-text-secondary font-medium block mb-1">
                  Risk Severity Level:
                </label>
                <select
                  value={disasterFilters?.severity || 'ALL'}
                  onChange={(e) => onChangeDisasterFilter?.('severity', e.target.value)}
                  className="w-full text-[11px] py-1.5 px-2 bg-white border border-brand-border rounded text-text-primary focus:outline-none focus:border-teal"
                >
                  <option value="ALL">All Severity Levels</option>
                  <option value="CRITICAL">Critical Risk</option>
                  <option value="HIGH">High Risk</option>
                  <option value="MODERATE">Moderate Risk</option>
                  <option value="LOW">Low Risk</option>
                </select>
              </div>

              {/* Classification DEMO / LIVE */}
              <div>
                <label className="text-[10px] text-text-secondary font-medium block mb-1">
                  Data Classification:
                </label>
                <select
                  value={disasterFilters?.classification || 'ALL'}
                  onChange={(e) => onChangeDisasterFilter?.('classification', e.target.value)}
                  className="w-full text-[11px] py-1.5 px-2 bg-white border border-brand-border rounded text-text-primary focus:outline-none focus:border-teal"
                >
                  <option value="ALL">All Sources (DEMO & LIVE)</option>
                  <option value="DEMO">DEMO Records Only</option>
                  <option value="LIVE">LIVE Satellite Records Only</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Panel Footer */}
        <div className="px-4 py-2.5 bg-brand-surface-hover border-t border-brand-border flex items-center justify-between">
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset all
          </button>
          <span className="text-[10px] font-mono text-text-secondary">WGS84</span>
        </div>
      </div>

      {/* Floating Toggle Tab when Closed */}
      {!isOpen && (
        <button
          type="button"
          onClick={onToggleOpen}
          className="h-10 w-10 bg-white border border-brand-border rounded-lg shadow-dropdown flex items-center justify-center text-navy-primary hover:bg-brand-bg transition-colors"
          title="Open Layers & Filters"
        >
          <Layers className="w-5 h-5 text-teal" />
        </button>
      )}
    </div>
  );
}
