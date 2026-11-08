import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  ArrowRightLeft,
  ShieldAlert,
  Archive,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Truck,
  FileCheck,
  Building,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';

/**
 * Enterprise Resource Action Modals
 * Supports Inbound Receive, Inter-facility Transfer, Convoy Reserve,
 * Cycle Adjustment, Quality Quarantine, and Master Resource Intake.
 * All operations include validation and are labeled as SIMULATED.
 */
export function ResourceActionModals({
  modalState, // { isOpen: boolean, type: string, batch?: object }
  onClose,
  onSubmit,
}) {
  const { isOpen, type, batch } = modalState || {};

  // Form states
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setActionSuccess(false);
      setErrors({});

      if (type === 'RECEIVE_STOCK') {
        setFormData({
          commodity: 'FOOD',
          name: '',
          category: 'Ready-to-Use Food',
          batchId: `BATCH-${Math.floor(24000 + Math.random() * 900)}`,
          facilityId: 'CSD-01',
          quantity: 1000,
          unit: 'packets',
          expiryDate: '2027-06-30',
          qualityStatus: 'VERIFIED_USABLE',
          source: 'UN WFP Global Staging Facility',
          notes: 'Standard humanitarian aid consignment',
        });
      } else if (type === 'TRANSFER_STOCK') {
        setFormData({
          batchId: batch?.batchId || '',
          resourceName: batch?.name || '',
          sourceFacility: batch?.facilityName || 'Central Staging Depot',
          targetFacility: batch?.facilityId === 'NLB-02' ? 'CSD-01' : 'NLB-02',
          quantity: Math.min(200, batch?.usableQty || 0),
          maxQuantity: batch?.usableQty || 0,
          unit: batch?.unit || 'units',
          transportMode: 'Secured Convoy',
          escortOfficer: 'UN OCHA Logistics Officer J. Chen',
        });
      } else if (type === 'RESERVE_STOCK') {
        setFormData({
          batchId: batch?.batchId || '',
          resourceName: batch?.name || '',
          quantity: Math.min(100, batch?.usableQty || 0),
          maxQuantity: batch?.usableQty || 0,
          unit: batch?.unit || 'units',
          convoyId: 'CNV-2026-088 (Manga Camp Sector 3)',
          durationDays: 7,
          authorizer: 'Field Logistics Director',
        });
      } else if (type === 'ADJUST_STOCK') {
        setFormData({
          batchId: batch?.batchId || '',
          resourceName: batch?.name || '',
          adjustmentType: 'DECREMENT',
          quantity: 10,
          reason: 'Cycle count physical count discrepancy',
          inspectorId: 'QC-INSPECTOR-449',
        });
      } else if (type === 'QUARANTINE_STOCK') {
        setFormData({
          batchId: batch?.batchId || '',
          resourceName: batch?.name || '',
          reason: 'Cold-chain temperature excursion breach (> +8°C)',
          quarantineLocation: 'Cold Box Isolation Vault C-03',
          protocolId: 'WHO-EPI-COLD-CHAIN-ISO',
          requiresLaboratoryRetest: true,
        });
      } else if (type === 'ADD_RESOURCE') {
        setFormData({
          name: '',
          commodity: 'FOOD',
          category: 'High-Protein Supplement',
          unit: 'packets',
          criticalThreshold: 500,
          storageRequirement: 'Dry Ambient (<25°C)',
        });
      }
    }
  }, [isOpen, type, batch]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose?.();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (type === 'RECEIVE_STOCK') {
      if (!formData.name?.trim()) errs.name = 'Resource description is required';
      if (!formData.batchId?.trim()) errs.batchId = 'Batch / Lot ID is required';
      if (!formData.quantity || formData.quantity <= 0) errs.quantity = 'Must enter positive quantity';
      if (!formData.expiryDate) errs.expiryDate = 'Expiry date required';
    } else if (type === 'TRANSFER_STOCK') {
      if (!formData.quantity || formData.quantity <= 0) errs.quantity = 'Enter valid transfer quantity';
      if (formData.quantity > formData.maxQuantity) {
        errs.quantity = `Quantity cannot exceed usable stock (${formData.maxQuantity} ${formData.unit})`;
      }
      if (formData.sourceFacility === formData.targetFacility) {
        errs.targetFacility = 'Target facility must differ from source';
      }
    } else if (type === 'RESERVE_STOCK') {
      if (!formData.quantity || formData.quantity <= 0) errs.quantity = 'Enter valid reserve quantity';
      if (formData.quantity > formData.maxQuantity) {
        errs.quantity = `Cannot reserve more than usable stock (${formData.maxQuantity})`;
      }
    } else if (type === 'ADJUST_STOCK') {
      if (!formData.quantity || formData.quantity <= 0) errs.quantity = 'Adjustment quantity must be > 0';
      if (!formData.reason?.trim()) errs.reason = 'Discrepancy justification required for audit';
    } else if (type === 'QUARANTINE_STOCK') {
      if (!formData.reason?.trim()) errs.reason = 'Quarantine clinical/safety reason required';
    } else if (type === 'ADD_RESOURCE') {
      if (!formData.name?.trim()) errs.name = 'Catalogue name is required';
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
      setActionSuccess(true);
      onSubmit?.({
        actionType: type,
        data: formData,
        batch,
      });

      setTimeout(() => {
        onClose?.();
      }, 1200);
    }, 600);
  };

  const getTitleAndIcon = () => {
    switch (type) {
      case 'RECEIVE_STOCK':
        return {
          title: 'Receive Inbound Consignment',
          subtitle: 'Log verified humanitarian intake into depot storage',
          icon: Package,
          accent: 'teal',
        };
      case 'TRANSFER_STOCK':
        return {
          title: 'Inter-Facility Stock Transfer',
          subtitle: 'Relocate usable commodities between logistics staging hubs',
          icon: ArrowRightLeft,
          accent: 'navy',
        };
      case 'RESERVE_STOCK':
        return {
          title: 'Earmark Stock for Corridor Convoy',
          subtitle: 'Place protective hold on stock for pending dispatch mission',
          icon: Archive,
          accent: 'teal',
        };
      case 'ADJUST_STOCK':
        return {
          title: 'Record Stock Count Adjustment',
          subtitle: 'Log inventory cycle discrepancy with auditable justification',
          icon: Sliders,
          accent: 'warning',
        };
      case 'QUARANTINE_STOCK':
        return {
          title: 'Quarantine & Lock Batch',
          subtitle: 'Immediately revoke usability due to contamination, damage, or excursion',
          icon: ShieldAlert,
          accent: 'critical',
        };
      case 'ADD_RESOURCE':
      default:
        return {
          title: 'Create Master Commodity SKU',
          subtitle: 'Add new resource specification to humanitarian registry',
          icon: Package,
          accent: 'teal',
        };
    }
  };

  const config = getTitleAndIcon();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-dark/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-lg bg-white border border-brand-border rounded-xl shadow-dropdown overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              config.accent === 'critical'
                ? 'bg-status-critical-bg text-status-critical'
                : config.accent === 'warning'
                ? 'bg-status-warning-bg text-status-warning'
                : 'bg-teal-light text-teal'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-navy-primary">{config.title}</h3>
                <StatusBadge variant="neutral" size="xs">SIMULATED</StatusBadge>
              </div>
              <p className="text-xs text-text-secondary">{config.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-brand-bg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success State Notification */}
        {actionSuccess ? (
          <div className="p-8 text-center space-y-3 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-navy-primary">Operation Successfully Logged</h4>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              The humanitarian inventory ledger has been synchronized. Audit trail record created.
            </p>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Batch Info Callout for target batch operations */}
              {batch && (
                <div className="p-3 rounded-lg bg-brand-bg border border-brand-border-light text-xs flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono text-text-secondary block">Selected Lot Reference</span>
                    <span className="font-bold text-navy-primary">{batch.name}</span>
                    <span className="text-text-secondary font-mono ml-2">({batch.batchId})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-text-secondary block">Usable Stock</span>
                    <span className="font-mono font-bold text-status-success">
                      {batch.usableQty} {batch.unit}
                    </span>
                  </div>
                </div>
              )}

              {/* === 1. RECEIVE STOCK FORM === */}
              {type === 'RECEIVE_STOCK' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Commodity Stream
                      </label>
                      <select
                        value={formData.commodity}
                        onChange={(e) => handleChange('commodity', e.target.value)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border bg-white text-text-primary focus:outline-none focus:border-teal"
                      >
                        <option value="FOOD">Food Supplies</option>
                        <option value="WATER">Safe Water</option>
                        <option value="MEDICAL">Medical Supplies</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Batch / Consignment ID *
                      </label>
                      <input
                        type="text"
                        value={formData.batchId}
                        onChange={(e) => handleChange('batchId', e.target.value)}
                        className={`w-full h-8 text-xs px-2.5 rounded border font-mono ${
                          errors.batchId ? 'border-status-critical' : 'border-brand-border'
                        } focus:outline-none focus:border-teal`}
                      />
                      {errors.batchId && <p className="text-[10px] text-status-critical mt-0.5">{errors.batchId}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Resource Description / SKU *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Therapeutic High-Energy Biscuits BP-5"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={`w-full h-8 text-xs px-2.5 rounded border ${
                        errors.name ? 'border-status-critical' : 'border-brand-border'
                      } focus:outline-none focus:border-teal`}
                    />
                    {errors.name && <p className="text-[10px] text-status-critical mt-0.5">{errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Depot Facility
                      </label>
                      <select
                        value={formData.facilityId}
                        onChange={(e) => handleChange('facilityId', e.target.value)}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border bg-white"
                      >
                        <option value="CSD-01">CSD-01 Central Depot</option>
                        <option value="NLB-02">NLB-02 North Base</option>
                        <option value="SRD-03">SRD-03 South Depot</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Unit
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => handleChange('unit', e.target.value)}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border bg-white font-mono"
                      >
                        <option value="packets">packets</option>
                        <option value="containers">containers (10L)</option>
                        <option value="liters">liters</option>
                        <option value="kits">kits</option>
                        <option value="vials">vials</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => handleChange('expiryDate', e.target.value)}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Initial QC Status
                      </label>
                      <select
                        value={formData.qualityStatus}
                        onChange={(e) => handleChange('qualityStatus', e.target.value)}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border bg-white"
                      >
                        <option value="VERIFIED_USABLE">Verified Usable (Lab PASS)</option>
                        <option value="AWAITING_QC">Awaiting Lab Verification</option>
                        <option value="QUARANTINED">Hold in Quarantine</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Institutional Donor / Supplier Source
                    </label>
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => handleChange('source', e.target.value)}
                      className="w-full h-8 text-xs px-2.5 rounded border border-brand-border"
                    />
                  </div>
                </>
              )}

              {/* === 2. TRANSFER STOCK FORM === */}
              {type === 'TRANSFER_STOCK' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Origin Facility
                      </label>
                      <input
                        type="text"
                        disabled
                        value={formData.sourceFacility}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border bg-brand-bg text-text-secondary font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Target Destination Hub *
                      </label>
                      <select
                        value={formData.targetFacility}
                        onChange={(e) => handleChange('targetFacility', e.target.value)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border bg-white text-text-primary"
                      >
                        <option value="CSD-01">Central Staging Depot (CSD-01)</option>
                        <option value="NLB-02">North Logistics Base (NLB-02)</option>
                        <option value="SRD-03">South Relief Depot (SRD-03)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Transfer Quantity ({formData.unit}) *
                      </label>
                      <input
                        type="number"
                        max={formData.maxQuantity}
                        min={1}
                        value={formData.quantity}
                        onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                        className={`w-full h-8 text-xs px-2.5 rounded border font-mono ${
                          errors.quantity ? 'border-status-critical' : 'border-brand-border'
                        }`}
                      />
                      {errors.quantity && <p className="text-[10px] text-status-critical mt-0.5">{errors.quantity}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Transport Convoy Mode
                      </label>
                      <select
                        value={formData.transportMode}
                        onChange={(e) => handleChange('transportMode', e.target.value)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border bg-white"
                      >
                        <option value="Secured Convoy">Secured Ground Convoy</option>
                        <option value="Air Cargo Shuttle">UNHAS Air Shuttle</option>
                        <option value="River Barge Flotilla">River Barge Flotilla</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Authorizing Logistics Officer
                    </label>
                    <input
                      type="text"
                      value={formData.escortOfficer}
                      onChange={(e) => handleChange('escortOfficer', e.target.value)}
                      className="w-full h-8 text-xs px-2.5 rounded border border-brand-border"
                    />
                  </div>
                </>
              )}

              {/* === 3. RESERVE STOCK FORM === */}
              {type === 'RESERVE_STOCK' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Target Operation / Beneficiary Cluster *
                    </label>
                    <input
                      type="text"
                      value={formData.convoyId}
                      onChange={(e) => handleChange('convoyId', e.target.value)}
                      className="w-full h-8 text-xs px-2.5 rounded border border-brand-border"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Reserve Quantity ({formData.unit}) *
                      </label>
                      <input
                        type="number"
                        max={formData.maxQuantity}
                        min={1}
                        value={formData.quantity}
                        onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                        className={`w-full h-8 text-xs px-2.5 rounded border font-mono ${
                          errors.quantity ? 'border-status-critical' : 'border-brand-border'
                        }`}
                      />
                      {errors.quantity && <p className="text-[10px] text-status-critical mt-0.5">{errors.quantity}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Reservation Hold Window
                      </label>
                      <select
                        value={formData.durationDays}
                        onChange={(e) => handleChange('durationDays', parseInt(e.target.value))}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border bg-white"
                      >
                        <option value={3}>3 Days (Urgent Push)</option>
                        <option value={7}>7 Days (Standard Stage)</option>
                        <option value={14}>14 Days (Corridor Contingency)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Authorizing Incident Commander
                    </label>
                    <input
                      type="text"
                      value={formData.authorizer}
                      onChange={(e) => handleChange('authorizer', e.target.value)}
                      className="w-full h-8 text-xs px-2.5 rounded border border-brand-border"
                    />
                  </div>
                </>
              )}

              {/* === 4. ADJUST STOCK FORM === */}
              {type === 'ADJUST_STOCK' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Adjustment Direction
                      </label>
                      <select
                        value={formData.adjustmentType}
                        onChange={(e) => handleChange('adjustmentType', e.target.value)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border bg-white"
                      >
                        <option value="DECREMENT">Shrinkage / Damage (-)</option>
                        <option value="INCREMENT">Surplus Reconciliation (+)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Quantity Variance *
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.quantity}
                        onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                        className={`w-full h-8 text-xs px-2.5 rounded border font-mono ${
                          errors.quantity ? 'border-status-critical' : 'border-brand-border'
                        }`}
                      />
                      {errors.quantity && <p className="text-[10px] text-status-critical mt-0.5">{errors.quantity}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Audit Discrepancy Reason *
                    </label>
                    <textarea
                      rows={2}
                      value={formData.reason}
                      onChange={(e) => handleChange('reason', e.target.value)}
                      className={`w-full text-xs p-2.5 rounded border ${
                        errors.reason ? 'border-status-critical' : 'border-brand-border'
                      }`}
                      placeholder="Specify physical verification findings..."
                    />
                    {errors.reason && <p className="text-[10px] text-status-critical mt-0.5">{errors.reason}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Auditor / Inspector ID
                    </label>
                    <input
                      type="text"
                      value={formData.inspectorId}
                      onChange={(e) => handleChange('inspectorId', e.target.value)}
                      className="w-full h-8 text-xs px-2.5 rounded border border-brand-border font-mono"
                    />
                  </div>
                </>
              )}

              {/* === 5. QUARANTINE FORM === */}
              {type === 'QUARANTINE_STOCK' && (
                <>
                  <div className="p-3 rounded-lg bg-status-critical-bg border border-status-critical-border text-xs text-status-critical">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong>Safety Protocol Alert:</strong> Marking this batch as quarantined will immediately revoke its usability status, block it from FEFO allocation queues, and stage it for disposal or retesting.
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Quarantine Cause & Non-Compliance *
                    </label>
                    <select
                      value={formData.reason}
                      onChange={(e) => handleChange('reason', e.target.value)}
                      className="w-full h-8 text-xs px-2.5 rounded border border-brand-border bg-white text-text-primary"
                    >
                      <option value="Cold-chain temperature excursion breach (> +8°C)">Cold-chain temperature excursion breach (&gt; +8°C)</option>
                      <option value="Suspected water bacterial contamination (Turbidity > 5 NTU)">Water quality failure (Turbidity / Coliform)</option>
                      <option value="Aflatoxin or moisture packaging compromise">Packaging compromise / spoilage</option>
                      <option value="Manufacturer precautionary recall notice">Manufacturer precautionary recall notice</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Isolation Bin / Vault
                      </label>
                      <input
                        type="text"
                        value={formData.quarantineLocation}
                        onChange={(e) => handleChange('quarantineLocation', e.target.value)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        SOP Standard Protocol
                      </label>
                      <input
                        type="text"
                        value={formData.protocolId}
                        onChange={(e) => handleChange('protocolId', e.target.value)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* === 6. ADD RESOURCE FORM === */}
              {type === 'ADD_RESOURCE' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Commodity Name & Description *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Therapeutic Ready-to-Use Food Paste"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={`w-full h-8 text-xs px-2.5 rounded border ${
                        errors.name ? 'border-status-critical' : 'border-brand-border'
                      }`}
                    />
                    {errors.name && <p className="text-[10px] text-status-critical mt-0.5">{errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Commodity Stream
                      </label>
                      <select
                        value={formData.commodity}
                        onChange={(e) => handleChange('commodity', e.target.value)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border bg-white"
                      >
                        <option value="FOOD">Food Supplies</option>
                        <option value="WATER">Safe Water</option>
                        <option value="MEDICAL">Medical Supplies</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Unit of Measure
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => handleChange('unit', e.target.value)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border bg-white font-mono"
                      >
                        <option value="packets">packets</option>
                        <option value="containers">containers (10L)</option>
                        <option value="liters">liters</option>
                        <option value="kits">kits</option>
                        <option value="vials">vials</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Low Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        value={formData.criticalThreshold}
                        onChange={(e) => handleChange('criticalThreshold', parseInt(e.target.value) || 0)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Storage Requirement
                      </label>
                      <input
                        type="text"
                        value={formData.storageRequirement}
                        onChange={(e) => handleChange('storageRequirement', e.target.value)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-brand-border bg-brand-surface">
              <span className="text-[11px] text-text-secondary font-mono">
                SOP-LOG-REV-2026.4
              </span>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant={config.accent === 'critical' ? 'danger' : 'primary'}
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Synchronizing...' : config.title}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
