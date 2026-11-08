import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Building,
  Calendar,
  FileCheck,
  MapPin,
  Package,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';

/**
 * Enterprise Demand Action Modals
 * Supports:
 * - Add Demand (Registration form)
 * - Register Beneficiary Group
 * - Edit Demand
 * - Verify Demand (Field reconnaissance signoff with evidence ref)
 * - Dispute Demand (Flagging duplicates / false claims)
 */
export function DemandActionModals({
  modalState, // { isOpen: boolean, type: string, demand?: object, groups?: array }
  groups = [],
  onClose,
  onSubmit,
}) {
  const { isOpen, type, demand } = modalState || {};

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  // Initialize form state
  useEffect(() => {
    if (isOpen) {
      setActionSuccess(false);
      setErrors({});

      if (type === 'ADD_DEMAND') {
        setFormData({
          id: `DEM-2026-${Math.floor(100 + Math.random() * 899)}`,
          incidentId: 'INC-2026-0412',
          region: 'Buzi District',
          location: 'Munhava Valley Settlement Pocket',
          beneficiaryGroupId: groups[0]?.id || 'GRP-01',
          beneficiaryGroup: groups[0]?.name || 'Delta Estuary Evacuation Settlement',
          commodity: 'FOOD',
          item: 'High-Energy Emergency Food Biscuits (BP-5)',
          quantity: 1200,
          unit: 'packets',
          priority: 'HIGH',
          requiredByDate: '2026-11-08',
          reportingSource: 'Local Community Leader Satellite Phone Dispatch',
          verificationStatus: 'PENDING',
          notes: 'Rapid community request logged from flood cut-off zone.',
        });
      } else if (type === 'REGISTER_BENEFICIARY_GROUP') {
        setFormData({
          id: `GRP-0${Math.floor(7 + Math.random() * 3)}`,
          code: `CAMP-${Math.floor(10 + Math.random() * 89)}`,
          name: '',
          region: 'Buzi District',
          category: 'IDP Camp',
          population: 5000,
          underFivePercent: 40,
          pregnantLactatingPercent: 25,
          focalPoint: 'Community Elder Council',
          accessCondition: 'Waterway / Shallow Barge Only',
        });
      } else if (type === 'EDIT_DEMAND' && demand) {
        setFormData({
          id: demand.id,
          item: demand.item,
          quantity: demand.quantity,
          priority: demand.priority,
          requiredByDate: demand.requiredByDate,
          notes: demand.notes || '',
        });
      } else if (type === 'VERIFY_DEMAND' && demand) {
        setFormData({
          id: demand.id,
          verifiedBy: 'Dr. Kwame Mensah (UNICEF WASH/Nutrition Lead)',
          evidenceRef: `EVID-RNA-${Math.floor(1000 + Math.random() * 9000)}`,
          evidenceType: 'Ground Survey & Clinical Screening',
          verifiedQuantity: demand.quantity,
          notes: 'Field reconnaissance confirmed vulnerable population census matches request.',
        });
      } else if (type === 'DISPUTE_DEMAND' && demand) {
        setFormData({
          id: demand.id,
          disputedBy: 'S. Vance (WFP Senior Logistics Officer)',
          reason: 'Suspected duplicate request overlapping with existing cluster allocation.',
          evidenceRef: `DISPUTE-DUPL-${Math.floor(100 + Math.random() * 899)}`,
        });
      }
    }
  }, [isOpen, type, demand, groups]);

  // Handle ESC
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
    if (type === 'ADD_DEMAND') {
      if (!formData.item?.trim()) errs.item = 'Required item description is needed';
      if (!formData.quantity || formData.quantity <= 0) errs.quantity = 'Quantity must be > 0';
      if (!formData.requiredByDate) errs.requiredByDate = 'Required-by date is required';
      if (!formData.reportingSource?.trim()) errs.reportingSource = 'Reporting source is required';
    } else if (type === 'REGISTER_BENEFICIARY_GROUP') {
      if (!formData.name?.trim()) errs.name = 'Group name is required';
      if (!formData.population || formData.population <= 0) errs.population = 'Population must be > 0';
    } else if (type === 'VERIFY_DEMAND') {
      if (!formData.verifiedBy?.trim()) errs.verifiedBy = 'Verification officer is required';
      if (!formData.evidenceRef?.trim()) errs.evidenceRef = 'Auditable evidence reference required';
    } else if (type === 'DISPUTE_DEMAND') {
      if (!formData.reason?.trim()) errs.reason = 'Dispute justification is required';
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
        demand,
      });

      setTimeout(() => {
        onClose?.();
      }, 1200);
    }, 500);
  };

  const getTitleAndConfig = () => {
    switch (type) {
      case 'ADD_DEMAND':
        return {
          title: 'Register Humanitarian Distress Request',
          subtitle: 'Formal intake of field community need into ResQNet registry',
          icon: Package,
          accent: 'teal',
        };
      case 'REGISTER_BENEFICIARY_GROUP':
        return {
          title: 'Register Beneficiary Group / Cluster',
          subtitle: 'Geo-anchor new IDP settlement, clinic, or cut-off community',
          icon: Users,
          accent: 'navy',
        };
      case 'EDIT_DEMAND':
        return {
          title: 'Update Demand Specification',
          subtitle: 'Adjust quantities, required horizon, or operational priority',
          icon: FileCheck,
          accent: 'teal',
        };
      case 'VERIFY_DEMAND':
        return {
          title: 'Verify Distress Request with Evidence',
          subtitle: 'Authenticate field report with ground survey or satellite evidence',
          icon: ShieldCheck,
          accent: 'success',
        };
      case 'DISPUTE_DEMAND':
        return {
          title: 'Dispute / Flag Inaccurate Claim',
          subtitle: 'Flag suspected double-counting or access discrepancies',
          icon: ShieldAlert,
          accent: 'critical',
        };
      default:
        return {
          title: 'Demand Action',
          subtitle: 'Manage humanitarian demand request',
          icon: Package,
          accent: 'teal',
        };
    }
  };

  const config = getTitleAndConfig();
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
                : config.accent === 'success'
                ? 'bg-status-success-bg text-status-success'
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

        {/* Success Alert */}
        {actionSuccess ? (
          <div className="p-8 text-center space-y-3 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-navy-primary">Operation Successfully Synchronized</h4>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              The distress register has been updated and synchronized with the allocation engine.
            </p>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* === 1. ADD DEMAND FORM === */}
              {type === 'ADD_DEMAND' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Demand ID
                      </label>
                      <input
                        type="text"
                        disabled
                        value={formData.id}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border bg-brand-bg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Crisis Incident
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Cyclone Idai II (INC-2026-0412)"
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border bg-brand-bg text-text-secondary truncate"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Target Region
                      </label>
                      <select
                        value={formData.region}
                        onChange={(e) => handleChange('region', e.target.value)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border bg-white"
                      >
                        <option value="Buzi District">Buzi District</option>
                        <option value="Manga IDP Hub">Manga IDP Hub</option>
                        <option value="Chibabava Basin">Chibabava Basin</option>
                        <option value="Nhamatanda Corridor">Nhamatanda Corridor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Beneficiary Group Cluster
                      </label>
                      <select
                        value={formData.beneficiaryGroupId}
                        onChange={(e) => {
                          const grp = groups.find((g) => g.id === e.target.value);
                          handleChange('beneficiaryGroupId', e.target.value);
                          if (grp) handleChange('beneficiaryGroup', grp.name);
                        }}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border bg-white truncate"
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.region})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Commodity
                      </label>
                      <select
                        value={formData.commodity}
                        onChange={(e) => {
                          const comm = e.target.value;
                          handleChange('commodity', comm);
                          if (comm === 'WATER') handleChange('unit', 'containers');
                          else if (comm === 'MEDICAL') handleChange('unit', 'kits');
                          else handleChange('unit', 'packets');
                        }}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border bg-white"
                      >
                        <option value="FOOD">Food Supplies</option>
                        <option value="WATER">Safe Water</option>
                        <option value="MEDICAL">Medical Supplies</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.quantity}
                        onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        disabled
                        value={formData.unit}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border bg-brand-bg font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Required Item SKU *
                    </label>
                    <input
                      type="text"
                      value={formData.item}
                      onChange={(e) => handleChange('item', e.target.value)}
                      placeholder="e.g. High-Energy Emergency Biscuits BP-5"
                      className={`w-full h-8 text-xs px-2.5 rounded border ${
                        errors.item ? 'border-status-critical' : 'border-brand-border'
                      }`}
                    />
                    {errors.item && <p className="text-[10px] text-status-critical mt-0.5">{errors.item}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Priority Level
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => handleChange('priority', e.target.value)}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border bg-white"
                      >
                        <option value="CRITICAL">Critical (&lt;24h life threat)</option>
                        <option value="HIGH">High (24-48h severe deficit)</option>
                        <option value="MEDIUM">Medium (48-72h)</option>
                        <option value="NORMAL">Normal (&gt;72h)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Required-By Date *
                      </label>
                      <input
                        type="date"
                        value={formData.requiredByDate}
                        onChange={(e) => handleChange('requiredByDate', e.target.value)}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Reporting Field Source *
                    </label>
                    <input
                      type="text"
                      value={formData.reportingSource}
                      onChange={(e) => handleChange('reportingSource', e.target.value)}
                      placeholder="e.g. Red Cross Rapid Needs Assessment Scout"
                      className="w-full h-8 text-xs px-2.5 rounded border border-brand-border"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Initial Verification Status
                    </label>
                    <select
                      value={formData.verificationStatus}
                      onChange={(e) => handleChange('verificationStatus', e.target.value)}
                      className="w-full h-8 text-xs px-2 rounded border border-brand-border bg-white"
                    >
                      <option value="PENDING">Pending Reconnaissance Triage</option>
                      <option value="VERIFIED">Verified Ground Survey (Immediate Allocation)</option>
                    </select>
                  </div>
                </>
              )}

              {/* === 2. REGISTER BENEFICIARY GROUP FORM === */}
              {type === 'REGISTER_BENEFICIARY_GROUP' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Beneficiary Group / Settlement Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. North Buzi High Ground Evacuation Pocket"
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
                        Target Region
                      </label>
                      <select
                        value={formData.region}
                        onChange={(e) => handleChange('region', e.target.value)}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border bg-white"
                      >
                        <option value="Buzi District">Buzi District</option>
                        <option value="Manga IDP Hub">Manga IDP Hub</option>
                        <option value="Chibabava Basin">Chibabava Basin</option>
                        <option value="Nhamatanda Corridor">Nhamatanda Corridor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Cluster Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border bg-white"
                      >
                        <option value="IDP Camp">IDP Relocation Camp</option>
                        <option value="Isolated Rural Community">Cut-Off Rural Enclave</option>
                        <option value="Health Facility">Field Triage Clinic / Hospital</option>
                        <option value="Sanctuary">Vulnerable Care Sanctuary</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Census Population *
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.population}
                        onChange={(e) => handleChange('population', parseInt(e.target.value) || 0)}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        % Children &lt;5
                      </label>
                      <input
                        type="number"
                        max={100}
                        min={0}
                        value={formData.underFivePercent}
                        onChange={(e) => handleChange('underFivePercent', parseInt(e.target.value) || 0)}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        % Pregnant/Lactating
                      </label>
                      <input
                        type="number"
                        max={100}
                        min={0}
                        value={formData.pregnantLactatingPercent}
                        onChange={(e) => handleChange('pregnantLactatingPercent', parseInt(e.target.value) || 0)}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Focal Point / Community Committee
                    </label>
                    <input
                      type="text"
                      value={formData.focalPoint}
                      onChange={(e) => handleChange('focalPoint', e.target.value)}
                      className="w-full h-8 text-xs px-2.5 rounded border border-brand-border"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Access Restriction Condition
                    </label>
                    <input
                      type="text"
                      value={formData.accessCondition}
                      onChange={(e) => handleChange('accessCondition', e.target.value)}
                      className="w-full h-8 text-xs px-2.5 rounded border border-brand-border"
                    />
                  </div>
                </>
              )}

              {/* === 3. VERIFY DEMAND FORM === */}
              {type === 'VERIFY_DEMAND' && (
                <>
                  <div className="p-3 rounded-lg bg-status-success-bg border border-status-success-border text-xs text-status-success">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong>Authenticating Demand:</strong> Verification commits this distress request as confirmed humanitarian demand for the Allocation Planning solver.
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Verification Officer Name &amp; Agency *
                    </label>
                    <input
                      type="text"
                      value={formData.verifiedBy}
                      onChange={(e) => handleChange('verifiedBy', e.target.value)}
                      className={`w-full h-8 text-xs px-2.5 rounded border ${
                        errors.verifiedBy ? 'border-status-critical' : 'border-brand-border'
                      }`}
                    />
                    {errors.verifiedBy && <p className="text-[10px] text-status-critical mt-0.5">{errors.verifiedBy}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Auditable Evidence Reference *
                      </label>
                      <input
                        type="text"
                        value={formData.evidenceRef}
                        onChange={(e) => handleChange('evidenceRef', e.target.value)}
                        className={`w-full h-8 text-xs px-2.5 rounded border font-mono ${
                          errors.evidenceRef ? 'border-status-critical' : 'border-brand-border'
                        }`}
                      />
                      {errors.evidenceRef && <p className="text-[10px] text-status-critical mt-0.5">{errors.evidenceRef}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Evidence Methodology
                      </label>
                      <select
                        value={formData.evidenceType}
                        onChange={(e) => handleChange('evidenceType', e.target.value)}
                        className="w-full h-8 text-xs px-2 rounded border border-brand-border bg-white"
                      >
                        <option value="Ground Survey & Clinical Screening">Ground Survey &amp; MUAC Triage</option>
                        <option value="Copernicus SAR Satellite Inundation">Satellite Radar Imagery</option>
                        <option value="UAV Drone Aerial Reconnaissance">UAV Drone Aerial Reconnaissance</option>
                        <option value="Joint Cluster Lead Signoff">Joint Cluster Partner Signoff</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Field Findings &amp; Ground Notes *
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      className="w-full text-xs p-2.5 rounded border border-brand-border"
                    />
                  </div>
                </>
              )}

              {/* === 4. DISPUTE DEMAND FORM === */}
              {type === 'DISPUTE_DEMAND' && (
                <>
                  <div className="p-3 rounded-lg bg-status-critical-bg border border-status-critical-border text-xs text-status-critical">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong>Dispute Flag:</strong> Flagging this record locks it from automated allocation dispatch pending reconciliation.
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Dispute Justification *
                    </label>
                    <textarea
                      rows={3}
                      value={formData.reason}
                      onChange={(e) => handleChange('reason', e.target.value)}
                      placeholder="Specify reasons for dispute (e.g. duplicate request, double-counting)..."
                      className={`w-full text-xs p-2.5 rounded border ${
                        errors.reason ? 'border-status-critical' : 'border-brand-border'
                      }`}
                    />
                    {errors.reason && <p className="text-[10px] text-status-critical mt-0.5">{errors.reason}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Disputing Officer
                      </label>
                      <input
                        type="text"
                        value={formData.disputedBy}
                        onChange={(e) => handleChange('disputedBy', e.target.value)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Audit File Ref
                      </label>
                      <input
                        type="text"
                        value={formData.evidenceRef}
                        onChange={(e) => handleChange('evidenceRef', e.target.value)}
                        className="w-full h-8 text-xs px-2.5 rounded border border-brand-border font-mono"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-brand-border bg-brand-surface">
              <span className="text-[11px] text-text-secondary font-mono">
                SOP-DEMAND-VERIF-2026.1
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
