import React, { useState, useMemo, useEffect } from 'react';
import {
  Eye,
  RotateCcw,
  History,
  CheckCircle2,
  AlertTriangle,
  User,
  Layers,
} from 'lucide-react';
import { DataTable } from '../../../components/tables/DataTable.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { IconButton } from '../../../components/ui/IconButton.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';
import { Select } from '../../../components/ui/Select.jsx';

/**
 * Enterprise Audit Event Table
 * Displays all 9 required columns with comprehensive multi-factor filtering.
 */
export function AuditEventTable({
  events = [],
  selectedEventId,
  onSelectEvent,
  onFilteredEventsChange,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');

  const usersList = useMemo(() => {
    const list = Array.from(new Set(events.map((e) => e.user)));
    return [{ value: 'ALL', label: 'All Authorized Users' }, ...list.map((u) => ({ value: u, label: u }))];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        searchTerm === '' ||
        e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.reason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesModule = moduleFilter === 'ALL' || e.module === moduleFilter;
      const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
      const matchesUser = userFilter === 'ALL' || e.user === userFilter;

      return matchesSearch && matchesModule && matchesStatus && matchesUser;
    });
  }, [events, searchTerm, moduleFilter, statusFilter, userFilter]);

  // Notify parent whenever the filtered set changes
  useEffect(() => {
    onFilteredEventsChange?.(filteredEvents);
  }, [filteredEvents, onFilteredEventsChange]);

  const columns = [
    {
      key: 'id',
      header: 'Event ID',
      width: '120px',
      render: (val, row) => (
        <div>
          <span className="font-mono font-bold text-navy-primary block">{val}</span>
          <span className="text-[10px] font-mono text-text-secondary">
            {row.timestamp.replace('T', ' ').substring(0, 16)}
          </span>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'User & Role',
      render: (val, row) => (
        <div>
          <div className="text-xs font-semibold text-text-primary">{val}</div>
          <div className="text-[10px] text-text-secondary">{row.role}</div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Logged Action',
      render: (val) => (
        <span className="font-mono font-bold text-xs text-navy-primary bg-brand-bg px-2 py-0.5 rounded border border-brand-border">
          {val}
        </span>
      ),
    },
    {
      key: 'module',
      header: 'Subsystem Module',
      render: (val) => (
        <span className="text-xs font-medium text-text-primary">{val}</span>
      ),
    },
    {
      key: 'entityId',
      header: 'Entity Ref',
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-teal">{val}</span>
      ),
    },
    {
      key: 'status',
      header: 'Audit State',
      align: 'center',
      render: (val) => {
        let variant = 'neutral';
        if (val === 'VERIFIED') variant = 'success';
        else if (val === 'DISPUTED' || val === 'DISRUPTED') variant = 'critical';
        else if (val === 'QUARANTINED' || val === 'IN_TRANSIT') variant = 'warning';

        return (
          <StatusBadge variant={variant} size="xs">
            {val}
          </StatusBadge>
        );
      },
    },
    {
      key: 'reason',
      header: 'Operational Justification & Rationale',
      render: (val) => (
        <p className="text-xs text-text-primary truncate max-w-[280px]" title={val}>
          {val}
        </p>
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
            onSelectEvent?.(row);
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Table Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-brand-border rounded-lg shadow-subtle">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="w-full sm:w-72">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
              placeholder="Search event ID, action, entity, reason..."
            />
          </div>

          <Select
            value={moduleFilter}
            onChange={setModuleFilter}
            options={[
              { value: 'ALL', label: 'All Subsystem Modules' },
              { value: 'Allocation Planning', label: 'Allocation Planning' },
              { value: 'Demand & Beneficiaries', label: 'Demand & Beneficiaries' },
              { value: 'Dispatch & Verification', label: 'Dispatch & Verification' },
              { value: 'Recovery Simulator', label: 'Recovery Simulator' },
              { value: 'Resources & Inventory', label: 'Resources & Inventory' },
              { value: 'Network Map', label: 'Network Map' },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'ALL', label: 'All Audit States' },
              { value: 'VERIFIED', label: 'Verified Complete' },
              { value: 'DISPUTED', label: 'Disputed Claims' },
              { value: 'QUARANTINED', label: 'Quarantined / Locked' },
              { value: 'IN_TRANSIT', label: 'In Transit' },
            ]}
          />

          <Select
            value={userFilter}
            onChange={setUserFilter}
            options={usersList}
          />

          {(searchTerm || moduleFilter !== 'ALL' || statusFilter !== 'ALL' || userFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setModuleFilter('ALL');
                setStatusFilter('ALL');
                setUserFilter('ALL');
              }}
              className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs font-mono text-text-secondary">
          Displaying {filteredEvents.length} of {events.length} audit entries
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredEvents}
        selectedId={selectedEventId}
        onRowClick={onSelectEvent}
        pagination={{
          currentPage: 1,
          totalPages: 1,
          totalCount: filteredEvents.length,
        }}
      />
    </div>
  );
}
