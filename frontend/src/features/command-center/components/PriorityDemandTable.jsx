import React, { useState, useMemo } from 'react';
import { Download, Filter, Eye, ArrowUpDown, ChevronDown } from 'lucide-react';
import { DataTable } from '../../../components/tables/DataTable.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { IconButton } from '../../../components/ui/IconButton.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';
import { Tabs } from '../../../components/ui/Tabs.jsx';

export function PriorityDemandTable({
  demands = [],
  onSelectDemand,
  selectedId,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('unmetQty');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filtered and sorted demands
  const filteredDemands = useMemo(() => {
    return demands
      .filter((item) => {
        const matchesCategory =
          categoryFilter === 'ALL' ||
          (categoryFilter === 'FOOD' && item.commodity.toLowerCase().includes('food')) ||
          (categoryFilter === 'WATER' && item.commodity.toLowerCase().includes('water')) ||
          (categoryFilter === 'MEDICAL' && (item.commodity.toLowerCase().includes('cholera') || item.commodity.toLowerCase().includes('trauma'))) ||
          (categoryFilter === 'SHELTER' && item.commodity.toLowerCase().includes('shelter'));

        const matchesSearch =
          searchTerm === '' ||
          item.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.commodity.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === 'priority') {
          const priorityRank = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
          valA = priorityRank[a.priority] || 0;
          valB = priorityRank[b.priority] || 0;
        }

        if (sortOrder === 'desc') {
          return valA < valB ? 1 : -1;
        }
        return valA > valB ? 1 : -1;
      });
  }, [demands, searchTerm, categoryFilter, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const columns = [
    {
      key: 'region',
      header: 'Region / Sector',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-text-primary block">{val}</span>
          <span className="text-[11px] text-text-secondary">{row.actionNeeded}</span>
        </div>
      ),
    },
    {
      key: 'commodity',
      header: 'Commodity Needed',
      render: (val) => (
        <span className="font-medium text-navy-primary">{val}</span>
      ),
    },
    {
      key: 'requiredQty',
      header: 'Required Qty',
      align: 'right',
      render: (val, row) => (
        <span className="font-mono text-text-secondary text-tabular">
          {new Intl.NumberFormat().format(val)} <span className="text-[10px]">{row.unit}</span>
        </span>
      ),
    },
    {
      key: 'availableQty',
      header: 'Available In Depot',
      align: 'right',
      render: (val, row) => (
        <span className="font-mono text-teal font-semibold text-tabular">
          {new Intl.NumberFormat().format(val)} <span className="text-[10px]">{row.unit}</span>
        </span>
      ),
    },
    {
      key: 'unmetQty',
      header: 'Unmet Deficit',
      align: 'right',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono font-bold text-status-critical text-tabular">
          {val > 0 ? `-${new Intl.NumberFormat().format(val)}` : 'Fulfilled'}{' '}
          <span className="text-[10px] font-normal">{row.unit}</span>
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
          variant={val === 'CRITICAL' ? 'critical' : val === 'HIGH' ? 'warning' : 'neutral'}
          pulse={val === 'CRITICAL'}
          size="sm"
        >
          {val}
        </StatusBadge>
      ),
    },
    {
      key: 'verificationStatus',
      header: 'Verification Status',
      align: 'center',
      render: (val) => (
        <StatusBadge
          variant={val === 'VERIFIED' ? 'success' : val === 'PENDING_RECON' ? 'warning' : 'neutral'}
          size="xs"
        >
          {val === 'PENDING_RECON' ? 'Pending Recon' : val}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Inspect',
      align: 'right',
      render: (_, row) => (
        <IconButton
          icon={Eye}
          size="xs"
          variant="ghost"
          label="Inspect Dossier"
          onClick={(e) => {
            e.stopPropagation();
            onSelectDemand?.(row);
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-2.5">
      {/* Table Toolbar: Category Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-white p-2 sm:px-3 border border-brand-border rounded-lg shadow-subtle">
        <Tabs
          variant="pills"
          tabs={[
            { id: 'ALL', label: 'All Commodities', count: demands.length },
            { id: 'FOOD', label: 'Food (BP-5)' },
            { id: 'WATER', label: 'Drinking Water' },
            { id: 'MEDICAL', label: 'Medical Kits' },
            { id: 'SHELTER', label: 'Shelter' },
          ]}
          activeTab={categoryFilter}
          onChange={setCategoryFilter}
        />

        <div className="w-full sm:w-60">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
            placeholder="Search community / commodity..."
          />
        </div>
      </div>

      {/* Main High-Density Compact Table */}
      <DataTable
        compact
        columns={columns}
        data={filteredDemands}
        selectedId={selectedId}
        onRowClick={onSelectDemand}
        pagination={{
          currentPage: 1,
          totalPages: 1,
          totalCount: filteredDemands.length,
        }}
      />
    </div>
  );
}
