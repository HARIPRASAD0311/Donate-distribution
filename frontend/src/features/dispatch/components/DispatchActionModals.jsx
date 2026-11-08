import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Navigation,
  FileCheck,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';

/**
 * Functional Dispatch Lifecycle Action Modals
 * Supports Create Dispatch, Assign Vehicle, Verify Route, Mark Ready,
 * Dispatch Shipment, Record Arrival, Confirm Delivery, Report Discrepancy.
 */
export function DispatchActionModals({
  modalState, // { isOpen: boolean, type: string, dispatch?: object }
  onClose,
  onSubmitAction,
}) {
  const { isOpen, type, dispatch } = modalState || {};

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (type === 'CREATE_DISPATCH') {
        setFormData({
          id: `DSP-2026-${Math.floor(10 + Math.random() * 89)}`,
          planId: 'PLAN-ALPHA',
          source: 'Central Staging Depot (CSD-01)',
          destination: 'Delta Estuary Evacuation Settlement',
          commodity: 'FOOD',
          item: 'High-Energy Emergency Food Biscuits (BP-5)',
          batchId: 'BATCH-24045',
          quantity: 1000,
          unit: 'packets',
          vehicle: 'Shallow-Draft Barge Flotilla (BRG-02)',
          carrier: 'UN OCHA Riverine Flotilla',
          route: 'Route rt-4 (Waterway)',
          expectedArrival: 'Tomorrow 12:00 UTC',
          notes: 'Emergency supplementary feeding batch',
        });
      } else if (type === 'REROUTE_EXCEPTION' && dispatch) {
        setFormData({
          id: dispatch.id,
          originalRoute: dispatch.route,
          newRoute: 'Northern Highland Passable Detour (+4.5h transit)',
          assignedVehicle: dispatch.vehicle,
          escortOfficer: 'UN Peacekeeping Logistics Escort Team',
          justification: 'Avoid flooded culvert at km 42; road verified clear by satellite recon.',
        });
      } else if (type === 'ASSIGN_VEHICLE' && dispatch) {
        setFormData({
          id: dispatch.id,
          vehicle: '10-Ton Heavy Convoy Truck #09',
          carrier: 'National Civil Protection Agency',
          driverName: 'S. Tembe',
          licensePlate: 'MC-249-BZ',
        });
      }
    }
  }, [isOpen, type, dispatch]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitAction?.({
        actionType: type,
        dispatch,
        data: formData,
      });
      onClose?.();
    }, 400);
  };

  const getTitle = () => {
    switch (type) {
      case 'CREATE_DISPATCH':
        return 'Create Consignment Dispatch Order';
      case 'REROUTE_EXCEPTION':
        return 'Reroute Disrupted Shipment Around Obstacle';
      case 'ASSIGN_VEHICLE':
        return 'Assign Transport Asset & Driver';
      case 'DISPATCH_SHIPMENT':
        return 'Authorize Gate Release & Depart Convoy';
      case 'RECORD_ARRIVAL':
        return 'Record Checkpoint Arrival';
      default:
        return 'Dispatch Action';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-xs">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-dark/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-lg bg-white border border-brand-border rounded-xl shadow-dropdown overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-light text-teal">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-primary">{getTitle()}</h3>
              <p className="text-[11px] text-text-secondary">Chain-of-custody tracking action</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded text-text-secondary hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Reroute Form */}
            {type === 'REROUTE_EXCEPTION' && (
              <>
                <div className="p-3 rounded-lg bg-status-critical-bg/30 border border-status-critical-border text-xs text-status-critical">
                  <strong>Disruption Alert:</strong> {dispatch?.exceptionReason || 'Washout encountered.'}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Select Verified Alternative Bypass Corridor *
                  </label>
                  <select
                    value={formData.newRoute}
                    onChange={(e) => setFormData({ ...formData, newRoute: e.target.value })}
                    className="w-full h-8 px-2 text-xs rounded border border-brand-border bg-white"
                  >
                    <option value="Northern Highland Passable Detour (+4.5h transit)">
                      Northern Highland Passable Detour (+4.5h transit)
                    </option>
                    <option value="Buzi River Shallow-Draft Waterway Barge Shuttle">
                      Buzi River Shallow-Draft Waterway Barge Shuttle
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Coordinator Rerouting Justification *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.justification}
                    onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                    className="w-full p-2 text-xs rounded border border-brand-border"
                  />
                </div>
              </>
            )}

            {/* Create Dispatch Form */}
            {type === 'CREATE_DISPATCH' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Dispatch Order ID
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.id}
                      className="w-full h-8 px-2 rounded border border-brand-border bg-brand-bg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Allocation Plan
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.planId}
                      className="w-full h-8 px-2 rounded border border-brand-border bg-brand-bg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Origin Facility
                    </label>
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full h-8 px-2 rounded border border-brand-border"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Destination Cluster
                    </label>
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full h-8 px-2 rounded border border-brand-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Commodity
                    </label>
                    <select
                      value={formData.commodity}
                      onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                      className="w-full h-8 px-2 rounded border border-brand-border bg-white"
                    >
                      <option value="FOOD">FOOD</option>
                      <option value="WATER">WATER</option>
                      <option value="MEDICAL">MEDICAL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full h-8 px-2 rounded border border-brand-border font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full h-8 px-2 rounded border border-brand-border font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Assigned Vehicle / Vessel
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    className="w-full h-8 px-2 rounded border border-brand-border"
                  />
                </div>
              </>
            )}

            {/* Quick Gate Dispatch Confirmation */}
            {type === 'DISPATCH_SHIPMENT' && (
              <div className="p-4 text-center space-y-2">
                <Navigation className="w-8 h-8 text-teal mx-auto" />
                <h4 className="text-sm font-bold text-navy-primary">Confirm Departure from Staging Gate</h4>
                <p className="text-xs text-text-secondary max-w-xs mx-auto">
                  Authorizing gate release for <strong>{dispatch?.id}</strong>. Consignment state will update to <strong>IN_TRANSIT</strong>.
                </p>
              </div>
            )}

            {/* Record Arrival Confirmation */}
            {type === 'RECORD_ARRIVAL' && (
              <div className="p-4 text-center space-y-2">
                <MapPin className="w-8 h-8 text-status-success mx-auto" />
                <h4 className="text-sm font-bold text-navy-primary">Record Arrival at Destination Hub</h4>
                <p className="text-xs text-text-secondary max-w-xs mx-auto">
                  Confirm physical arrival of <strong>{dispatch?.id}</strong> at {dispatch?.destination}. Ready for offloading.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t border-brand-border bg-brand-surface">
            <Button size="sm" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Confirm Action'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
