import React from 'react';
import {
  History,
  User,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { SideDrawer } from '../../../components/drawers/SideDrawer.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';

/**
 * Section 4: Event Details Inspector Drawer
 * Deep forensic audit dossier displaying actor, values before/after,
 * justification reason, authorization references, and evidence links.
 */
export function EventDetailDrawer({
  event,
  isOpen,
  onClose,
}) {
  if (!event) return null;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={event.action}
      subtitle={`Audit Log Ref: ${event.id} • ${event.module}`}
      badge={
        <StatusBadge
          variant={event.status === 'VERIFIED' ? 'success' : event.status === 'DISPUTED' ? 'critical' : 'teal'}
          size="xs"
        >
          {event.status}
        </StatusBadge>
      }
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-mono text-text-secondary">
            APPEND-ONLY EVENT LOG • SIMULATED RECORD
          </span>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-6 text-xs">
        {/* 1. Actor & Timestamp Header */}
        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-navy-primary uppercase tracking-wider font-mono text-[11px] flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal" />
              Authorized Actor Identity
            </span>
            <span className="font-mono text-[11px] text-text-secondary">
              {event.timestamp.replace('T', ' ').substring(0, 19)} UTC
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded bg-white border border-brand-border">
              <span className="text-[10px] text-text-secondary block">Operator Name:</span>
              <strong className="text-navy-primary text-xs">{event.user}</strong>
            </div>
            <div className="p-2.5 rounded bg-white border border-brand-border">
              <span className="text-[10px] text-text-secondary block">Assigned Role:</span>
              <strong className="text-teal text-xs">{event.role}</strong>
            </div>
          </div>
        </div>

        {/* 2. State Mutation: Previous Value vs New Value */}
        <div className="space-y-2">
          <h4 className="font-bold text-navy-primary uppercase tracking-wider font-mono text-xs flex items-center gap-1.5">
            <History className="w-4 h-4 text-teal" />
            Entity State Mutation
          </h4>

          <div className="p-3.5 rounded-lg border border-brand-border bg-white space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-text-secondary">Target Entity:</span>
              <span className="font-bold text-navy-primary">{event.entityId}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-brand-border-light">
              <div className="p-2.5 rounded bg-brand-bg border border-brand-border-light">
                <span className="text-[10px] text-text-secondary font-mono block">Previous Value:</span>
                <span className="font-mono font-bold text-text-secondary text-xs">{event.previousValue || 'N/A'}</span>
              </div>

              <div className="p-2.5 rounded bg-teal-light/30 border border-teal/30">
                <span className="text-[10px] text-teal font-mono block">New Recorded Value:</span>
                <span className="font-mono font-bold text-teal text-xs">{event.newValue || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Reason & Operational Justification */}
        <div className="space-y-2">
          <h4 className="font-bold text-navy-primary uppercase tracking-wider font-mono text-xs flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-teal" />
            Operational Rationale &amp; Audit Notes
          </h4>

          <div className="p-3.5 rounded-lg border border-brand-border bg-brand-surface text-xs leading-relaxed italic text-text-primary">
            "{event.reason}"
          </div>
        </div>

        {/* 4. Evidence & Approval References */}
        <div className="space-y-2">
          <h4 className="font-bold text-navy-primary uppercase tracking-wider font-mono text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal" />
            Authorization Signatures &amp; Evidence Dossier
          </h4>

          <div className="p-3.5 rounded-lg border border-brand-border bg-white space-y-2 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-text-secondary">Supervisory Approval Ref:</span>
              <strong className="text-navy-primary">{event.approvalRef || 'SYSTEM_DEFAULT'}</strong>
            </div>

            <div className="flex justify-between">
              <span className="text-text-secondary">Evidence Document Ref:</span>
              <strong className="text-teal">{event.evidenceRef || 'INTERNAL_TELEMETRY'}</strong>
            </div>

            {event.relatedEvents && event.relatedEvents.length > 0 && (
              <div className="pt-2 border-t border-brand-border-light flex justify-between">
                <span className="text-text-secondary">Related Event IDs:</span>
                <span className="text-text-primary">{event.relatedEvents.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
