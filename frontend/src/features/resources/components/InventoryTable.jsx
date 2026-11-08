import React, { useState, useMemo } from 'react';
import { Download, Eye, ChevronsUpDown, Filter, RotateCcw } from 'lucide-react';
import { DataTable } from '../../../components/tables/DataTable.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { IconButton } from '../../../components/ui/IconButton.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';
import { Select } from '../../../components/ui/Select.jsx';

export function InventoryTable({
  items = [],
  selectedId,
  onSelectBatch,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [qualityFilter, setQualityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('daysToExpiry');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch =
          searchTerm === '' ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.facilityName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesQuality =
          qualityFilter === 'ALL' || item.qualityStatus === qualityFilter;

        return matchesSearch && matchesQuality;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1;
        }
        return valA < valB ? 1 : -1;
      });
  }, [items, searchTerm, qualityFilter, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Resource ID',
      render: (val, row) => (
        <div>
          <span className="font-mono font-bold text-navy-primary block">{val}</span>
          <span className="text-[10px] font-mono text-text-secondary">{row.batchId}</span>
        </div>
      ),
      sortable: true,
      width: '110px',
    },
    {
      key: 'name',
      header: 'Resource Name & Commodity',
      render: (val, row) => (
        <div>
          <div className="font-semibold text-text-primary">{val}</div>
          <div className="text-[11px] text-text-secondary flex items-center gap-1.5 mt-0.5">
            <span className="px-1.5 py-0.2 rounded bg-steel-light text-text-secondary text-[10px] font-mono">
              {row.commodity}
            </span>
            <span>{row.category}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'facilityName',
      header: 'Facility Staged',
      render: (val, row) => (
        <div>
          <div className="text-text-primary font-medium">{val}</div>
          <div className="text-[10px] font-mono text-text-secondary">{row.storageLocation}</div>
        </div>
      ),
    },
    {
      key: 'totalQty',
      header: 'Total Qty',
      align: 'right',
      render: (val, row) => (
        <span className="font-mono text-text-secondary text-tabular">
          {new Intl.NumberFormat().format(val)} <span className="text-[10px]">{row.unit}</span>
        </span>
      ),
    },
    {
      key: 'reservedQty',
      header: 'Reserved',
      align: 'right',
      render: (val, row) => (
        <span className="font-mono text-teal font-semibold text-tabular">
          {val > 0 ? new Intl.NumberFormat().format(val) : '—'}
        </span>
      ),
    },
    {
      key: 'usableQty',
      header: 'Usable Stock',
      align: 'right',
      sortable: true,
      render: (val, row) => (
        <span className={`font-mono font-bold text-tabular ${
          val === 0 ? 'text-status-critical' : 'text-status-success'
        }`}>
          {new Intl.NumberFormat().format(val)} <span className="text-[10px] font-normal">{row.unit}</span>
        </span>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      align: 'center',
      sortable: true,
      render: (val, row) => {
        const isUrgent = row.daysToExpiry <= 15;
        const isWarning = row.daysToExpiry <= 45 && !isUrgent;

        return (
          <div className="text-center">
            <span className={`font-mono text-[11px] font-semibold block ${
              isUrgent ? 'text-status-critical' : isWarning ? 'text-status-warning' : 'text-text-primary'
            }`}>
              {val}
            </span>
            <span className="text-[10px] text-text-secondary font-mono">
              ({row.daysToExpiry}d left)
            </span>
          </div>
        );
      },
    },
    {
      key: 'qualityStatus',
      header: 'Quality Status',
      align: 'center',
      render: (val) => (
        <StatusBadge
          variant={
            val === 'VERIFIED_USABLE' ? 'success' : val === 'QUARANTINED' ? 'critical' : 'warning'
          }
          pulse={val === 'QUARANTINED'}
          size="xs"
        >
          {val === 'VERIFIED_USABLE' ? 'VERIFIED' : val}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (_, row) => (
        <IconButton
          icon={Eye}
          size="xs"
          variant="ghost"
          label="Inspect Batch"
          onClick={(e) => {
            e.stopPropagation();
            onSelectBatch?.(row);
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-brand-border rounded-lg shadow-subtle">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-full sm:w-72">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
              placeholder="Search resource name, ID, or batch..."
            />
          </div>

          <Select
            value={qualityFilter}
            onChange={setQualityFilter}
            options={[
              { value: 'ALL', label: 'All Quality States' },
              { value: 'VERIFIED_USABLE', label: 'Verified Usable' },
              { value: 'AWAITING_QC', label: 'Awaiting QC Verification' },
              { value: 'QUARANTINED', label: 'Quarantined / Locked' },
            ]}
          />

          {(searchTerm || qualityFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setQualityFilter('ALL');
              }}
              className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        <div className="text-xs font-mono text-text-secondary">
          Displaying {filteredItems.length} of {items.length} lots
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        selectedId={selectedId}
        onRowClick={onSelectBatch}
        pagination={{
          currentPage: 1,
          totalPages: 1,
          totalCount: filteredItems.length,
        }}
      />
    </div>
  );
}
