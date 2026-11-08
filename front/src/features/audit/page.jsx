import React, { useState, useMemo } from 'react';
import {
  History,
  Download,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  Layers,
  Filter,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAppStore } from '../../store/useAppStore.js';
import { EmptyState } from '../../components/ui/EmptyState.jsx';

import {
  INITIAL_AUDIT_EVENTS,
  REPORT_TEMPLATES,
} from './data/auditData.js';

import { AuditKpis } from './components/AuditKpis.jsx';
import { AuditVisualAnalytics } from './components/AuditVisualAnalytics.jsx';
import { AuditEventTable } from './components/AuditEventTable.jsx';
import { EventDetailDrawer } from './components/EventDetailDrawer.jsx';
import { ReportTemplatesModal } from './components/ReportTemplatesModal.jsx';

/**
 * ResQNet Audit & Reports Dashboard Page
 * Part B Implementation: Immutable event ledger, actor authorization records,
 * compliance history, and operational reporting.
 */
export default function AuditPage() {
  const { auditEvents: storeEvents, addAuditEvent } = useAppStore();

  // Combine initial events with any dynamically generated store events
  const allEvents = storeEvents || [];
  const auditAnalytics = useMemo(() => {
    const categories = new Map(); const actors = new Map(); const approvals = new Map(); const hours = new Map();
    allEvents.forEach(event => {
      const category=event.module||event.action?.split('_')[0]||'Operations'; categories.set(category,(categories.get(category)||0)+1);
      const actor=event.actor||event.user||'SIMULATED_OPERATOR'; actors.set(actor,(actors.get(actor)||0)+1);
      const status=event.newState||event.status||'RECORDED'; approvals.set(status,(approvals.get(status)||0)+1);
      const hour=event.timestamp?new Date(event.timestamp).toISOString().slice(11,13)+':00':'Unknown'; hours.set(hour,(hours.get(hour)||0)+1);
    });
    return {activityTimeline:[...hours].sort(([a],[b])=>a.localeCompare(b)).map(([hour,count])=>({hour,count})),categoryBreakdown:[...categories].map(([name,count])=>({name,count})),userActivity:[...actors].map(([user,events])=>({user,events,role:'Recorded actor'})),approvalStats:[...approvals].map(([name,count])=>({name,count})),dataQualityTrend:[]};
  }, [allEvents]);

  const [selectedEvent, setSelectedEvent] = useState(allEvents[0] || null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL_EVENTS'); // 'ALL_EVENTS' | 'ANALYTICS' | 'REPORTS'
  const [filteredEvents, setFilteredEvents] = useState(allEvents);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Audit &amp; Compliance Ledger"
        subtitle="Immutable event history, operator approvals, and compliance reporting"
        icon={History}
        badge={<StatusBadge variant="teal" size="xs">SIMULATED AUDIT TRAIL</StatusBadge>}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="secondary"
              icon={Download}
              onClick={() => setIsReportModalOpen(true)}
            >
              Export Report (9 Templates)
            </Button>
          </div>
        }
      />

      {/* 2. Six Enterprise KPI Cards */}
      <AuditKpis events={allEvents} />

      {/* 3. Section Switcher Tabs */}
      <div className="flex items-center justify-between pb-1 border-b border-brand-border">
        <div className="flex items-center gap-1.5 p-1 bg-brand-bg border border-brand-border rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('ALL_EVENTS')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
              activeTab === 'ALL_EVENTS'
                ? 'bg-white text-navy-primary shadow-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Master Event Ledger ({allEvents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'ANALYTICS'
                ? 'bg-white text-navy-primary shadow-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Compliance Analytics</span>
          </button>
        </div>

        <div className="text-xs font-mono text-text-secondary">
          AUDIT TRAIL: <strong className="text-text-secondary">Operational events recorded (not cryptographically certified)</strong>
        </div>
      </div>

      {/* 4. Active Tab Content */}
      {allEvents.length === 0 ? (
        <EmptyState
          icon={History}
          title="No audit events recorded"
          description="Operational events will appear here as actions are performed across all modules — including dispatch, allocation, recovery, and resource management."
        />
      ) : activeTab === 'ANALYTICS' ? (
        <AuditVisualAnalytics analytics={auditAnalytics} />
      ) : (
        <div className="space-y-6">
          {/* Visual Analytics Preview strip */}
          <AuditVisualAnalytics analytics={auditAnalytics} />

          {/* Master Audit Event Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-section-title text-text-primary">
                Chronological Chain-of-Custody &amp; Operational Decisions
              </h3>
              <span className="text-xs text-text-secondary font-mono">
                Live Multi-Subsystem Logging
              </span>
            </div>

            <AuditEventTable
              events={allEvents}
              selectedEventId={selectedEvent?.id}
              onSelectEvent={handleSelectEvent}
              onFilteredEventsChange={setFilteredEvents}
            />
          </div>
        </div>
      )}

      {/* 5. Event Details Inspector Drawer */}
      <EventDetailDrawer
        event={selectedEvent}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* 6. Report Templates & Export Modal */}
      <ReportTemplatesModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        events={filteredEvents}
        onExportReport={(rep) => {
            // Log the export event to the global audit trail
            addAuditEvent({
              action: 'REPORT_EXPORTED',
              module: 'Audit & Reports',
              user: 'Operational Coordinator',
              role: 'Logistics Officer',
              details: `Report exported: ${rep.template?.title || 'Unknown'} (${rep.format}) — file: ${rep.filename} — records: ${filteredEvents.length}`,
              entity: rep.template?.id,
              severity: 'INFO',
            });
          }}
      />
    </div>
  );
}
