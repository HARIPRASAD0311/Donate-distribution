import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Clock,
  History,
  FileCheck,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { MOCK_PLAN_HISTORY } from '../data/allocationData.js';

/**
 * Enterprise Human Approval & Governance Workflow Modal
 * Stage 6: Human review, signoff, rejection, or modification request.
 * Records reviewer identity, timestamp, and operational justification.
 */
export function HumanApprovalModal({
  isOpen,
  onClose,
  plan,
  history = MOCK_PLAN_HISTORY,
  onApprove,
  onReject,
  onRequestModification,
}) {
  const [activeTab, setActiveTab] = useState('DECISION'); // 'DECISION' | 'HISTORY'
  const [reviewerName, setReviewerName] = useState('Operational Commander S. Vance');
  const [reviewerRole, setReviewerRole] = useState('UN OCHA Chief Operations Officer');
  const [justificationReason, setJustificationReason] = useState(
    'Reviewed and authorized. The proposed allocations strictly meet Sphere minimums and honor critical life-safety constraints.'
  );
  const [actionSuccess, setActionSuccess] = useState(false);
  const [actionType, setActionType] = useState('APPROVE');

  useEffect(() => {
    if (isOpen) {
      setActionSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDecision = (type) => {
    setActionType(type);
    setActionSuccess(true);

    const payload = {
      reviewerName,
      role: reviewerRole,
      reason: justificationReason,
      timestamp: new Date().toISOString(),
    };

    setTimeout(() => {
      if (type === 'APPROVE') onApprove?.(plan?.id, payload);
      else if (type === 'REJECT') onReject?.(plan?.id, payload);
      else if (type === 'MODIFY') onRequestModification?.(plan?.id, payload);

      setTimeout(() => {
        onClose?.();
      }, 1000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-dark/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-xl bg-white border border-brand-border rounded-xl shadow-dropdown overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-light text-teal">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-navy-primary">
                  Human Oversight &amp; Plan Authorization
                </h3>
                <StatusBadge variant="teal" size="xs">STAGE 06</StatusBadge>
              </div>
              <p className="text-xs text-text-secondary">
                Review solver proposal and record binding coordinator signature
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-brand-bg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-brand-border px-6 pt-2 bg-brand-surface">
          <button
            type="button"
            onClick={() => setActiveTab('DECISION')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'DECISION'
                ? 'border-teal text-teal'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Coordinator Signoff
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'border-teal text-teal'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Plan Revision History
          </button>
        </div>

        {/* Success Alert */}
        {actionSuccess ? (
          <div className="p-8 text-center space-y-3 animate-in fade-in duration-200">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              actionType === 'APPROVE'
                ? 'bg-status-success-bg text-status-success'
                : 'bg-status-warning-bg text-status-warning'
            }`}>
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-navy-primary">
              Decision Recorded into Immutable Audit Trail
            </h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Plan status updated to <strong>{actionType}D</strong>. Ready for Dispatch &amp; Verification execution.
            </p>
          </div>
        ) : activeTab === 'DECISION' ? (
          /* Decision Form */
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Plan Metrics Snapshot */}
            <div className="p-3 rounded-lg bg-brand-bg border border-brand-border grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-text-secondary block">Plan Reference</span>
                <span className="font-bold font-mono text-navy-primary">{plan?.id || 'PLAN-ALPHA'}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary block">Welfare Score</span>
                <span className="font-bold font-mono text-teal">{plan?.objectiveValue || '94.62'}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary block">Critical Coverage</span>
                <span className="font-bold font-mono text-status-success">{plan?.criticalCoveragePct || '100%'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Authorizing Coordinator *
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full h-8 text-xs px-2.5 rounded border border-brand-border"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Operational Mandate / Role
                </label>
                <input
                  type="text"
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                  className="w-full h-8 text-xs px-2.5 rounded border border-brand-border"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Coordinator Rationale &amp; Audit Justification *
              </label>
              <textarea
                rows={3}
                value={justificationReason}
                onChange={(e) => setJustificationReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded border border-brand-border leading-relaxed"
                placeholder="State operational grounds for this authorization or rejection..."
              />
            </div>

            <div className="p-2.5 rounded bg-status-success-bg/40 border border-status-success-border text-[11px] text-status-success flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Approving will lock this allocation and stage it for consignment dispatch generation.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-brand-border">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDecision('REJECT')}
                className="text-status-critical hover:bg-status-critical-bg"
              >
                Reject Plan
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDecision('MODIFY')}
                >
                  Request Modification
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  icon={CheckCircle2}
                  onClick={() => handleDecision('APPROVE')}
                >
                  Authorize &amp; Commit Plan
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Revision History View */
          <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
            <h4 className="text-xs font-bold text-navy-primary uppercase tracking-wider font-mono">
              Historical Allocation Plan Revisions
            </h4>

            <div className="space-y-2.5">
              {history.map((rev) => (
                <div
                  key={rev.version}
                  className="p-3 rounded-lg border border-brand-border bg-white text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-navy-primary">{rev.version}</span>
                    <StatusBadge
                      variant={
                        rev.status === 'APPROVED'
                          ? 'success'
                          : rev.status === 'PENDING_HUMAN_APPROVAL'
                          ? 'teal'
                          : 'warning'
                      }
                      size="xs"
                    >
                      {rev.status}
                    </StatusBadge>
                  </div>

                  <div className="flex justify-between text-[11px] text-text-secondary">
                    <span>Generated: {rev.createdAt.replace('T', ' ').substring(0, 16)}</span>
                    <span className="font-mono">Welfare: {rev.welfareScore}</span>
                  </div>

                  <p className="text-[11px] text-text-primary leading-tight">
                    {rev.notes}
                  </p>

                  {rev.reviewedBy && (
                    <div className="text-[10px] text-text-secondary font-mono pt-1 border-t border-brand-border-light">
                      Reviewed by: {rev.reviewedBy} on {rev.reviewedAt?.replace('T', ' ').substring(0, 16)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
