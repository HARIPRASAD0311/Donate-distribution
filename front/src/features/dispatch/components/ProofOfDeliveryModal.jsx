import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Package,
  Building,
  UserCheck,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';

/**
 * Section 5: Structured Proof of Delivery (POD) Verification Interface
 * Captures expected vs received, accepted vs damaged vs rejected,
 * receiver and verification officer signatures, and evidence reference.
 */
export function ProofOfDeliveryModal({
  isOpen,
  onClose,
  dispatch,
  onSubmitVerification,
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && dispatch) {
      setIsSuccess(false);
      setErrors({});

      const expected = dispatch.quantity || 0;
      setFormData({
        dispatchId: dispatch.id,
        deliveryId: `DEL-2026-${Math.floor(100 + Math.random() * 899)}`,
        allocationId: dispatch.allocationId,
        commodity: dispatch.commodity,
        item: dispatch.item,
        unit: dispatch.unit,
        expectedQuantity: expected,
        receivedQuantity: expected,
        acceptedQuantity: expected,
        damagedQuantity: 0,
        rejectedQuantity: 0,
        deliveryCondition: 'FULL_ACCEPTANCE',
        receiverName: 'Sister Maria Teresa (Clinic / Camp Representative)',
        receiverRole: 'Camp Assistance Committee Focal Point',
        verificationOfficer: 'UN WFP Field Monitor S. Vance',
        verificationAgency: 'WFP / OCHA Joint Logistics Inspection',
        evidenceRef: `POD-SIGNED-${dispatch.id}`,
        evidenceType: 'Waypoint Consignment Waybill & Physical Tally',
        notes: 'Consignment physical count completed. Seals intact upon offloading.',
      });
    }
  }, [isOpen, dispatch]);

  // formData is populated in an effect, so it is empty (or stale from a previous
  // dispatch) on the first render after opening. Don't render until it matches.
  if (!isOpen || !dispatch || formData.dispatchId !== dispatch.id) return null;

  const handleChange = (field, val) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: val };

      // Auto-balance quantities if received/damaged change
      if (field === 'receivedQuantity' || field === 'damagedQuantity' || field === 'rejectedQuantity') {
        const rec = field === 'receivedQuantity' ? parseInt(val) || 0 : next.receivedQuantity;
        const dam = field === 'damagedQuantity' ? parseInt(val) || 0 : next.damagedQuantity;
        const rej = field === 'rejectedQuantity' ? parseInt(val) || 0 : next.rejectedQuantity;
        next.acceptedQuantity = Math.max(0, rec - dam - rej);

        if (next.acceptedQuantity === next.expectedQuantity) {
          next.deliveryCondition = 'FULL_ACCEPTANCE';
        } else if (next.acceptedQuantity > 0) {
          next.deliveryCondition = 'PARTIAL_DELIVERY';
        } else {
          next.deliveryCondition = 'FAILED_REJECTED';
        }
      }

      return next;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.receivedQuantity || formData.receivedQuantity < 0) {
      errs.receivedQuantity = 'Received quantity cannot be negative';
    }
    if (formData.acceptedQuantity < 0) {
      errs.acceptedQuantity = 'Accepted quantity invalid';
    }
    if (!formData.receiverName?.trim()) {
      errs.receiverName = 'Field receiver name is required';
    }
    if (!formData.verificationOfficer?.trim()) {
      errs.verificationOfficer = 'Verification officer name is required';
    }
    if (!formData.evidenceRef?.trim()) {
      errs.evidenceRef = 'Waybill or proof reference document is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);

      const result = onSubmitVerification?.({
        dispatch,
        podData: { ...formData, verifiedTimestamp: new Date().toISOString() },
      });
      if (result?.ok === false) {
        setErrors({ submission: result.error || 'Receipt verification failed' });
        return;
      }
      setIsSuccess(true);
      setTimeout(() => onClose?.(), 1000);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-dark/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-xl bg-white border border-brand-border rounded-xl shadow-dropdown overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-light text-teal">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-navy-primary">
                  Proof of Delivery (POD) Electronic Verification
                </h3>
                <StatusBadge variant="teal" size="xs">CHAIN OF CUSTODY</StatusBadge>
              </div>
              <p className="text-xs text-text-secondary">
                Certify physical reception, offload inspection, and quantity acceptance
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

        {isSuccess ? (
          <div className="p-8 text-center space-y-3 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-navy-primary">
              Proof of Delivery Verified &amp; Signed
            </h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Accepted quantity ({formData.acceptedQuantity} {formData.unit}) has updated corresponding demand fulfillment and depot ledger records.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {errors.submission && <div className="p-2 rounded bg-status-critical-bg text-status-critical">{errors.submission}</div>}
              {/* Consignment Header Overview */}
              <div className="p-3 bg-brand-bg border border-brand-border rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                <div>
                  <span className="text-[10px] text-text-secondary block font-sans">Dispatch Ref</span>
                  <strong className="text-navy-primary">{dispatch.id}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary block font-sans">Destination</span>
                  <strong className="text-navy-primary truncate block">{dispatch.destination}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary block font-sans">Expected Qty</span>
                  <strong className="text-teal">{dispatch.quantity} {dispatch.unit}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary block font-sans">Condition</span>
                  <StatusBadge
                    variant={formData.deliveryCondition === 'FULL_ACCEPTANCE' ? 'success' : 'warning'}
                    size="xs"
                  >
                    {(formData.deliveryCondition || '').replace(/_/g, ' ')}
                  </StatusBadge>
                </div>
              </div>

              {/* Tally Numbers Matrix (Expected, Received, Accepted, Damaged, Rejected) */}
              <div className="p-3 bg-white border border-brand-border rounded-lg space-y-2">
                <span className="font-bold text-navy-primary text-[11px] uppercase tracking-wider font-mono block">
                  Physical Offload Tally &amp; Discrepancy Reconciliation
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-primary mb-1">
                      Received Total *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.receivedQuantity}
                      onChange={(e) => handleChange('receivedQuantity', e.target.value)}
                      className="w-full h-8 px-2 text-xs rounded border border-brand-border font-mono font-bold text-navy-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-status-success mb-1">
                      Accepted Usable *
                    </label>
                    <input
                      type="number"
                      disabled
                      value={formData.acceptedQuantity}
                      className="w-full h-8 px-2 text-xs rounded border border-brand-border bg-brand-bg font-mono font-bold text-status-success"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-status-warning mb-1">
                      Damaged in Transit
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.damagedQuantity}
                      onChange={(e) => handleChange('damagedQuantity', e.target.value)}
                      className="w-full h-8 px-2 text-xs rounded border border-brand-border font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-status-critical mb-1">
                      Rejected (Spoiled/QC)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.rejectedQuantity}
                      onChange={(e) => handleChange('rejectedQuantity', e.target.value)}
                      className="w-full h-8 px-2 text-xs rounded border border-brand-border font-mono"
                    />
                  </div>
                </div>

                {formData.damagedQuantity > 0 && (
                  <p className="text-[10px] text-status-warning font-medium">
                    ⚠ Partial delivery noted: {formData.damagedQuantity} units damaged will be logged as a discrepancy.
                  </p>
                )}
              </div>

              {/* Signatures & Evidence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Beneficiary Receiver Name *
                  </label>
                  <input
                    type="text"
                    value={formData.receiverName}
                    onChange={(e) => handleChange('receiverName', e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded border border-brand-border"
                  />
                  {errors.receiverName && <p className="text-[10px] text-status-critical mt-0.5">{errors.receiverName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Verification Officer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.verificationOfficer}
                    onChange={(e) => handleChange('verificationOfficer', e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded border border-brand-border"
                  />
                  {errors.verificationOfficer && <p className="text-[10px] text-status-critical mt-0.5">{errors.verificationOfficer}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Waybill / Evidence Reference ID *
                  </label>
                  <input
                    type="text"
                    value={formData.evidenceRef}
                    onChange={(e) => handleChange('evidenceRef', e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded border border-brand-border font-mono"
                  />
                  {errors.evidenceRef && <p className="text-[10px] text-status-critical mt-0.5">{errors.evidenceRef}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Evidence Methodology
                  </label>
                  <input
                    type="text"
                    value={formData.evidenceType}
                    onChange={(e) => handleChange('evidenceType', e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded border border-brand-border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Offload Notes &amp; Inspector Comments
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="w-full p-2 text-xs rounded border border-brand-border"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-brand-border bg-brand-surface">
              <span className="text-[10px] text-text-secondary font-mono">
                SOP-POD-HUMANITARIAN-REV-4
              </span>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" disabled={isSubmitting} icon={CheckCircle2}>
                  {isSubmitting ? 'Signing...' : 'Verify Proof of Delivery'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
