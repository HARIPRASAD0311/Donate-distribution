import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileCheck2,
  Navigation,
  MapPin,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { useAppStore } from '../../store/useAppStore.js';

import { DISPATCH_STAGES } from './data/dispatchData.js';

import { DispatchKpis } from './components/DispatchKpis.jsx';
import { DispatchPipeline } from './components/DispatchPipeline.jsx';
import { DispatchVisualizations } from './components/DispatchVisualizations.jsx';
import { DispatchTable } from './components/DispatchTable.jsx';
import { ProofOfDeliveryModal } from './components/ProofOfDeliveryModal.jsx';
import { DispatchActionModals } from './components/DispatchActionModals.jsx';

/**
 * ResQNet Dispatch & Verification Dashboard Page
 * Part A Implementation: Execution tracking, lifecycle pipeline,
 * exception resolution, and proof-of-delivery verification.
 */
export default function DispatchPage() {
  const dispatchOrders = useAppStore(state => state.dispatchOrders);
  const dispatchOperationalStock = useAppStore(state => state.dispatchOperationalStock);
  const verifyOperationalReceipt = useAppStore(state => state.verifyOperationalReceipt);
  const createOperationalDispatch = useAppStore(state => state.createOperationalDispatch);
  const recordOperationalArrival = useAppStore(state => state.recordOperationalArrival);
  const dispatches = useMemo(() => dispatchOrders.map(d => ({...d,destination:d.destination||d.destinationFacilityId,progressPct:d.status==='VERIFIED'?100:d.status==='IN_TRANSIT'||d.status==='PARTIALLY_VERIFIED'?50:20,unit:d.lines?.[0]?.unit,quantity:d.quantity,pod:d.pod||null})), [dispatchOrders]);
  const [selectedDispatch, setSelectedDispatch] = useState(dispatches[0]);
  const [activeStageFilter, setActiveStageFilter] = useState('ALL');

  // Modals state
  const [podModalState, setPodModalState] = useState({
    isOpen: false,
    dispatch: null,
  });

  const [actionModalState, setActionModalState] = useState({
    isOpen: false,
    type: null,
    dispatch: null,
  });

  // Dispatch lifecycle is committed exclusively through operational store actions.
  const handleVerifyPOD = ({ dispatch, podData }) => {
    const result = verifyOperationalReceipt({dispatchId:dispatch.id,deliveryId:podData.deliveryId,receivedQuantity:Number(podData.receivedQuantity),acceptedQuantity:Number(podData.acceptedQuantity),damagedQuantity:Number(podData.damagedQuantity||0),rejectedQuantity:Number(podData.rejectedQuantity||0),destinationFacilityId:dispatch.destinationFacilityId||'DESTINATION',actor:podData.verificationOfficer||'SIMULATED_VERIFIER'});
    if (!result.ok) { window.alert(result.error); return result; }
    setPodModalState({isOpen:false,dispatch:null});
    return result;
  };

  const handleActionSubmit = ({ actionType, dispatch, data }) => {
    if (actionType === 'CREATE_DISPATCH') {
      const planId=data.planId; const plan=useAppStore.getState().allocationPlans.find(p=>p.id===planId&&p.status==='APPROVED');
      const allocation=plan?.allocations?.find(a=>a.demandId===data.demandId)||plan?.allocations?.[0];
      const result=createOperationalDispatch({id:data.id,planId,destinationFacilityId:data.destinationFacilityId||'DESTINATION',demandId:allocation?.demandId,metadata:{destination:data.destination,source:data.source,vehicle:data.vehicle,carrier:data.carrier,route:data.route,commodity:allocation?.commodity,item:allocation?.item,unit:allocation?.unit}});
      if(!result.ok) window.alert(result.error);
    } else if (actionType === 'DISPATCH_SHIPMENT' && dispatch) {
      const result=dispatchOperationalStock({dispatchId:dispatch.id,planId:dispatch.planId,lines:dispatch.lines,destinationFacilityId:dispatch.destinationFacilityId,demandId:dispatch.demandId});
      if(!result.ok) window.alert(result.error);
    } else if (actionType === 'RECORD_ARRIVAL' && dispatch) {
      recordOperationalArrival(dispatch.id);
    } else if (actionType === 'REROUTE_EXCEPTION' && dispatch) {
      useAppStore.setState(state=>({dispatchOrders:state.dispatchOrders.map(d=>d.id===dispatch.id?{...d,route:data.newRoute,exceptionReason:null}:d),auditEvents:[...state.auditEvents,{id:`AUD-${state.auditEvents.length+1}`,timestamp:new Date().toISOString(),actor:'SIMULATED_DISPATCH_OPERATOR',action:'DISPATCH_REROUTED',entityId:dispatch.id,previousState:dispatch.route,newState:data.newRoute,reason:data.justification,isDemo:true}]}));
    }
  };

  const filteredByStageDispatches =
    activeStageFilter === 'ALL'
      ? dispatches
      : dispatches.filter((d) => d.status === activeStageFilter);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Dispatch &amp; Delivery Verification"
        subtitle="Shipment tracking, corridor surveillance, and electronic proof-of-delivery"
        icon={Truck}
        badge={<StatusBadge variant="teal" size="xs">CHAIN OF CUSTODY</StatusBadge>}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="secondary"
              icon={RotateCcw}
              onClick={() => {
                setActiveStageFilter('ALL');
                // Operational dispatch history is append-only; reset is intentionally disabled.
              }}
            >
              Reset Dispatches
            </Button>

            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() =>
                setActionModalState({
                  isOpen: true,
                  type: 'CREATE_DISPATCH',
                  dispatch: null,
                })
              }
            >
              Create Dispatch Order
            </Button>
          </div>
        }
      />

      {/* Simulated Data Notice */}
      <div className="p-3 bg-status-warning-bg border border-status-warning-border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-status-warning shrink-0" />
          <div>
            <span className="font-bold text-text-primary">SIMULATED DISPATCH DATA:</span>
            <span className="text-text-secondary ml-1.5">
              All convoy records, coordinates, and delivery timelines are synthetic demonstration data. No real shipment tracking is active.
            </span>
          </div>
        </div>
        <StatusBadge variant="warning" size="xs">DEMO DATASET</StatusBadge>
      </div>

      {/* 2. Six KPI Cards */}
      <DispatchKpis dispatches={dispatches} />

      {/* 3. 8-Stage Visual Pipeline */}
      <DispatchPipeline
        dispatches={dispatches}
        activeStageFilter={activeStageFilter}
        onSelectStage={setActiveStageFilter}
      />

      {/* 4. Visualizations: Map, Exceptions, Delivery Timeline */}
      <DispatchVisualizations
        dispatches={dispatches}
        onSelectDispatch={(d) => setSelectedDispatch(d)}
        onResolveException={(exc) =>
          setActionModalState({
            isOpen: true,
            type: 'REROUTE_EXCEPTION',
            dispatch: exc,
          })
        }
      />

      {/* 5. Master Dispatch Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-section-title text-text-primary">
            Humanitarian Consignment Manifest &amp; Custody Ledger
          </h3>
          <span className="text-xs text-text-secondary font-mono">
            {dispatches.length} Total Registered Convoys
          </span>
        </div>

        <DispatchTable
          dispatches={filteredByStageDispatches}
          selectedId={selectedDispatch?.id}
          onSelectDispatch={(d) => setSelectedDispatch(d)}
          onOpenPODModal={(d) => setPodModalState({ isOpen: true, dispatch: d })}
          onTriggerAction={(actionType, d) =>
            setActionModalState({
              isOpen: true,
              type: actionType,
              dispatch: d,
            })
          }
        />

        {filteredByStageDispatches.length === 0 && (
          <EmptyState
            icon={Truck}
            title="No dispatch orders in this stage"
            description="There are no convoys matching the selected pipeline stage filter. Select a different stage or reset to view all orders."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setActiveStageFilter('ALL')}
              >
                Show All Stages
              </Button>
            }
          />
        )}
      </div>

      {/* 6. Proof of Delivery (POD) Modal */}
      <ProofOfDeliveryModal
        isOpen={podModalState.isOpen}
        onClose={() => setPodModalState({ isOpen: false, dispatch: null })}
        dispatch={podModalState.dispatch}
        onSubmitVerification={handleVerifyPOD}
      />

      {/* 7. Action Modals (Create, Reroute, Depart, Arrive) */}
      <DispatchActionModals
        modalState={actionModalState}
        onClose={() => setActionModalState({ isOpen: false, type: null, dispatch: null })}
        onSubmitAction={handleActionSubmit}
      />
    </div>
  );
}
