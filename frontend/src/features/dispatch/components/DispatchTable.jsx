import React, { useState, useMemo } from 'react';
import {
  Eye,
  RotateCcw,
  Truck,
  CheckCircle,
  FileCheck2,
  AlertTriangle,
  Play,
  ArrowRight,
} from 'lucide-react';
import { DataTable } from '../../../components/tables/DataTable.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { IconButton } from '../../../components/ui/IconButton.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { Button } from '../../../components/ui/Button.jsx';

/**
 * Enterprise Dispatch & Verification Table
 * Displays all 11 required columns with inline action shortcuts.
 */
export function DispatchTable({
  dispatches = [],
  selectedId,
  onSelectDispatch,
  onOpenPODModal,
  onTriggerAction,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [commodityFilter, setCommodityFilter] = useState('ALL');

  const filteredDispatches = useMemo(() => {
    return dispatches.filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehicle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesCommodity = commodityFilter === 'ALL' || item.commodity === commodityFilter;

      return matchesSearch && matchesStatus && matchesCommodity;
    });
  }, [dispatches, searchTerm, statusFilter, commodityFilter]);

  const columns = [
    {
      key: 'id',
      header: 'Dispatch ID',
      sortable: true,
      width: '120px',
      render: (val, row) => (
        <div>
          <span className="font-mono font-bold text-navy-primary block">{val}</span>
          <span className="text-[10px] font-mono text-text-secondary">{row.planId}</span>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source Depot',
      render: (val) => (
        <span className="text-xs font-medium text-text-primary">{val}</span>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (val) => (
        <span className="text-xs font-bold text-navy-primary">{val}</span>
      ),
    },
    {
      key: 'commodity',
      header: 'Commodity & Item',
      render: (val, row) => (
        <div>
          <div className="text-xs font-medium text-text-primary">{row.item}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
              val === 'FOOD' ? 'bg-amber-50 text-amber-800' : val === 'WATER' ? 'bg-teal-50 text-teal' : 'bg-rose-50 text-rose-800'
            }`}>
              {val}
            </span>
            <span className="text-[10px] text-text-secondary font-mono">{row.batchId}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      render: (val, row) => (
        <span className="font-mono font-bold text-navy-primary text-tabular">
          {new Intl.NumberFormat().format(val)} <span className="text-[10px] font-normal text-text-secondary">{row.unit}</span>
        </span>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle & Carrier',
      render: (val, row) => (
        <div>
          <div className="text-xs text-text-primary font-medium">{val}</div>
          <div className="text-[10px] text-text-secondary">{row.carrier}</div>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Route Corridor',
      render: (val, row) => (
        <div className="max-w-[150px] truncate" title={val}>
          <span className="text-[11px] font-mono text-text-primary truncate block">{val}</span>
          <span className="text-[10px] text-teal font-mono">{row.routeStatus.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'expectedArrival',
      header: 'Exp Arrival',
      align: 'center',
      render: (val) => (
        <span className="font-mono text-[11px] text-navy-primary font-medium">{val}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (val) => {
        let variant = 'neutral';
        if (val === 'VERIFIED') variant = 'success';
        else if (val === 'DELIVERED') variant = 'teal';
        else if (val === 'IN_TRANSIT') variant = 'teal';
        else if (val === 'FAILED_DISRUPTED') variant = 'critical';
        else if (val === 'READY' || val === 'PREPARING') variant = 'warning';

        return (
          <StatusBadge variant={variant} size="xs" pulse={val === 'FAILED_DISRUPTED' || val === 'IN_TRANSIT'}>
            {val.replace('_', ' ')}
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
          {row.status === 'READY' && (
            <Button
              size="xs"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onTriggerAction?.('DISPATCH_SHIPMENT', row);
              }}
            >
              Dispatch
            </Button>
          )}

          {row.status === 'IN_TRANSIT' && (
            <Button
              size="xs"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onTriggerAction?.('RECORD_ARRIVAL', row);
              }}
            >
              Arrived
            </Button>
          )}

          {row.status === 'DELIVERED' && (
            <Button
              size="xs"
              variant="primary"
              icon={FileCheck2}
              onClick={(e) => {
                e.stopPropagation();
                onOpenPODModal?.(row);
              }}
            >
              Verify POD
            </Button>
          )}

          {row.status === 'FAILED_DISRUPTED' && (
            <Button
              size="xs"
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                onTriggerAction?.('REROUTE_EXCEPTION', row);
              }}
            >
              Reroute
            </Button>
          )}

          <IconButton
            icon={Eye}
            size="xs"
            variant="ghost"
            label="Inspect Details"
            onClick={(e) => {
              e.stopPropagation();
              onSelectDispatch?.(row);
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
              placeholder="Search dispatch ID, destination, or vehicle..."
            />
          </div>

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'ALL', label: 'All Lifecycle Statuses' },
              { value: 'IN_TRANSIT', label: 'In Transit' },
              { value: 'DELIVERED', label: 'Delivered (Pending POD)' },
              { value: 'VERIFIED', label: 'Verified Complete' },
              { value: 'READY', label: 'Ready at Dock' },
              { value: 'PREPARING', label: 'Preparing' },
              { value: 'FAILED_DISRUPTED', label: 'Disrupted / Halted' },
            ]}
          />

          <Select
            value={commodityFilter}
            onChange={setCommodityFilter}
            options={[
              { value: 'ALL', label: 'All Commodities' },
              { value: 'FOOD', label: 'Food Supplies' },
              { value: 'WATER', label: 'Safe Water' },
              { value: 'MEDICAL', label: 'Medical Supplies' },
            ]}
          />

          {(searchTerm || statusFilter !== 'ALL' || commodityFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setCommodityFilter('ALL');
              }}
              className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs font-mono text-text-secondary">
          Displaying {filteredDispatches.length} of {dispatches.length} consignments
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredDispatches}
        selectedId={selectedId}
        onRowClick={onSelectDispatch}
        pagination={{
          currentPage: 1,
          totalPages: 1,
          totalCount: filteredDispatches.length,
        }}
      />
    </div>
  );
}
