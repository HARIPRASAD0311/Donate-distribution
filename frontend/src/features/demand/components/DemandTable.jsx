import React, { useState, useMemo } from 'react';
import { Eye, RotateCcw, CheckCircle, AlertOctagon, HelpCircle, XCircle } from 'lucide-react';
import { DataTable } from '../../../components/tables/DataTable.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { IconButton } from '../../../components/ui/IconButton.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';
import { Select } from '../../../components/ui/Select.jsx';

/**
 * Enterprise Demand Requirements Table
 * Displays all 11 required columns:
 * Demand ID, Region, Beneficiary group, Commodity, Required item, Required quantity,
 * Fulfilled quantity, Remaining demand, Priority, Required-by date, Verification status.
 */
export function DemandTable({
  items = [],
  selectedId,
  onSelectDemand,
  onQuickVerify,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('requiredByDate');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filter & sort
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch =
          searchTerm === '' ||
          item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.beneficiaryGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.region.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesVerification =
          verificationFilter === 'ALL' || item.verificationStatus === verificationFilter;

        const matchesPriority =
          priorityFilter === 'ALL' || item.priority === priorityFilter;

        return matchesSearch && matchesVerification && matchesPriority;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1;
        }
        return valA < valB ? 1 : -1;
      });
  }, [items, searchTerm, verificationFilter, priorityFilter, sortBy, sortOrder]);

  const columns = [
    {
      key: 'id',
      header: 'Demand ID',
      sortable: true,
      width: '120px',
      render: (val, row) => (
        <div>
          <span className="font-mono font-bold text-navy-primary block">{val}</span>
          <span className="text-[10px] font-mono text-text-secondary">{row.incidentId}</span>
        </div>
      ),
    },
    {
      key: 'region',
      header: 'Region & Location',
      render: (val, row) => (
        <div>
          <div className="font-medium text-text-primary">{val}</div>
          <div className="text-[11px] text-text-secondary truncate max-w-[170px]" title={row.location}>
            {row.location}
          </div>
        </div>
      ),
    },
    {
      key: 'beneficiaryGroup',
      header: 'Beneficiary Group',
      render: (val) => (
        <div className="font-semibold text-text-primary text-xs">
          {val}
        </div>
      ),
    },
    {
      key: 'commodity',
      header: 'Commodity',
      align: 'center',
      render: (val) => (
        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
          val === 'FOOD'
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : val === 'WATER'
            ? 'bg-teal-50 text-teal border border-teal/20'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {val}
        </span>
      ),
    },
    {
      key: 'item',
      header: 'Required Item',
      render: (val, row) => (
        <div>
          <div className="font-medium text-text-primary text-xs">{val}</div>
          <div className="text-[10px] text-text-secondary font-mono">
            Reported: {row.reportingSource}
          </div>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Req Qty',
      align: 'right',
      render: (val, row) => (
        <span className="font-mono font-semibold text-text-secondary text-tabular">
          {new Intl.NumberFormat().format(val)} <span className="text-[10px] font-normal">{row.unit}</span>
        </span>
      ),
    },
    {
      key: 'fulfilledQuantity',
      header: 'Fulfilled',
      align: 'right',
      render: (val, row) => (
        <span className="font-mono text-status-success font-semibold text-tabular">
          {val > 0 ? new Intl.NumberFormat().format(val) : '—'}
        </span>
      ),
    },
    {
      key: 'remainingQuantity',
      header: 'Remaining',
      align: 'right',
      sortable: true,
      render: (val, row) => (
        <span className={`font-mono font-bold text-tabular ${
          val > 0 ? 'text-status-critical' : 'text-status-success'
        }`}>
          {new Intl.NumberFormat().format(val)} <span className="text-[10px] font-normal">{row.unit}</span>
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      align: 'center',
      sortable: true,
      render: (val) => (
        <StatusBadge
          variant={
            val === 'CRITICAL' ? 'critical' : val === 'HIGH' ? 'warning' : val === 'MEDIUM' ? 'teal' : 'neutral'
          }
          pulse={val === 'CRITICAL'}
          size="xs"
        >
          {val}
        </StatusBadge>
      ),
    },
    {
      key: 'requiredByDate',
      header: 'Required-By',
      align: 'center',
      sortable: true,
      render: (val) => (
        <span className="font-mono text-[11px] text-text-primary block font-medium">
          {val}
        </span>
      ),
    },
    {
      key: 'verificationStatus',
      header: 'Verification Status',
      align: 'center',
      render: (val) => {
        let badgeVariant = 'neutral';
        if (val === 'VERIFIED') badgeVariant = 'success';
        if (val === 'PENDING') badgeVariant = 'warning';
        if (val === 'DISPUTED') badgeVariant = 'critical';
        if (val === 'REJECTED') badgeVariant = 'neutral';

        return (
          <StatusBadge variant={badgeVariant} size="xs" pulse={val === 'PENDING'}>
            {val}
          </StatusBadge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          {row.verificationStatus === 'PENDING' && onQuickVerify && (
            <IconButton
              icon={CheckCircle}
              size="xs"
              variant="ghost"
              label="Quick Verify"
              onClick={(e) => {
                e.stopPropagation();
                onQuickVerify(row);
              }}
              className="text-status-success hover:bg-status-success-bg"
            />
          )}
          <IconButton
            icon={Eye}
            size="xs"
            variant="ghost"
            label="Inspect Demand"
            onClick={(e) => {
              e.stopPropagation();
              onSelectDemand?.(row);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-brand-border rounded-lg shadow-subtle">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="w-full sm:w-72">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
              placeholder="Search demand ID, item, or group..."
            />
          </div>

          <Select
            value={verificationFilter}
            onChange={setVerificationFilter}
            options={[
              { value: 'ALL', label: 'All Verification Statuses' },
              { value: 'VERIFIED', label: 'Verified Only' },
              { value: 'PENDING', label: 'Pending Verification' },
              { value: 'DISPUTED', label: 'Disputed Claims' },
              { value: 'REJECTED', label: 'Rejected Records' },
            ]}
          />

          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: 'ALL', label: 'All Priorities' },
              { value: 'CRITICAL', label: 'Critical (<24h)' },
              { value: 'HIGH', label: 'High (24-48h)' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'NORMAL', label: 'Normal' },
            ]}
          />

          {(searchTerm || verificationFilter !== 'ALL' || priorityFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setVerificationFilter('ALL');
                setPriorityFilter('ALL');
              }}
              className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs font-mono text-text-secondary">
          Displaying {filteredItems.length} of {items.length} records
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        selectedId={selectedId}
        onRowClick={onSelectDemand}
        pagination={{
          currentPage: 1,
          totalPages: 1,
          totalCount: filteredItems.length,
        }}
      />
    </div>
  );
}
