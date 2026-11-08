import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  Compass,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X,
} from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';

export function MapTopToolbar({
  searchTerm,
  onSearchChange,
  onResetView,
  entities = [],
  onSelectSearchResult,
  activeEntityCount,
  blockedRouteCount,
}) {
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchMatches = searchTerm
    ? entities.filter((e) =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="absolute top-3 left-3 right-3 z-30 pointer-events-none flex items-center justify-between gap-3">
      {/* Search Input with Autocomplete Popover */}
      <div className="pointer-events-auto relative w-72 sm:w-80">
        <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-dropdown border border-brand-border">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              onSearchChange(val);
              setShowSearchResults(true);
            }}
            onClear={() => {
              onSearchChange('');
              setShowSearchResults(false);
            }}
            placeholder="Search facility, depot, or community..."
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchTerm && (
          <div className="absolute top-full mt-1.5 w-full bg-white border border-brand-border rounded-lg shadow-dropdown p-1 z-40 max-h-60 overflow-y-auto">
            {searchMatches.length > 0 ? (
              searchMatches.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectSearchResult(item);
                    setShowSearchResults(false);
                  }}
                  className="px-3 py-2 rounded-md hover:bg-brand-bg cursor-pointer transition-colors text-xs flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold text-text-primary truncate">{item.name}</div>
                    <div className="text-[10px] font-mono text-text-secondary">{item.code} • {item.category}</div>
                  </div>
                  <StatusBadge variant={item.operationalStatus === 'OPERATIONAL' ? 'success' : 'warning'} size="xs">
                    {item.operationalStatus}
                  </StatusBadge>
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-xs text-text-secondary">
                <Search className="w-4 h-4 mx-auto mb-1 text-steel opacity-50" />
                No entities found for &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle & Right: Telemetry Counter Strip & Reset View Button */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-brand-border shadow-dropdown text-xs">
          <div className="flex items-center gap-1.5 text-navy-primary font-medium">
            <span className="w-2 h-2 rounded-full bg-teal" />
            <span>Entities: <strong className="font-mono text-text-primary">{activeEntityCount}</strong></span>
          </div>

          <div className="h-3 w-px bg-brand-border mx-1" />

          <div className="flex items-center gap-1.5 text-status-critical font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Blocked: <strong className="font-mono">{blockedRouteCount}</strong></span>
          </div>
        </div>

        <StatusBadge variant="teal" size="sm">
          SIMULATED RECON
        </StatusBadge>

        <button
          type="button"
          onClick={onResetView}
          className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-brand-border shadow-dropdown text-xs text-text-secondary hover:text-navy-primary hover:bg-brand-bg flex items-center gap-1.5 transition-colors font-medium"
          title="Reset Map Bounds"
        >
          <RotateCcw className="w-3.5 h-3.5 text-teal" />
          <span className="hidden sm:inline">Reset View</span>
        </button>
      </div>
    </div>
  );
}
