import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from './Button.jsx';
import { SearchInput } from './SearchInput.jsx';

/**
 * Enterprise Filter Toolbar & Panel
 * Consolidated control bar for data filtering, keyword search, and preset resets.
 */
export function FilterPanel({
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder,
  filters,
  onReset,
  activeFilterCount = 0,
  extraActions,
  className = '',
}) {
  return (
    <div className={`bg-white border border-brand-border rounded-lg p-3 shadow-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${className}`}>
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {onSearchChange && (
          <div className="w-full sm:w-64">
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              onClear={onSearchClear}
              placeholder={searchPlaceholder}
            />
          </div>
        )}

        {filters && (
          <div className="flex flex-wrap items-center gap-2">
            {filters}
          </div>
        )}

        {onReset && activeFilterCount > 0 && (
          <Button
            size="xs"
            variant="ghost"
            onClick={onReset}
            icon={RotateCcw}
            className="text-text-secondary hover:text-text-primary"
          >
            Reset ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Extra Action Buttons */}
      {extraActions && (
        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
          {extraActions}
        </div>
      )}
    </div>
  );
}
