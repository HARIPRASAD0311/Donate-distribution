import React from 'react';
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  FileCheck,
  UserCheck,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';

/**
 * Enterprise Verification Queue & Triage Desk
 * Triage and inspect pending field distress reports.
 * Captures verification officer, timestamp, and evidence reference.
 */
export function VerificationQueue({
  pendingItems = [],
  disputedItems = [],
  onVerify,
  onDispute,
  onReject,
  onInspect,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Pending Verification Action Queue (2 cols) */}
      <div className="lg:col-span-2">
        <Card
          title="Field Distress Reconnaissance & Verification Queue"
          subtitle="Unverified distress reports awaiting formal ground survey or satellite evidence"
          badge={
            <StatusBadge variant={pendingItems.length > 0 ? 'warning' : 'success'} size="xs" pulse={pendingItems.length > 0}>
              {pendingItems.length} PENDING TRIAGE
            </StatusBadge>
          }
          noPadding
        >
          <div className="p-4 space-y-3">
            {pendingItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-secondary">
                <CheckCircle2 className="w-8 h-8 text-status-success mx-auto mb-2 opacity-80" />
                <div className="font-semibold text-text-primary">All Distress Reports Triaged</div>
                <p>No unverified community reports currently waiting in the reconnaissance queue.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-status-warning-border bg-status-warning-bg/25 space-y-2.5 transition-all hover:border-status-warning"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-navy-primary text-xs">{item.id}</span>
                          <StatusBadge
                            variant={item.priority === 'CRITICAL' ? 'critical' : 'warning'}
                            size="xs"
                          >
                            {item.priority}
                          </StatusBadge>
                          <span className="text-[10px] font-mono text-text-secondary bg-white px-1.5 py-0.5 rounded border border-brand-border">
                            {item.commodity}
                          </span>
                        </div>
                        <h4 className="font-bold text-text-primary text-xs mt-1">{item.item}</h4>
                        <div className="text-[11px] text-text-secondary">
                          {item.beneficiaryGroup} • {item.region}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-navy-primary text-sm block">
                          {new Intl.NumberFormat().format(item.quantity)}{' '}
                          <span className="text-[10px] font-normal text-text-secondary">{item.unit}</span>
                        </span>
                        <span className="text-[10px] font-mono text-status-warning">
                          Req by: {item.requiredByDate}
                        </span>
                      </div>
                    </div>

                    {/* Source Evidence Details */}
                    <div className="p-2 rounded bg-white/80 border border-brand-border-light text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-text-secondary font-mono">
                        <span>Report Source: <strong>{item.reportingSource}</strong></span>
                        <span>Evidence Ref: <strong>{item.verificationDetails?.evidenceRef || 'None'}</strong></span>
                      </div>
                      <p className="text-text-primary text-[11px] italic">
                        "{item.verificationDetails?.notes || item.notes}"
                      </p>
                    </div>

                    {/* Quick Triage Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => onInspect?.(item)}
                        className="text-xs text-teal hover:underline font-medium"
                      >
                        Inspect Dossier &amp; Coordinates →
                      </button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => onReject?.(item)}
                          className="text-text-secondary hover:text-status-critical"
                        >
                          Reject
                        </Button>
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => onDispute?.(item)}
                          className="text-status-critical"
                        >
                          Dispute Claim
                        </Button>
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => onVerify?.(item)}
                        >
                          Verify with Evidence
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 2. Disputed & Audit Exceptions Panel (1 col) */}
      <div className="space-y-4">
        <Card
          title="Disputed Claims & Audit Log"
          subtitle="Requests flagged for duplicate counting or access discrepancies"
          badge={<StatusBadge variant="critical" size="xs">{disputedItems.length} FLAGGED</StatusBadge>}
          noPadding
        >
          <div className="p-3 space-y-2.5">
            {disputedItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-secondary">
                No active disputed claims.
              </div>
            ) : (
              disputedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg bg-status-critical-bg/30 border border-status-critical-border/50 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-navy-primary">{item.id}</span>
                    <StatusBadge variant="critical" size="xs">DISPUTED</StatusBadge>
                  </div>
                  <div className="font-semibold text-text-primary text-[11px]">{item.item}</div>
                  <div className="text-[10px] font-mono text-text-secondary">{item.beneficiaryGroup}</div>
                  <p className="text-[11px] text-text-primary leading-tight">
                    {item.verificationDetails?.notes}
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-text-secondary font-mono pt-1 border-t border-brand-border-light">
                    <span>Officer: {item.verificationDetails?.verifiedBy}</span>
                    <button
                      type="button"
                      onClick={() => onInspect?.(item)}
                      className="text-teal underline font-medium"
                    >
                      Audit Trail
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Verification Standards SOP Card */}
        <div className="p-3.5 bg-brand-surface border border-brand-border rounded-lg text-xs space-y-1.5">
          <div className="font-bold text-navy-primary flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal" />
            Verification Integrity Policy
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            ResQNet requires an auditable evidence reference (ground survey, satellite SAR imagery, or cluster lead signoff) before unverified reports convert to actionable demand.
          </p>
        </div>
      </div>
    </div>
  );
}
