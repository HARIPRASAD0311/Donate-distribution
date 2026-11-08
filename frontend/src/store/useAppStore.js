import { create } from 'zustand';
import { DEMO_CONFIG } from '../mock-data/config.js';
import { MOCK_INCIDENTS, CRISIS_TYPES, REGIONS } from '../mock-data/incidents.mock.js';
import { createOperationalState } from '../domain/createOperationalState.js';
import { reserveStock, dispatchStock, verifyReceipt, lotBalances } from '../domain/operationalLedger.js';
import {
  validateGeographicLocation,
  enrichLocationWithOperationalContext,
} from '../domain/geographicModel.js';
import {
  enrichRouteWithDispatch,
  deriveRouteStatusFromDispatch,
  normalizeRouteStatus,
  ROUTE_STATUS,
} from '../domain/transportRouteModel.js';
import {
  validateDisasterZone,
  analyzeZoneImpact,
} from '../domain/disasterZoneModel.js';
import {
  generateGeographicAlerts,
} from '../domain/geographicAlertsModel.js';

const initialOperational = createOperationalState();

export const useAppStore = create((set, get) => ({
  ...initialOperational,
  // Dashboard adapters are derived from these authoritative collections at render time.
  getInventoryItems: () => get().inventoryLots.map(l => ({...l, commodity:l.commodityId, totalQty:lotBalances(l).onHand, usableQty:lotBalances(l).usable, reservedQty:lotBalances(l).reserved, quarantinedQty:lotBalances(l).quarantined, receivedQty:l.quantityReceived, receivedDate:l.receivedAt, fefoEligible:lotBalances(l).available>0, movementHistory:[]})),
  getDemandItems: () => get().demandRecords.map(d => ({...d, commodity:d.commodityId, remainingQuantity:Math.max(0,d.quantity-(d.fulfilledQuantity||0))})),
  getDispatchItems: () => get().dispatchOrders.map(d => ({...d, destination:d.destination||d.destinationFacilityId, progressPct:d.status==='VERIFIED'?100:d.status==='IN_TRANSIT'||d.status==='PARTIALLY_VERIFIED'?50:20, unit:d.lines?.[0]?.unit, quantity:d.quantity, pod:d.pod||null})),
  receiveOperationalStock: (data) => { const state=get(); const id=data.id||`LOT-${Date.now()}`; const commodityId=data.commodityId||data.commodity; const quantity=Number(data.quantity); if(!commodityId||!data.unit||!data.facilityId||!(Number.isFinite(quantity)&&quantity>0)) return {ok:false,error:'Commodity, unit, facility and positive quantity are required'}; if(state.inventoryLots.some(l=>l.id===id)) return {ok:false,error:'Duplicate inventory lot ID'}; if(state.facilities?.length&&!state.facilities.some(f=>f.id===data.facilityId||f.code===data.facilityId)) return {ok:false,error:'Unknown receiving facility'}; if(data.expiryDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(data.expiryDate)||Number.isNaN(new Date(`${data.expiryDate}T00:00:00`).getTime()))) return {ok:false,error:'Invalid expiry date'}; const now=new Date().toISOString(); const transaction={id:`TX-${id}-RECEIPT`,type:'RECEIPT',quantity,unit:data.unit,commodityId,at:now}; const lot={id,commodityId,commodity:commodityId,facilityId:data.facilityId,batchId:data.batchId,quantityReceived:quantity,unit:data.unit,expiryDate:data.expiryDate,qualityStatus:data.qualityStatus||'PENDING_QC',source:data.source,receivedAt:now,transactions:[transaction],reservations:[],isDemo:true}; set({inventoryLots:[lot,...state.inventoryLots],inventoryTransactions:[...state.inventoryTransactions,{...transaction,lotId:id}],auditEvents:[...state.auditEvents,{id:`AUD-${state.auditEvents.length+1}`,timestamp:now,actor:'SIMULATED_RECEIVING_OPERATOR',action:'STOCK_RECEIVED',entityId:id,previousState:'NOT_RECEIVED',newState:'RECEIVED',reason:'Inbound stock receipt',relatedTransactionId:transaction.id,isDemo:true}]}); return {ok:true,value:lot}; },
  quarantineOperationalLot: (lotId, actor='SIMULATED_QA_OFFICER') => set(state => {const lot=state.inventoryLots.find(l=>l.id===lotId); if(!lot)return {}; const now=new Date().toISOString(); return {inventoryLots:state.inventoryLots.map(l=>l.id===lotId?{...l,qualityStatus:'QUARANTINED',transactions:[...(l.transactions||[]),{id:`TX-Q-${lotId}-${state.auditEvents.length}`,type:'QUARANTINE',quantity:lotBalances(l).onHand,unit:l.unit,commodityId:l.commodityId,at:now}]}:l),auditEvents:[...state.auditEvents,{id:`AUD-${state.auditEvents.length+1}`,timestamp:now,actor,action:'STOCK_QUARANTINED',entityId:lotId,previousState:lot.qualityStatus,newState:'QUARANTINED',reason:'Quality quarantine',isDemo:true}]};}),
  upsertDemandRecord: (record) => { const state=get(); if(!record?.id) return {ok:false,error:'Demand ID is required'}; const old=state.demandRecords.find(d=>d.id===record.id); const next={...old,...record,commodityId:record.commodityId||record.commodity||old?.commodityId,fulfilledQuantity:old?(old.fulfilledQuantity||0):0}; delete next.remainingQuantity; set({demandRecords:old?state.demandRecords.map(d=>d.id===record.id?next:d):[{...next,fulfilledQuantity:0},...state.demandRecords],auditEvents:[...state.auditEvents,{id:`AUD-${state.auditEvents.length+1}`,timestamp:new Date().toISOString(),actor:'SIMULATED_DEMAND_OPERATOR',action:old?'DEMAND_UPDATED':'DEMAND_CREATED',entityId:record.id,previousState:old?'EXISTING':'NEW',newState:next.verificationStatus||'PENDING',reason:'Demand register update',isDemo:true}]}); return {ok:true,value:next}; },
  verifyDemandRecord: (id, details={}) => { const state=get(); const demand=state.demandRecords.find(d=>d.id===id); if(!demand) return {ok:false,error:'Demand record not found'}; if(demand.verificationStatus==='VERIFIED') return {ok:true,value:demand,unchanged:true}; const now=new Date().toISOString(); const next={...demand,verificationStatus:'VERIFIED',verificationDetails:{...details,verifiedAt:now}}; set({demandRecords:state.demandRecords.map(d=>d.id===id?next:d),auditEvents:[...state.auditEvents,{id:`AUD-${state.auditEvents.length+1}`,timestamp:now,actor:details.verifiedBy||'SIMULATED_VERIFIER',action:'DEMAND_VERIFIED',entityId:id,previousState:demand.verificationStatus||'PENDING',newState:'VERIFIED',reason:details.notes||'Demand verification completed',isDemo:true}]}); return {ok:true,value:next}; },
  upsertBeneficiaryGroup: (group) => set(state => ({beneficiaryGroups:state.beneficiaryGroups.some(g=>g.id===group.id)?state.beneficiaryGroups.map(g=>g.id===group.id?group:g):[group,...state.beneficiaryGroups]})),
  cancelAllocation: (planId, reason='Allocation cancelled') => { const state=get(); const plan=state.allocationPlans.find(p=>p.id===planId); if(!plan) return {ok:false,error:'Allocation plan not found'}; if(state.dispatchOrders.some(d=>d.planId===planId && ['READY','IN_TRANSIT','PARTIALLY_VERIFIED','VERIFIED','ARRIVED_AWAITING_POD'].includes(d.status))) return {ok:false,error:'Cannot cancel an allocation after dispatch'}; const now=new Date().toISOString(); const lineIds=new Set(state.allocationLines.filter(l=>l.planId===planId).map(l=>l.id)); const lots=state.inventoryLots.map(l=>({...l,reservations:(l.reservations||[]).map(r=>lineIds.has(r.lineId)&&r.status==='ACTIVE'?{...r,status:'RELEASED'}:r)})); set({inventoryLots:lots,stockReservations:(state.stockReservations||[]).map(r=>r.planId===planId&&r.status==='ACTIVE'?{...r,status:'RELEASED'}:r),allocationLines:state.allocationLines.map(l=>l.planId===planId&&['RESERVED','PARTIALLY_DISPATCHED'].includes(l.status)?{...l,status:'RELEASED'}:l),allocationPlans:state.allocationPlans.map(p=>p.id===planId?{...p,status:'CANCELLED'}:p),auditEvents:[...state.auditEvents,{id:`AUD-${state.auditEvents.length+1}`,timestamp:now,actor:'SIMULATED_OPERATOR',action:'ALLOCATION_CANCELLED',entityId:planId,previousState:plan.status,newState:'CANCELLED',reason,isDemo:true}]}); return {ok:true}; },
  approveOperationalAllocation: (plan, actor='SIMULATED_OPERATOR') => { let state=get(); const planId=plan.id||plan.planId; if(!planId) return {ok:false,error:'Allocation plan ID is required'}; if(state.allocationPlans.some(p=>p.id===planId&&p.status==='APPROVED')) return {ok:false,error:'Allocation is already approved'}; let next=state; const lines=[]; const demandTotals={}; for(const a of (plan.allocations||[])){ const demand=next.demandRecords.find(d=>d.id===a.demandId); const commodityId=a.commodityId||a.commodity; const quantity=Number(a.allocatedQty||a.quantity); if(!demand||demand.verificationStatus!=='VERIFIED'||demand.commodityId!==commodityId||demand.unit!==a.unit||quantity<=0||quantity+ (demandTotals[a.demandId]||0)>(demand.quantity-(demand.fulfilledQuantity||0))) return {ok:false,error:`Demand eligibility or quantity validation failed for ${a.demandId}`}; demandTotals[a.demandId]=(demandTotals[a.demandId]||0)+quantity; const before=next.allocationLines.length; const result=reserveStock(next,{planId,commodityId,unit:a.unit,facilityId:a.sourceFacilityId,quantity,demandId:a.demandId,destinationFacilityId:a.destinationFacilityId||null,actor,reason:'Approved allocation reservation'}); if(!result.ok)return result; next={...result.value,allocationLines:result.value.allocationLines.map((l,i)=>i>=before?{...l,demandId:a.demandId,destinationFacilityId:a.destinationFacilityId||null}:l)}; lines.push(...result.lines.map(line=>({...line,demandId:a.demandId,destinationFacilityId:a.destinationFacilityId||null}))); } if(!lines.length)return {ok:false,error:'Allocation contains no reservable lines'}; const record={...plan,id:planId,status:'APPROVED',approvedAt:new Date().toISOString(),isDemo:true}; next={...next,allocationPlans:[...next.allocationPlans.filter(p=>p.id!==planId),record],allocationLines:next.allocationLines.map(l=>({...l})),auditEvents:[...next.auditEvents,{id:`AUD-${next.auditEvents.length+1}`,timestamp:new Date().toISOString(),actor,action:'ALLOCATION_APPROVED',entityId:planId,previousState:'PENDING_APPROVAL',newState:'APPROVED',reason:'Stock validated and reserved',relatedTransactionId:planId,isDemo:true}]}; set(next); return {ok:true,value:record,lines}; },
  upsertAllocationPlan: (plan, status='PENDING_APPROVAL', actor='SIMULATED_OPERATOR') => set(state => { const previous=state.allocationPlans.find(p=>p.id===(plan.id||plan.planId)); const record={...plan,id:plan.id||plan.planId,status,isDemo:plan.isDemo ?? state.dataMode === 'demo'}; return {allocationPlans:previous?state.allocationPlans.map(p=>p.id===record.id?record:p):[...state.allocationPlans,record],auditEvents:[...state.auditEvents,{id:`AUD-${state.auditEvents.length+1}`,timestamp:new Date().toISOString(),actor,action:`ALLOCATION_${status}`,entityId:record.id,previousState:previous?.status||'NEW',newState:status,reason:'Allocation workflow transition',relatedTransactionId:record.id,isDemo:true}]}; }),
  recordRecoveryResult: (result) => set(state => ({ recoveryResults:[...state.recoveryResults,{...result,isDemo:true,createdAt:new Date().toISOString(),status:'SIMULATION_GENERATED',simulationGenerated:true,decisionApproved:false,operationalActionApplied:false,operationalActionStatus:'NOT_APPLIED'}],auditEvents:[...state.auditEvents,{id:`AUD-${state.auditEvents.length+1}`,timestamp:new Date().toISOString(),actor:'SIMULATED_RECOVERY_ENGINE',action:'RECOVERY_SIMULATION_RECORDED',entityId:result.simulationId||'SIMULATION',previousState:null,newState:'SIMULATED',reason:'Simulation recorded against operational snapshot; no inventory mutation',isDemo:true}] })),
  recordRecoveryDecision: (decision) => { const state=get(); const stored=state.recoveryResults.find(r=>r.simulationId===decision.simulationId); if(!stored) return {ok:false,error:'Stored recovery simulation not found'}; if(stored.decision) return {ok:false,error:'Recovery simulation already has a decision'}; const baseline=stored.operationalSnapshot; if(!baseline) return {ok:false,error:'Recovery simulation has no operational baseline snapshot'}; const current={inventoryLots:state.inventoryLots,demandRecords:state.demandRecords,allocationPlans:state.allocationPlans,dispatchOrders:state.dispatchOrders,deliveryRecords:state.deliveryRecords}; if(decision.status==='APPROVED' && JSON.stringify(baseline)!==JSON.stringify(current)) return {ok:false,error:'Recovery simulation is stale; operational state changed since baseline'}; const now=new Date().toISOString(); set({recoveryResults:state.recoveryResults.map(r=>r.simulationId===decision.simulationId?{...r,decision:decision.status,decisionReason:decision.reason,decidedAt:now,decidedBy:decision.actor,operationalMutationApplied:false,decisionApproved:decision.status==='APPROVED',operationalActionApplied:false,operationalActionStatus:decision.status==='APPROVED'?'PENDING_IMPLEMENTATION':'NOT_APPLIED'}:r),auditEvents:[...state.auditEvents,{id:`AUD-${state.auditEvents.length+1}`,timestamp:now,actor:decision.actor||'SIMULATED_REVIEWER',action:`RECOVERY_${decision.status}`,entityId:decision.simulationId,previousState:'SIMULATED',newState:decision.status,reason:`${decision.reason||'Recovery decision recorded'}; no operational resource transaction was applied`,isDemo:true}]}); return {ok:true,operationalMutationApplied:false}; },
  createOperationalDispatch: ({id,planId,destinationFacilityId,demandId=null,metadata={}}) => { const state=get(); const plan=state.allocationPlans.find(p=>p.id===planId&&p.status==='APPROVED'); if(!plan)return {ok:false,error:'Dispatch requires an approved allocation'}; if(!id||state.dispatchOrders.some(d=>d.id===id))return {ok:false,error:'Duplicate or missing dispatch ID'}; if(!destinationFacilityId || (state.facilities?.length&&!state.facilities.some(f=>f.id===destinationFacilityId||f.code===destinationFacilityId)))return {ok:false,error:'Unknown destination facility'}; const lines=state.allocationLines.filter(l=>l.planId===planId&&(!demandId||l.demandId===demandId)&&['RESERVED','PARTIALLY_DISPATCHED'].includes(l.status)); if(!lines.length)return {ok:false,error:'No undispatched allocation lines exist'}; const chosen=lines.filter(l=>!l.destinationFacilityId||l.destinationFacilityId===destinationFacilityId); if(chosen.length!==lines.length)return {ok:false,error:'Destination does not match allocation lines'}; const demandIds=new Set(chosen.map(l=>l.demandId).filter(Boolean)); if(demandIds.size>1)return {ok:false,error:'Create separate dispatch orders for each demand record'}; const order={id,planId,lines:chosen.map(l=>({...l,quantity:l.quantity-(l.dispatchedQuantity||0)})),quantity:chosen.reduce((n,l)=>n+l.quantity-(l.dispatchedQuantity||0),0),destinationFacilityId,demandId:demandId||chosen[0].demandId,status:'READY',...metadata,isDemo:true}; if(!(order.quantity>0))return {ok:false,error:'No remaining quantity to dispatch'}; set({dispatchOrders:[order,...state.dispatchOrders],auditEvents:[...state.auditEvents,{id:`AUD-${state.auditEvents.length+1}`,timestamp:new Date().toISOString(),actor:'SIMULATED_DISPATCH_OPERATOR',action:'DISPATCH_ORDER_CREATED',entityId:id,previousState:'RESERVED',newState:'READY',reason:'Dispatch order created against approved allocation lines',isDemo:true}]}); return {ok:true,value:order}; },
  recordOperationalArrival: (dispatchId) => { const state=get(); const dispatch=state.dispatchOrders.find(d=>d.id===dispatchId); if(!dispatch) return {ok:false,error:'Dispatch not found'}; if(!dispatch.dispatchedAt || dispatch.status==='READY') return {ok:false,error:'Dispatch has not departed'}; if(!(dispatch.inTransitQuantity>0)) return {ok:false,error:'Dispatch has no remaining in-transit quantity'}; if(dispatch.status==='VERIFIED') return {ok:false,error:'Dispatch is already fully verified'}; if(dispatch.arrivedAt) return {ok:false,error:'Arrival has already been recorded'}; const now=new Date().toISOString(); set({dispatchOrders:state.dispatchOrders.map(d=>d.id===dispatchId?{...d,arrivedAt:now,status:'ARRIVED_AWAITING_POD'}:d),auditEvents:[...state.auditEvents,{id:`AUD-${state.auditEvents.length+1}`,timestamp:now,actor:'SIMULATED_RECEIVER',action:'DISPATCH_ARRIVAL_RECORDED',entityId:dispatchId,previousState:dispatch.status,newState:'ARRIVED_AWAITING_POD',reason:'Physical arrival recorded; receipt not yet verified',isDemo:true}]}); return {ok:true}; },
  reserveOperationalStock: (args) => { const result = reserveStock(get(), args); if (result.ok) set(result.value); return result; },
  dispatchOperationalStock: (args) => { const result = dispatchStock(get(), args); if (result.ok) set(result.value); return result; },
  verifyOperationalReceipt: (args) => { const result = verifyReceipt(get(), args); if (result.ok) set(result.value); return result; },
  // Active Operational Context (Persists across navigation)
  selectedIncident: MOCK_INCIDENTS[0],
  selectedCrisisType: MOCK_INCIDENTS[0].crisisType,
  selectedRegion: MOCK_INCIDENTS[0].region,
  reportingPeriod: 'today',
  dataMode: DEMO_CONFIG.isDemoMode ? 'demo' : 'live',
  isDemoMode: DEMO_CONFIG.isDemoMode,
  operatorRole: DEMO_CONFIG.operationalRole,
  lastDataFreshness: 'Synced 2m ago',
  
  // Navigation & Layout UI State
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  isSettingsOpen: false,
  
  // Inspector Drawer State
  activeDrawer: {
    isOpen: false,
    type: null,
    payload: null,
  },

  // Tactical Alert Banner
  alerts: [
    {
      id: 'ALT-01',
      severity: 'CRITICAL',
      message: 'Route rt-1 impassable at km 42 culvert washout. Reroute required.',
      timestamp: 'Today 07:45 UTC',
    },
  ],

  // Global Notification Centre State
  notifications: [
    {
      id: 'NOTIF-01',
      title: 'Culvert Washout Logged',
      message: 'Route rt-1 impassable at km 42 culvert. Alternative bypass suggested.',
      severity: 'critical',
      timestamp: '07:45 UTC',
      read: false,
    },
    {
      id: 'NOTIF-02',
      title: 'River Barge Dispatched',
      message: 'Shallow-draft barge BRG-02 departed Port Alpha with 300 water bladders.',
      severity: 'success',
      timestamp: '08:00 UTC',
      read: false,
    },
    {
      id: 'NOTIF-03',
      title: 'FEFO Threshold Notice',
      message: '15 food packet batches at Central Staging Depot nearing 15-day shelf life.',
      severity: 'warning',
      timestamp: '08:15 UTC',
      read: true,
    },
  ],

  // Append-only operational audit ledger; no fabricated institutional references.
  auditEvents: [],

  // Setters & Context Actions
  setSelectedIncident: (incident) => set({
    selectedIncident: incident,
    selectedCrisisType: incident.crisisType || get().selectedCrisisType,
    selectedRegion: incident.region || get().selectedRegion,
  }),

  setSelectedCrisisType: (crisisType) => {
    const matchingIncident = MOCK_INCIDENTS.find((inc) => inc.crisisType === crisisType);
    if (matchingIncident) {
      set({
        selectedCrisisType: crisisType,
        selectedIncident: matchingIncident,
        selectedRegion: matchingIncident.region,
      });
    } else {
      set({ selectedCrisisType: crisisType });
    }
  },

  setSelectedRegion: (region) => {
    const matchingIncident = MOCK_INCIDENTS.find((inc) => inc.region === region);
    if (matchingIncident) {
      set({
        selectedRegion: region,
        selectedIncident: matchingIncident,
        selectedCrisisType: matchingIncident.crisisType,
      });
    } else {
      set({
        selectedRegion: region,
        selectedIncident: {
          id: `UNSUPPORTED-${region}`,
          code: 'DATA-UNAVAILABLE',
          name: `${region} (Telemetry Unavailable)`,
          region: region,
          crisisType: 'Unknown',
          isSupported: false,
        },
        selectedCrisisType: 'Unknown',
      });
    }
  },

  setReportingPeriod: (period) => set({ reportingPeriod: period }),
  setDataMode: (mode) => set({ dataMode: mode, isDemoMode: mode === 'demo' }),
  syncLiveOperationalState: (liveData) => set((state) => ({
    ...state,
    ...(liveData.incidents ? { incidents: liveData.incidents } : {}),
    ...(liveData.selectedIncident ? { selectedIncident: liveData.selectedIncident } : {}),
    ...(liveData.facilities ? { facilities: liveData.facilities } : {}),
    ...(liveData.inventoryLots ? { inventoryLots: liveData.inventoryLots } : {}),
    ...(liveData.demandRecords ? { demandRecords: liveData.demandRecords } : {}),
    ...(liveData.beneficiaryGroups ? { beneficiaryGroups: liveData.beneficiaryGroups } : {}),
    ...(liveData.dispatchOrders ? { dispatchOrders: liveData.dispatchOrders } : {}),
    ...(liveData.auditEvents ? { auditEvents: liveData.auditEvents } : {}),
    ...(liveData.geographicLocations ? { geographicLocations: liveData.geographicLocations } : {}),
    ...(liveData.disasterZones ? { disasterZones: liveData.disasterZones } : {}),
    ...(liveData.lastDataFreshness ? { lastDataFreshness: liveData.lastDataFreshness } : {}),
  })),
  
  // Navigation & Drawer toggles
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  
  openDrawer: (type, payload) => set({
    activeDrawer: { isOpen: true, type, payload },
  }),
  
  closeDrawer: () => set({
    activeDrawer: { isOpen: false, type: null, payload: null },
  }),

  // Alert dismiss
  dismissAlert: (id) => set((state) => ({
    alerts: state.alerts.filter((a) => a.id !== id),
  })),

  // Notification Actions
  markNotificationAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
  })),

  clearAllNotifications: () => set({ notifications: [] }),

  // ─── Geographic Location Actions (Stage 4.1) ───────────────────────────────
  addGeographicLocation: (locData) => {
    const state = get();
    const validation = validateGeographicLocation(locData, state.geographicLocations || []);
    if (!validation.ok) return { ok: false, errors: validation.errors };
    const location = validation.value;
    set({
      geographicLocations: [...(state.geographicLocations || []), location],
      auditEvents: [
        ...state.auditEvents,
        {
          id: `AUD-${state.auditEvents.length + 1}`,
          timestamp: new Date().toISOString(),
          actor: 'SIMULATED_GEOGRAPHIC_OFFICER',
          action: 'GEOGRAPHIC_LOCATION_REGISTERED',
          entityId: location.id,
          previousState: null,
          newState: location.operationalStatus,
          reason: `Registered geographic entity: ${location.name} (${location.type})`,
          isDemo: true,
        },
      ],
    });
    return { ok: true, value: location };
  },

  updateGeographicLocation: (id, updates) => {
    const state = get();
    const existing = (state.geographicLocations || []).find((l) => l.id === id);
    if (!existing) return { ok: false, error: 'Location not found' };
    const merged = { ...existing, ...updates, id };
    const others = (state.geographicLocations || []).filter((l) => l.id !== id);
    const validation = validateGeographicLocation(merged, others);
    if (!validation.ok) return { ok: false, errors: validation.errors };
    set({
      geographicLocations: (state.geographicLocations || []).map((l) =>
        l.id === id ? validation.value : l
      ),
    });
    return { ok: true, value: validation.value };
  },

  getGeographicEntities: () => {
    const state = get();
    return (state.geographicLocations || []).map((loc) =>
      enrichLocationWithOperationalContext(loc, state, lotBalances)
    );
  },

  // Stage 4.3 — Transportation Routes & Dispatch Connectivity
  customRouteOverrides: {},

  getOperationalRoutes: (scenarioRoutes = []) => {
    const state = get();
    const overrides = state.customRouteOverrides || {};
    const baseRoutes = (scenarioRoutes || []).map((r) => {
      const enriched = enrichRouteWithDispatch(r, state.dispatchOrders, state.facilities);
      if (overrides[r.id]) {
        return {
          ...enriched,
          ...overrides[r.id],
          routeStatus: overrides[r.id].routeStatus || enriched.routeStatus,
          status: overrides[r.id].routeStatus || enriched.routeStatus,
        };
      }
      return enriched;
    });

    // Also synthesize routes for active dispatches that don't already have matching polylines
    const knownRouteIds = new Set(baseRoutes.map((r) => r.id));
    const dynamicRoutes = [];

    (state.dispatchOrders || []).forEach((dsp) => {
      const dynamicId = `RT-${dsp.id}`;
      if (!knownRouteIds.has(dynamicId) && !baseRoutes.some((r) => r.dispatchId === dsp.id || r.id === dsp.routeId)) {
        if (dsp.sourceCoords && dsp.destCoords) {
          const derivedStatus = overrides[dynamicId]?.routeStatus || deriveRouteStatusFromDispatch(dsp);
          dynamicRoutes.push({
            id: dynamicId,
            name: `${dsp.source} → ${dsp.destination}`,
            origin: dsp.source,
            originFacilityId: dsp.sourceId || dsp.source,
            destination: dsp.destination,
            destinationFacilityId: dsp.destinationId || dsp.destinationFacilityId || dsp.destination,
            points: [dsp.sourceCoords, dsp.destCoords],
            distanceKm: null, // Do not invent metrics
            estimatedTime: null,
            transportMode: dsp.vehicleType || dsp.vehicle || 'HEAVY_TRUCK',
            routeStatus: derivedStatus,
            status: derivedStatus,
            dispatchId: dsp.id,
            linkedDispatch: {
              id: dsp.id,
              status: dsp.status,
              commodity: dsp.commodity || dsp.lines?.[0]?.commodityId,
              quantity: dsp.quantity,
              unit: dsp.unit || dsp.lines?.[0]?.unit,
              vehicle: dsp.vehicle || dsp.vehicleType,
              carrier: dsp.carrier,
              dispatchedAt: dsp.dispatchedAt,
              expectedArrival: dsp.expectedArrival,
            },
            isDemo: true,
            routingType: 'DEMO_ILLUSTRATIVE',
            disruptionReason: dsp.routeStatus === 'CONFIRMED_BLOCKED' ? 'Corridor reported blocked.' : null,
          });
        }
      }
    });

    return [...baseRoutes, ...dynamicRoutes];
  },

  updateRouteStatus: (routeId, newStatus, reason = 'Operator status update', actor = 'SIMULATED_LOGISTICS_OFFICER') => {
    const state = get();
    if (!routeId) return { ok: false, error: 'Route ID is required' };
    const normalized = normalizeRouteStatus(newStatus);
    const prev = state.customRouteOverrides?.[routeId]?.routeStatus || 'PLANNED';
    const now = new Date().toISOString();

    set({
      customRouteOverrides: {
        ...(state.customRouteOverrides || {}),
        [routeId]: {
          ...(state.customRouteOverrides?.[routeId] || {}),
          routeStatus: normalized,
          status: normalized,
          statusReason: reason,
          updatedAt: now,
        },
      },
      auditEvents: [
        ...state.auditEvents,
        {
          id: `AUD-RT-${Date.now()}-${state.auditEvents.length + 1}`,
          timestamp: now,
          actor,
          action: 'ROUTE_STATUS_UPDATED',
          entityId: routeId,
          previousState: prev,
          newState: normalized,
          reason,
          isDemo: true,
        },
      ],
    });
    return { ok: true, routeId, newStatus: normalized };
  },

  // Stage 4.4 — Disaster Zones & Geographical Risk Layers
  getDisasterZones: (scenarioRoutes = []) => {
    const state = get();
    const facilities = [
      ...(state.facilities || []),
      ...(state.geographicLocations || []),
    ];
    const routes = typeof state.getOperationalRoutes === 'function'
      ? state.getOperationalRoutes(scenarioRoutes)
      : scenarioRoutes;

    return (state.disasterZones || []).map((zone) => {
      const impact = analyzeZoneImpact(zone, facilities, routes);
      return {
        ...zone,
        impact,
      };
    });
  },

  addDisasterZone: (zoneData) => {
    const state = get();
    const validation = validateDisasterZone(zoneData, state.disasterZones || []);
    if (!validation.ok) return { ok: false, errors: validation.errors };

    const zone = validation.value;
    const now = new Date().toISOString();
    set({
      disasterZones: [zone, ...(state.disasterZones || [])],
      auditEvents: [
        ...state.auditEvents,
        {
          id: `AUD-ZONE-${Date.now()}-${state.auditEvents.length + 1}`,
          timestamp: now,
          actor: 'SIMULATED_GIS_OFFICER',
          action: 'DISASTER_ZONE_RECORDED',
          entityId: zone.id,
          previousState: null,
          newState: zone.severity,
          reason: `Recorded hazard zone: ${zone.name} (${zone.disasterType} - ${zone.severity}) from ${zone.source}`,
          isDemo: zone.isDemo,
        },
      ],
    });
    return { ok: true, value: zone };
  },

  updateDisasterZone: (id, updates) => {
    const state = get();
    const existing = (state.disasterZones || []).find((z) => z.id === id);
    if (!existing) return { ok: false, error: 'Disaster zone not found' };

    const merged = { ...existing, ...updates, id, lastUpdated: new Date().toISOString() };
    const others = (state.disasterZones || []).filter((z) => z.id !== id);
    const validation = validateDisasterZone(merged, others);
    if (!validation.ok) return { ok: false, errors: validation.errors };

    const updated = validation.value;
    const now = new Date().toISOString();
    set({
      disasterZones: (state.disasterZones || []).map((z) => (z.id === id ? updated : z)),
      auditEvents: [
        ...state.auditEvents,
        {
          id: `AUD-ZONE-UPD-${Date.now()}-${state.auditEvents.length + 1}`,
          timestamp: now,
          actor: 'SIMULATED_GIS_OFFICER',
          action: 'DISASTER_ZONE_UPDATED',
          entityId: id,
          previousState: existing.severity,
          newState: updated.severity,
          reason: `Updated hazard zone: ${updated.name} (${updated.status})`,
          isDemo: updated.isDemo,
        },
      ],
    });
    return { ok: true, value: updated };
  },

  // Stage 4.5 — Geographic Alerts & Cross-Dashboard Integration
  dismissedGeographicAlertIds: [],
  focusedMapEntity: null,

  getGeographicAlerts: () => {
    const state = get();
    const facilities = [
      ...(state.facilities || []),
      ...(state.geographicLocations || []),
    ];
    const routes = typeof state.getOperationalRoutes === 'function'
      ? state.getOperationalRoutes()
      : (state.transportRoutes || []);
    const zones = state.disasterZones || [];
    return generateGeographicAlerts(facilities, routes, zones, state.dismissedGeographicAlertIds);
  },

  dismissGeographicAlert: (alertId) => {
    const state = get();
    if (!alertId) return;
    const now = new Date().toISOString();
    set({
      dismissedGeographicAlertIds: [...(state.dismissedGeographicAlertIds || []), alertId],
      auditEvents: [
        ...state.auditEvents,
        {
          id: `AUD-ALT-DISM-${Date.now()}-${state.auditEvents.length + 1}`,
          timestamp: now,
          actor: 'SIMULATED_OPERATOR',
          action: 'GEOGRAPHIC_ALERT_DISMISSED',
          entityId: alertId,
          previousState: 'ACTIVE',
          newState: 'DISMISSED',
          reason: `Operator dismissed geographic alert ${alertId}`,
          isDemo: true,
        },
      ],
    });
  },

  focusMapOnEntity: (entityId, entityType, coordinates) => {
    set({
      focusedMapEntity: { id: entityId, type: entityType, coordinates },
    });
  },

  clearMapFocus: () => set({ focusedMapEntity: null }),

  // Append-only audit event writer. Identifiers are local demo IDs, never agency approvals.
  addAuditEvent: (eventData) => set((state) => ({
    auditEvents: [...state.auditEvents, {
      id: `EVT-${Date.now()}-${state.auditEvents.length + 1}`,
      timestamp: new Date().toISOString(),
      actor: eventData.actor || eventData.user || 'SIMULATED_OPERATOR',
      user: eventData.user || eventData.actor || 'SIMULATED_OPERATOR',
      role: eventData.role || 'Simulated operator',
      action: eventData.action || 'SYSTEM_ACTION',
      module: eventData.module || 'Operations',
      entityId: eventData.entityId || 'UNSPECIFIED',
      status: eventData.status || 'RECORDED',
      previousState: eventData.previousState ?? eventData.previousValue ?? null,
      newState: eventData.newState ?? eventData.newValue ?? null,
      reason: eventData.reason || eventData.details || 'Operational action recorded.',
      relatedTransactionId: eventData.relatedTransactionId || null,
      isDemo: eventData.isDemo ?? eventData.isSimulated ?? state.dataMode === 'demo',
      isSimulated: eventData.isDemo ?? eventData.isSimulated ?? state.dataMode === 'demo',
    }],
  })),
}));
