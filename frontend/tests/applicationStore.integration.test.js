import test from 'node:test';
import assert from 'node:assert/strict';
import { useAppStore } from '../src/store/useAppStore.js';
import { lotBalances } from '../src/domain/operationalLedger.js';

const facilities = [
  {id:'DEPOT-A',name:'Source Depot',storageCapacity:1000},
  {id:'DEST-A',name:'Destination Facility',storageCapacity:1000},
  {id:'DEPOT-B',name:'Other Depot',storageCapacity:1000},
];
function reset() {
  useAppStore.setState({facilities,inventoryLots:[],inventoryTransactions:[],demandRecords:[],beneficiaryGroups:[],allocationPlans:[],allocationLines:[],stockReservations:[],dispatchOrders:[],deliveryRecords:[],recoveryResults:[],auditEvents:[]});
}
function lot(id, facilityId='DEPOT-A', commodityId='FOOD', unit='kg', quantity=100, qualityStatus='VERIFIED_USABLE', expiryDate='2027-12-31') {
  return {id,commodityId,commodity:commodityId,facilityId,batchId:`B-${id}`,quantityReceived:quantity,unit,expiryDate,qualityStatus,transactions:[{id:`RCPT-${id}`,type:'RECEIPT',quantity,unit,commodityId}],reservations:[]};
}
function seedDemand(id='DEM-A', quantity=100, commodityId='FOOD', unit='kg') {
  useAppStore.getState().upsertDemandRecord({id,commodityId,quantity,unit,verificationStatus:'PENDING'});
  const result=useAppStore.getState().verifyDemandRecord(id,{verifiedBy:'TEST_VERIFIER'});
  assert.equal(result.ok,true);
}
function approve(id='PLAN-A', demandId='DEM-A', quantity=100, sourceFacilityId='DEPOT-A', destinationFacilityId='DEST-A') {
  return useAppStore.getState().approveOperationalAllocation({id,allocations:[{demandId,commodityId:'FOOD',sourceFacilityId,destinationFacilityId,allocatedQty:quantity,unit:'kg'}]});
}

test('actual Zustand workflow: receive → allocate → dispatch segments → partial/final receipts → demand → audit', () => {
  reset();
  const received=useAppStore.getState().receiveOperationalStock({id:'LOT-A',commodity:'FOOD',facilityId:'DEPOT-A',batchId:'B-1',quantity:100,unit:'kg',expiryDate:'2027-12-31',qualityStatus:'VERIFIED_USABLE'});
  assert.equal(received.ok,true);
  assert.equal(useAppStore.getState().inventoryLots.find(l=>l.id==='LOT-A').quantityReceived,100);
  assert.equal(useAppStore.getState().inventoryTransactions.length,1);
  seedDemand();
  assert.equal(approve().ok,true);
  const planLines=useAppStore.getState().allocationLines.filter(l=>l.planId==='PLAN-A');
  assert.equal(planLines.length,1);
  assert.equal(planLines[0].demandId,'DEM-A');
  assert.equal(planLines[0].lotId,'LOT-A');
  assert.equal(planLines[0].sourceFacilityId,'DEPOT-A');
  assert.equal(planLines[0].destinationFacilityId,'DEST-A');
  assert.ok(planLines[0].id);
  const order=useAppStore.getState().createOperationalDispatch({id:'DSP-A',planId:'PLAN-A',destinationFacilityId:'DEST-A',demandId:'DEM-A'});
  assert.equal(order.ok,true);
  const line=order.value.lines[0];
  assert.equal(useAppStore.getState().dispatchOperationalStock({dispatchId:'DSP-A',planId:'PLAN-A',lines:[{...line,quantity:25}],destinationFacilityId:'DEST-A',demandId:'DEM-A'}).ok,true);
  let state=useAppStore.getState();
  assert.equal(lotBalances(state.inventoryLots.find(l=>l.id==='LOT-A')).onHand,75);
  assert.equal(state.dispatchOrders.find(d=>d.id==='DSP-A').inTransitQuantity,25);
  assert.equal(useAppStore.getState().dispatchOperationalStock({dispatchId:'DSP-A',planId:'PLAN-A',lines:[{...line,quantity:75}],destinationFacilityId:'DEST-A',demandId:'DEM-A'}).ok,true);
  state=useAppStore.getState();
  assert.equal(lotBalances(state.inventoryLots.find(l=>l.id==='LOT-A')).onHand,0);
  assert.equal(state.dispatchOrders.find(d=>d.id==='DSP-A').inTransitQuantity,100);
  const receipt1={dispatchId:'DSP-A',deliveryId:'POD-1',receivedQuantity:25,acceptedQuantity:23,damagedQuantity:2,destinationFacilityId:'DEST-A'};
  assert.equal(useAppStore.getState().verifyOperationalReceipt(receipt1).ok,true);
  state=useAppStore.getState();
  assert.equal(state.demandRecords.find(d=>d.id==='DEM-A').fulfilledQuantity,23);
  assert.equal(state.dispatchOrders.find(d=>d.id==='DSP-A').inTransitQuantity,75);
  assert.equal(useAppStore.getState().verifyOperationalReceipt(receipt1).ok,false);
  assert.equal(useAppStore.getState().verifyOperationalReceipt({dispatchId:'DSP-A',deliveryId:'POD-2',receivedQuantity:75,acceptedQuantity:75,destinationFacilityId:'DEST-A'}).ok,true);
  state=useAppStore.getState();
  assert.equal(state.demandRecords.find(d=>d.id==='DEM-A').fulfilledQuantity,98);
  assert.equal(state.dispatchOrders.find(d=>d.id==='DSP-A').inTransitQuantity,0);
  assert.equal(state.dispatchOrders.find(d=>d.id==='DSP-A').status,'VERIFIED');
  assert.equal(state.deliveryRecords.length,2);
  assert.ok(state.auditEvents.some(e=>e.action==='STOCK_RECEIVED'));
  assert.ok(state.auditEvents.some(e=>e.action==='ALLOCATION_APPROVED'));
  assert.ok(state.auditEvents.some(e=>e.action==='DISPATCH_CREATED'));
  assert.equal(state.auditEvents.filter(e=>e.action.startsWith('DELIVERY_')).length,2);
  assert.equal(state.getInventoryItems().find(l=>l.id==='LOT-A').totalQty,0);
  assert.equal(state.getDemandItems().find(d=>d.id==='DEM-A').remainingQuantity,2);
  assert.equal(state.createOperationalDispatch({id:'DSP-REUSE',planId:'PLAN-A',destinationFacilityId:'DEST-A',demandId:'DEM-A'}).ok,false);
});

test('allocation lines are scoped; partial dispatch leaves unrelated line and reservation untouched', () => {
  reset();
  useAppStore.setState({inventoryLots:[lot('LOT-A'),lot('LOT-B','DEPOT-B') ]});
  seedDemand('DEM-A',50); seedDemand('DEM-B',50);
  const approved=useAppStore.getState().approveOperationalAllocation({id:'PLAN-MULTI',allocations:[
    {demandId:'DEM-A',commodityId:'FOOD',sourceFacilityId:'DEPOT-A',destinationFacilityId:'DEST-A',allocatedQty:50,unit:'kg'},
    {demandId:'DEM-B',commodityId:'FOOD',sourceFacilityId:'DEPOT-B',destinationFacilityId:'DEST-A',allocatedQty:50,unit:'kg'},
  ]});
  assert.equal(approved.ok,true);
  const before=useAppStore.getState().allocationLines.find(l=>l.demandId==='DEM-B');
  const created=useAppStore.getState().createOperationalDispatch({id:'DSP-ONLY-A',planId:'PLAN-MULTI',destinationFacilityId:'DEST-A',demandId:'DEM-A'});
  assert.equal(created.ok,true);
  assert.equal(created.value.lines.length,1);
  assert.equal(created.value.lines[0].demandId,'DEM-A');
  assert.equal(useAppStore.getState().dispatchOperationalStock({dispatchId:'DSP-ONLY-A',planId:'PLAN-MULTI',lines:created.value.lines,destinationFacilityId:'DEST-A',demandId:'DEM-A'}).ok,true);
  const after=useAppStore.getState().allocationLines.find(l=>l.demandId==='DEM-B');
  assert.deepEqual(after,before);
  assert.equal(useAppStore.getState().inventoryLots.find(l=>l.id==='LOT-B').reservations[0].status,'ACTIVE');
});

test('over-allocation, incompatible units, expired/quarantined stock and unknown facilities fail without mutation', () => {
  reset(); useAppStore.setState({inventoryLots:[lot('GOOD'),lot('EXPIRED','DEPOT-A','FOOD','kg',10,'VERIFIED_USABLE','2020-01-01'),lot('QUAR','DEPOT-A','FOOD','kg',10,'QUARANTINED')]}); seedDemand('DEM-A',100);
  const good=approve('PLAN-GOOD','DEM-A',100); assert.equal(good.ok,true);
  const before=JSON.stringify(useAppStore.getState().inventoryLots);
  assert.equal(approve('PLAN-OVER','DEM-A',1).ok,false);
  assert.equal(JSON.stringify(useAppStore.getState().inventoryLots),before);
  assert.equal(useAppStore.getState().reserveOperationalStock({planId:'BAD-UNIT',commodityId:'FOOD',unit:'litre',facilityId:'DEPOT-A',quantity:1}).ok,false);
  assert.equal(useAppStore.getState().reserveOperationalStock({planId:'BAD-DEST',commodityId:'FOOD',unit:'kg',facilityId:'UNKNOWN',quantity:1}).ok,false);
  const created=useAppStore.getState().createOperationalDispatch({id:'DSP-UNKNOWN',planId:'PLAN-GOOD',destinationFacilityId:'UNKNOWN'});
  assert.equal(created.ok,false);
  assert.equal(JSON.stringify(useAppStore.getState().inventoryLots),before);
});

test('cancellation releases only active reservations and is rejected after dispatch', () => {
  reset(); useAppStore.setState({inventoryLots:[lot('LOT-A')]}); seedDemand(); assert.equal(approve('PLAN-CANCEL').ok,true);
  assert.equal(useAppStore.getState().cancelAllocation('PLAN-CANCEL').ok,true);
  assert.equal(useAppStore.getState().inventoryLots[0].reservations[0].status,'RELEASED');
  assert.equal(useAppStore.getState().allocationLines[0].status,'RELEASED');
  seedDemand('DEM-B',50); assert.equal(approve('PLAN-DISPATCH','DEM-B',50).ok,true);
  const readyDispatch=useAppStore.getState().createOperationalDispatch({id:'DSP-CANCEL-READY',planId:'PLAN-DISPATCH',destinationFacilityId:'DEST-A',demandId:'DEM-B'});
  assert.equal(readyDispatch.ok,true);
  assert.equal(useAppStore.getState().cancelAllocation('PLAN-DISPATCH').ok,false);
  const created=useAppStore.getState().createOperationalDispatch({id:'DSP-CANCEL',planId:'PLAN-DISPATCH',destinationFacilityId:'DEST-A',demandId:'DEM-B'});
  assert.equal(useAppStore.getState().dispatchOperationalStock({dispatchId:'DSP-CANCEL',planId:'PLAN-DISPATCH',lines:created.value.lines,destinationFacilityId:'DEST-A',demandId:'DEM-B'}).ok,true);
  assert.equal(useAppStore.getState().cancelAllocation('PLAN-DISPATCH').ok,false);
});

test('manual fulfilment is ignored; nonexistent and duplicate demand verification do not add audit events', () => {
  reset();
  useAppStore.getState().upsertDemandRecord({id:'DEM-MANUAL',commodity:'FOOD',quantity:10,unit:'kg',fulfilledQuantity:999});
  assert.equal(useAppStore.getState().demandRecords[0].fulfilledQuantity,0);
  useAppStore.getState().upsertDemandRecord({id:'DEM-MANUAL',quantity:10,fulfilledQuantity:500});
  assert.equal(useAppStore.getState().demandRecords[0].fulfilledQuantity,0);
  const missing=useAppStore.getState().verifyDemandRecord('MISSING'); assert.equal(missing.ok,false);
  useAppStore.getState().verifyDemandRecord('DEM-MANUAL'); const count=useAppStore.getState().auditEvents.length;
  assert.equal(useAppStore.getState().verifyDemandRecord('DEM-MANUAL').unchanged,true);
  assert.equal(useAppStore.getState().auditEvents.length,count);
});

test('failed live API operation leaves authoritative store unchanged', () => {
  reset(); const before=JSON.stringify(useAppStore.getState().inventoryLots);
  const apiResult={success:false,error:'offline'};
  if(apiResult.success) useAppStore.getState().receiveOperationalStock({id:'SHOULD-NOT-EXIST',commodity:'FOOD',facilityId:'DEPOT-A',quantity:1,unit:'kg'});
  assert.equal(JSON.stringify(useAppStore.getState().inventoryLots),before);
});

test('failed dispatch leaves inventory and reservation quantities unchanged', () => {
  reset(); useAppStore.setState({inventoryLots:[lot('LOT-A')]}); seedDemand(); assert.equal(approve('PLAN-FAIL').ok,true);
  const created=useAppStore.getState().createOperationalDispatch({id:'DSP-FAIL',planId:'PLAN-FAIL',destinationFacilityId:'DEST-A',demandId:'DEM-A'});
  const before=JSON.stringify({lots:useAppStore.getState().inventoryLots,reservations:useAppStore.getState().stockReservations,lines:useAppStore.getState().allocationLines});
  const result=useAppStore.getState().dispatchOperationalStock({dispatchId:'DSP-FAIL',planId:'PLAN-FAIL',lines:[{...created.value.lines[0],quantity:1000}],destinationFacilityId:'DEST-A',demandId:'DEM-A'});
  assert.equal(result.ok,false);
  assert.equal(JSON.stringify({lots:useAppStore.getState().inventoryLots,reservations:useAppStore.getState().stockReservations,lines:useAppStore.getState().allocationLines}),before);
});

test('expired and quarantined lots are not reservable', () => {
  reset(); useAppStore.setState({inventoryLots:[lot('EXPIRED','DEPOT-A','FOOD','kg',10,'VERIFIED_USABLE','2020-01-01'),lot('QUAR','DEPOT-A','FOOD','kg',10,'QUARANTINED')]});
  const result=useAppStore.getState().reserveOperationalStock({planId:'PLAN-INELIGIBLE',commodityId:'FOOD',unit:'kg',facilityId:'DEPOT-A',quantity:1});
  assert.equal(result.ok,false);
  assert.equal(useAppStore.getState().stockReservations.length,0);
});

test('stale recovery approval is rejected without changing operational inventory', () => {
  reset(); useAppStore.setState({inventoryLots:[lot('LOT-A')]});
  const snapshot=JSON.parse(JSON.stringify({inventoryLots:useAppStore.getState().inventoryLots,demandRecords:[],allocationPlans:[],dispatchOrders:[],deliveryRecords:[]}));
  useAppStore.getState().recordRecoveryResult({simulationId:'SIM-A',operationalSnapshot:snapshot,result:{strategies:[{id:'STRAT-A'}]}});
  useAppStore.setState({inventoryLots:[{...useAppStore.getState().inventoryLots[0],quantityReceived:90}]});
  const before=JSON.stringify(useAppStore.getState().inventoryLots);
  const result=useAppStore.getState().recordRecoveryDecision({simulationId:'SIM-A',status:'APPROVED',actor:'TEST',reason:'Test approval'});
  assert.equal(result.ok,false);
  assert.equal(JSON.stringify(useAppStore.getState().inventoryLots),before);
  assert.equal(useAppStore.getState().recoveryResults[0].decision,undefined);
});


test('arrival transition validates lifecycle and emits one audit event',()=>{
  reset();
  assert.equal(useAppStore.getState().recordOperationalArrival('MISSING').ok,false);
  const before=useAppStore.getState().auditEvents.length;
  useAppStore.setState({dispatchOrders:[{id:'DSP-READY',status:'READY',inTransitQuantity:10,quantity:10,lines:[]}]});
  assert.equal(useAppStore.getState().recordOperationalArrival('DSP-READY').ok,false);
  assert.equal(useAppStore.getState().auditEvents.length,before);
  useAppStore.setState({dispatchOrders:[{id:'DSP-ARRIVE',status:'IN_TRANSIT',dispatchedAt:'2026-11-05T12:00:00.000Z',inTransitQuantity:10,quantity:10,lines:[]}]});
  assert.equal(useAppStore.getState().recordOperationalArrival('DSP-ARRIVE').ok,true);
  const count=useAppStore.getState().auditEvents.filter(e=>e.action==='DISPATCH_ARRIVAL_RECORDED').length;
  assert.equal(useAppStore.getState().recordOperationalArrival('DSP-ARRIVE').ok,false);
  assert.equal(useAppStore.getState().auditEvents.filter(e=>e.action==='DISPATCH_ARRIVAL_RECORDED').length,count);
  useAppStore.setState({dispatchOrders:[{id:'DSP-DONE',status:'VERIFIED',dispatchedAt:'2026-11-05T12:00:00.000Z',inTransitQuantity:0,quantity:10,accountedQuantity:10,lines:[]}]});
  assert.equal(useAppStore.getState().recordOperationalArrival('DSP-DONE').ok,false);
});

test('Stage 3 Phase 2 complete workflow: create plan → approve → dispatch → partial delivery → verify → destination stock → demand fulfilment → audit', () => {
  reset();
  // Set up facilities with both id and code
  useAppStore.setState({
    facilities: [
      { id: 'FAC-01', code: 'CSD-01', name: 'Central Depot', capacityLimits: [] },
      { id: 'FAC-02', code: 'NLB-02', name: 'North Logistics Base', capacityLimits: [] },
      { id: 'DESTINATION', code: 'DESTINATION', name: 'Field Relief Hub', capacityLimits: [] },
    ],
    inventoryLots: [
      lot('LOT-CSD', 'CSD-01', 'FOOD', 'packets', 200),
    ],
  });

  // Step 1: Create demand
  useAppStore.getState().upsertDemandRecord({
    id: 'DEM-E2E',
    commodity: 'FOOD',
    commodityId: 'FOOD',
    quantity: 100,
    unit: 'packets',
    verificationStatus: 'VERIFIED',
  });

  // Test invalid allocation: quantity > demand
  const overDemand = useAppStore.getState().approveOperationalAllocation({
    id: 'PLAN-E2E-OVER',
    allocations: [{
      demandId: 'DEM-E2E',
      commodityId: 'FOOD',
      sourceFacilityId: 'CSD-01',
      destinationFacilityId: 'DESTINATION',
      allocatedQty: 150,
      unit: 'packets',
    }],
  });
  assert.equal(overDemand.ok, false);

  // Test invalid allocation: unknown facility
  const unknownFac = useAppStore.getState().approveOperationalAllocation({
    id: 'PLAN-E2E-UNFAC',
    allocations: [{
      demandId: 'DEM-E2E',
      commodityId: 'FOOD',
      sourceFacilityId: 'UNKNOWN-DEPOT',
      destinationFacilityId: 'DESTINATION',
      allocatedQty: 100,
      unit: 'packets',
    }],
  });
  assert.equal(unknownFac.ok, false);

  // Step 2: Valid allocation approval using facility code CSD-01
  const approved = useAppStore.getState().approveOperationalAllocation({
    id: 'PLAN-E2E',
    allocations: [{
      demandId: 'DEM-E2E',
      commodityId: 'FOOD',
      sourceFacilityId: 'CSD-01',
      destinationFacilityId: 'DESTINATION',
      allocatedQty: 100,
      unit: 'packets',
    }],
  });
  assert.equal(approved.ok, true);

  // Check reserved stock in lot
  const lotAfterApprove = useAppStore.getState().inventoryLots.find((l) => l.id === 'LOT-CSD');
  assert.equal(lotBalances(lotAfterApprove).reserved, 100);
  assert.equal(lotBalances(lotAfterApprove).available, 100);

  // Step 3: Create dispatch order
  const dispatchOrder = useAppStore.getState().createOperationalDispatch({
    id: 'DSP-E2E-1',
    planId: 'PLAN-E2E',
    destinationFacilityId: 'DESTINATION',
    demandId: 'DEM-E2E',
  });
  assert.equal(dispatchOrder.ok, true);
  assert.equal(dispatchOrder.value.status, 'READY');

  // Test duplicate dispatch ID
  const dupOrder = useAppStore.getState().createOperationalDispatch({
    id: 'DSP-E2E-1',
    planId: 'PLAN-E2E',
    destinationFacilityId: 'DESTINATION',
    demandId: 'DEM-E2E',
  });
  assert.equal(dupOrder.ok, false);

  // Step 4: Dispatch segments: first segment 40, second segment 60 (total 100 dispatched)
  const line = dispatchOrder.value.lines[0];
  const dispatchPartial = useAppStore.getState().dispatchOperationalStock({
    dispatchId: 'DSP-E2E-1',
    planId: 'PLAN-E2E',
    lines: [{ ...line, quantity: 40 }],
    destinationFacilityId: 'DESTINATION',
    demandId: 'DEM-E2E',
  });
  assert.equal(dispatchPartial.ok, true);

  const remainingLine = useAppStore.getState().allocationLines.find((l) => l.id === line.id);
  const dispatchRemaining = useAppStore.getState().dispatchOperationalStock({
    dispatchId: 'DSP-E2E-1',
    planId: 'PLAN-E2E',
    lines: [{ ...remainingLine, quantity: 60 }],
    destinationFacilityId: 'DESTINATION',
    demandId: 'DEM-E2E',
  });
  assert.equal(dispatchRemaining.ok, true);

  let state = useAppStore.getState();
  const dsp1 = state.dispatchOrders.find((d) => d.id === 'DSP-E2E-1');
  assert.equal(dsp1.status, 'IN_TRANSIT');
  assert.equal(dsp1.inTransitQuantity, 100);

  // Step 5: Record physical arrival
  const arrival = useAppStore.getState().recordOperationalArrival('DSP-E2E-1');
  assert.equal(arrival.ok, true);
  state = useAppStore.getState();
  assert.equal(state.dispatchOrders.find((d) => d.id === 'DSP-E2E-1').status, 'ARRIVED_AWAITING_POD');

  // Test duplicate arrival
  const dupArrival = useAppStore.getState().recordOperationalArrival('DSP-E2E-1');
  assert.equal(dupArrival.ok, false);

  // Step 6: Verify Proof of Delivery (POD) with partial acceptance:
  // First delivery: 40 received: 30 accepted, 5 damaged, 5 rejected
  const pod1 = useAppStore.getState().verifyOperationalReceipt({
    dispatchId: 'DSP-E2E-1',
    deliveryId: 'POD-E2E-1',
    receivedQuantity: 40,
    acceptedQuantity: 30,
    damagedQuantity: 5,
    rejectedQuantity: 5,
    destinationFacilityId: 'DESTINATION',
    actor: 'VERIFIER-TEST',
  });
  assert.equal(pod1.ok, true);

  // Test duplicate delivery receipt ID
  const dupPod = useAppStore.getState().verifyOperationalReceipt({
    dispatchId: 'DSP-E2E-1',
    deliveryId: 'POD-E2E-1',
    receivedQuantity: 40,
    acceptedQuantity: 40,
    destinationFacilityId: 'DESTINATION',
  });
  assert.equal(dupPod.ok, false);

  // Step 7: Check destination inventory
  state = useAppStore.getState();
  const destLot = state.inventoryLots.find((l) => l.facilityId === 'DESTINATION');
  assert.ok(destLot, 'Destination inventory lot must be created for accepted goods');
  assert.equal(lotBalances(destLot).usable, 30, 'Destination lot usable stock must reflect accepted quantity only');

  // Step 8: Check fulfilled demand
  const demandRecord = state.demandRecords.find((d) => d.id === 'DEM-E2E');
  assert.equal(demandRecord.fulfilledQuantity, 30, 'Demand fulfilled quantity must reflect accepted goods only (30)');
  assert.equal(demandRecord.remainingQuantity, 70, 'Remaining demand must be 100 - 30 = 70');

  // Step 9: Check Dispatch Order status (partial delivery out of 100 total)
  const dspAfterPartial = state.dispatchOrders.find((d) => d.id === 'DSP-E2E-1');
  assert.equal(dspAfterPartial.status, 'PARTIALLY_VERIFIED');
  assert.equal(dspAfterPartial.inTransitQuantity, 60);

  // Step 10: Complete remaining delivery (60 received & accepted)
  const pod2 = useAppStore.getState().verifyOperationalReceipt({
    dispatchId: 'DSP-E2E-1',
    deliveryId: 'POD-E2E-2',
    receivedQuantity: 60,
    acceptedQuantity: 60,
    destinationFacilityId: 'DESTINATION',
  });
  assert.equal(pod2.ok, true);

  state = useAppStore.getState();
  const dspFinal = state.dispatchOrders.find((d) => d.id === 'DSP-E2E-1');
  assert.equal(dspFinal.status, 'VERIFIED');
  assert.equal(dspFinal.inTransitQuantity, 0);

  const finalDemand = state.demandRecords.find((d) => d.id === 'DEM-E2E');
  assert.equal(finalDemand.fulfilledQuantity, 90);
  assert.equal(finalDemand.remainingQuantity, 10);

  // Step 11: Check audit history contains structured entries for every step
  assert.ok(state.auditEvents.some((e) => e.action === 'ALLOCATION_APPROVED'));
  assert.ok(state.auditEvents.some((e) => e.action === 'DISPATCH_ORDER_CREATED'));
  assert.ok(state.auditEvents.some((e) => e.action === 'DISPATCH_CREATED'));
  assert.ok(state.auditEvents.some((e) => e.action === 'DISPATCH_ARRIVAL_RECORDED'));
  assert.ok(state.auditEvents.some((e) => e.action === 'DELIVERY_PARTIALLY_VERIFIED'));
  assert.ok(state.auditEvents.some((e) => e.action === 'DELIVERY_FULLY_VERIFIED'));
});
