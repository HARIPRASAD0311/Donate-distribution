import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';

/**
 * Enterprise High-Density Data Table
 * Strict thin borders, tabular typography, hover states, selection highlighting, and pagination.
 */
export function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  onRowClick,
  selectedId,
  isLoading = false,
  emptyState,
  compact = false,
  pagination,
  className = '',
}) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-brand-border rounded-lg overflow-hidden p-4 space-y-3">
        <Skeleton variant="table-row" count={5} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return emptyState || <EmptyState />;
  }

  return (
    <div className={`bg-white border border-brand-border rounded-lg shadow-subtle overflow-hidden flex flex-col ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-brand-bg/80 border-b border-brand-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    px-3.5 py-2.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider
                    ${alignClass[col.align || 'left']}
                    ${col.className || ''}
                  `}
                  style={{ width: col.width }}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ChevronsUpDown className="w-3 h-3 text-steel cursor-pointer hover:text-text-primary" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border-light text-xs">
            {data.map((row, idx) => {
              const rowId = row[keyField] || idx;
              const isSelected = selectedId === rowId;

              return (
                <tr
                  key={rowId}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    transition-colors group
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${isSelected
                      ? 'bg-teal-subtle/80 font-medium'
                      : 'hover:bg-brand-surface-hover bg-white'
                    }
                  `}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`
                        px-3.5 ${compact ? 'py-2' : 'py-3'} text-text-primary
                        ${alignClass[col.align || 'left']}
                        ${col.className || ''}
                      `}
                    >
                      {col.render ? col.render(row[col.key], row, idx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="px-4 py-2.5 bg-brand-surface-hover border-t border-brand-border flex items-center justify-between text-xs text-text-secondary">
          <div>
            Showing <span className="font-semibold text-text-primary">{data.length}</span>
            {pagination.totalCount !== undefined && (
              <> of <span className="font-semibold text-text-primary">{pagination.totalCount}</span> records</>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px]">
              Page {pagination.currentPage || 1} of {pagination.totalPages || 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.currentPage <= 1}
                onClick={() => pagination.onPageChange?.(pagination.currentPage - 1)}
                className="p-1 rounded border border-brand-border bg-white text-text-secondary hover:text-text-primary hover:bg-brand-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => pagination.onPageChange?.(pagination.currentPage + 1)}
                className="p-1 rounded border border-brand-border bg-white text-text-secondary hover:text-text-primary hover:bg-brand-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
