import React, { useState } from 'react';
import {
  X,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Building,
  Truck,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';

/**
 * Area 5 & 11: Recovery Plan Approval & Human Governance Modal
 */
export function RecoveryApprovalModal({
  isOpen,
  onClose,
  strategy,
  onApprove,
  onReject,
  onRequestModification,
}) {
  const [reviewerName, setReviewerName] = useState('Operational Commander S. Vance');
  const [reviewerRole, setReviewerRole] = useState('UN OCHA Crisis Response Director');
  const [overrideReason, setOverrideReason] = useState(
    'Authorized implementation of Strategy Alpha. Mobilizing river barge flotilla and Mi-8 helicopter cargo sling provides 100% critical coverage with acceptable cost delta.'
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [decision, setDecision] = useState('APPROVED');

  if (!isOpen) return null;

  const handleDecision = (type) => {
    setDecision(type);
    setIsSuccess(true);

    const payload = {
      reviewerName,
      role: reviewerRole,
      reason: overrideReason,
      timestamp: new Date().toISOString(),
    };

    setTimeout(() => {
      if (type === 'APPROVE') onApprove?.(strategy?.id, payload);
      else if (type === 'REJECT') onReject?.(strategy?.id, payload);
      else if (type === 'MODIFY') onRequestModification?.(strategy?.id, payload);

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
      <div className="relative w-full max-w-lg bg-white border border-brand-border rounded-xl shadow-dropdown overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-light text-teal">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-navy-primary">
                  Human Oversight: Recovery Plan Authorization
                </h3>
                <StatusBadge variant="teal" size="xs">AREA 5</StatusBadge>
              </div>
              <p className="text-xs text-text-secondary">
                Authorize contingency response and commitment of reserve assets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-brand-bg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-navy-primary">
              Recovery Action {decision === 'APPROVE' ? 'Authorized' : decision}
            </h4>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              Contingency routing parameters submitted to Dispatch &amp; Verification module.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Strategy Snapshot */}
            <div className="p-3 bg-brand-bg border border-brand-border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-primary text-xs">{strategy?.name}</span>
                <StatusBadge variant="success" size="xs">{strategy?.feasibility}</StatusBadge>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-center pt-1 border-t border-brand-border-light">
                <div>
                  <span className="text-[10px] text-text-secondary block font-sans">Coverage</span>
                  <strong className="text-status-success">{strategy?.criticalCoveragePct}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary block font-sans">Restoration Time</span>
                  <strong className="text-navy-primary">{strategy?.expectedRecoveryTimeHours}h</strong>
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary block font-sans">Total Cost</span>
                  <strong className="text-teal">${new Intl.NumberFormat().format(strategy?.operatingCostUSD || 0)}</strong>
                </div>
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
                  className="w-full h-8 text-xs px-2.5 rounded border border-brand-border font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Coordinator Mandate
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
                Mandatory Operational Justification *
              </label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded border border-brand-border leading-relaxed"
                placeholder="State why this candidate recovery action is authorized over alternative detours..."
              />
            </div>

            <div className="p-2.5 rounded bg-status-success-bg/40 border border-status-success-border text-[11px] text-status-success flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Approving will lock this contingency strategy and update network corridor assignments.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-brand-border">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDecision('REJECT')}
                className="text-status-critical hover:bg-status-critical-bg"
              >
                Reject Strategy
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
                  Authorize Recovery Plan
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
