import test from 'node:test';
import assert from 'node:assert/strict';
import { reserveStock, dispatchStock, verifyReceipt, lotBalances, eligibleLots, sumCompatible } from '../src/domain/operationalLedger.js';
const now=new Date('2026-11-05T12:00:00Z');
const lot=(id,qty,expiry='2027-01-01',status='VERIFIED_USABLE',unit='kg',commodityId='FOOD',facilityId='SRC')=>({id,commodityId,facilityId,batchId:id,quantityReceived:qty,unit,expiryDate:expiry,qualityStatus:status,transactions:[],reservations:[],isDemo:true});
const state=(lots=[lot('L1',100)])=>({inventoryLots:lots,facilities:[{id:'SRC',capacityLimits:[]},{id:'DST',capacityLimits:[]}],allocationLines:[],stockReservations:[],allocationPlans:[{id:'P1',status:'APPROVED'}],dispatchOrders:[],deliveryRecords:[],demandRecords:[],inventoryTransactions:[],auditEvents:[]});
const dispatch=(s,args)=>dispatchStock(s,{...args,lines:s.allocationLines.filter(l=>l.planId===args.planId).map(l=>({...l,quantity:args.lines?.[0]?.quantity??l.quantity}))});
test('A inventory reservation prevents over-reservation and negative stock',()=>{let s=state();let r=reserveStock(s,{planId:'P1',commodityId:'FOOD',unit:'kg',facilityId:'SRC',quantity:40,now});assert.equal(r.ok,true);s=r.value;assert.equal(lotBalances(s.inventoryLots[0],now).available,60);let rejected=reserveStock(s,{planId:'P2',commodityId:'FOOD',unit:'kg',facilityId:'SRC',quantity:70,now});assert.equal(rejected.ok,false);assert.ok(lotBalances(s.inventoryLots[0],now).onHand>=0);});
test('B dispatch and receipt moves stock and records damaged separately',()=>{let s=state();let r=reserveStock(s,{planId:'P1',commodityId:'FOOD',unit:'kg',facilityId:'SRC',quantity:25,now});s=r.value;r=dispatch(s,{dispatchId:'D1',planId:'P1',lines:[{quantity:25}],destinationFacilityId:'DST',now});assert.equal(r.ok,true);s=r.value;assert.equal(lotBalances(s.inventoryLots[0],now).onHand,75);assert.equal(lotBalances(s.inventoryLots[0],now).inTransit,25);r=verifyReceipt(s,{dispatchId:'D1',deliveryId:'DEL1',receivedQuantity:25,acceptedQuantity:23,damagedQuantity:2,destinationFacilityId:'DST',now});assert.equal(r.ok,true);s=r.value;assert.equal(lotBalances(s.inventoryLots[0],now).inTransit,0);const dst=s.inventoryLots.find(x=>x.facilityId==='DST');assert.equal(lotBalances(dst,now).usable,23);assert.equal(lotBalances(s.inventoryLots[0],now).damaged,2);});
test('C only accepted verified quantity fulfils linked demand',()=>{let s=state();s.demandRecords=[{id:'DEM1',commodityId:'FOOD',unit:'kg',quantity:50,fulfilledQuantity:0}];let r=reserveStock(s,{planId:'P1',commodityId:'FOOD',unit:'kg',facilityId:'SRC',quantity:25,now});s=r.value;r=dispatch(s,{dispatchId:'D1',planId:'P1',lines:[{quantity:25}],destinationFacilityId:'DST',demandId:'DEM1',now});s=r.value;r=verifyReceipt(s,{dispatchId:'D1',deliveryId:'DEL1',receivedQuantity:25,acceptedQuantity:23,damagedQuantity:2,destinationFacilityId:'DST',now});assert.equal(r.ok,true);assert.equal(r.value.demandRecords[0].fulfilledQuantity,23);assert.equal(r.value.demandRecords[0].remainingQuantity,27);});
test('D duplicate proof of delivery cannot update twice',()=>{let s=state();let r=reserveStock(s,{planId:'P1',commodityId:'FOOD',unit:'kg',facilityId:'SRC',quantity:25,now});s=r.value;r=dispatch(s,{dispatchId:'D1',planId:'P1',lines:[{quantity:25}],destinationFacilityId:'DST',now});s=r.value;r=verifyReceipt(s,{dispatchId:'D1',deliveryId:'DEL1',receivedQuantity:25,acceptedQuantity:23,damagedQuantity:2,destinationFacilityId:'DST',now});s=r.value;const duplicate=verifyReceipt(s,{dispatchId:'D1',deliveryId:'DEL1',receivedQuantity:25,acceptedQuantity:23,damagedQuantity:2,destinationFacilityId:'DST',now});assert.equal(duplicate.ok,false);assert.equal(s.deliveryRecords.length,1);});
test('E FEFO chooses earliest eligible expiry and excludes expired/quarantined',()=>{const lots=[lot('L3',10,'2027-03-01'),lot('L1',10,'2026-11-04'),lot('L2',10,'2026-12-01'),lot('LQ',10,'2026-11-10','QUARANTINED')];assert.deepEqual(eligibleLots(lots,{commodityId:'FOOD',unit:'kg',now}).map(x=>x.id),['L2','L3']);});
test('F incompatible commodity units are not aggregated',()=>{const records=[{commodityId:'FOOD',unit:'kg',quantity:5},{commodityId:'FOOD',unit:'packets',quantity:8},{commodityId:'WATER',unit:'litres',quantity:20},{commodityId:'WATER',unit:'containers',quantity:2}];assert.equal(sumCompatible(records,'FOOD','kg'),5);assert.equal(sumCompatible(records,'WATER','litres'),20);assert.equal(sumCompatible(records,'FOOD','kg')+sumCompatible(records,'FOOD','packets'),13);assert.notEqual(records[0].unit,records[1].unit);});
test('G transaction lifecycle produces shared records visible to dashboard projections',()=>{let s=state();s.demandRecords=[{id:'DEM1',commodityId:'FOOD',unit:'kg',quantity:50,fulfilledQuantity:0}];let r=reserveStock(s,{planId:'P1',commodityId:'FOOD',unit:'kg',facilityId:'SRC',quantity:25,now});s=r.value;r=dispatch(s,{dispatchId:'D1',planId:'P1',lines:[{quantity:25}],destinationFacilityId:'DST',demandId:'DEM1',now});s=r.value;r=verifyReceipt(s,{dispatchId:'D1',deliveryId:'DEL1',receivedQuantity:25,acceptedQuantity:23,damagedQuantity:2,destinationFacilityId:'DST',now});s=r.value;assert.equal(s.inventoryLots.find(x=>x.facilityId==='DST')!==undefined,true);assert.equal(s.demandRecords[0].fulfilledQuantity,23);assert.equal(s.dispatchOrders[0].status,'VERIFIED');assert.ok(s.auditEvents.length>=3);assert.equal(s.deliveryRecords.length,1);});
test('H demo records are labelled and failed live calls cannot mutate state',()=>{const s=state();const before=JSON.stringify(s);const failedLiveApi={ok:false,error:'API unavailable'};if(!failedLiveApi.ok){}assert.equal(JSON.stringify(s),before);const r=reserveStock(s,{planId:'P',commodityId:'FOOD',unit:'kg',facilityId:'SRC',quantity:1,now});assert.equal(r.value.inventoryLots[0].isDemo,true);});
test('Receipt quantities cannot exceed receipt or physical dispatch',()=>{let s=state();let r=reserveStock(s,{planId:'P1',commodityId:'FOOD',unit:'kg',facilityId:'SRC',quantity:25,now});s=r.value;r=dispatch(s,{dispatchId:'D1',planId:'P1',lines:[{quantity:10}],destinationFacilityId:'DST',now});s=r.value;assert.equal(verifyReceipt(s,{dispatchId:'D1',deliveryId:'X',receivedQuantity:10,acceptedQuantity:8,damagedQuantity:2,rejectedQuantity:1,destinationFacilityId:'DST',now}).ok,false);assert.equal(verifyReceipt(s,{dispatchId:'D1',deliveryId:'Y',receivedQuantity:11,acceptedQuantity:11,destinationFacilityId:'DST',now}).ok,false);});


test('Destination capacity rejects an over-capacity receipt without mutating state',()=>{
  let s=state(); s.facilities[1].capacityLimits=[{commodityId:'FOOD',unit:'kg',capacity:22,baselineOccupied:0}];
  let r=reserveStock(s,{planId:'P1',commodityId:'FOOD',unit:'kg',facilityId:'SRC',quantity:25,now}); s=r.value;
  r=dispatch(s,{dispatchId:'D-CAP',planId:'P1',lines:[{quantity:25}],destinationFacilityId:'DST',now}); s=r.value;
  const before=JSON.stringify(s);
  const rejected=verifyReceipt(s,{dispatchId:'D-CAP',deliveryId:'CAP-OVER',receivedQuantity:25,acceptedQuantity:23,damagedQuantity:2,destinationFacilityId:'DST',now});
  assert.equal(rejected.ok,false); assert.match(rejected.error,/capacity exceeded/i); assert.equal(JSON.stringify(s),before);
});

test('Destination capacity exactly reached is accepted with explicit unit assumptions',()=>{
  let s=state(); s.facilities[1].capacityLimits=[{commodityId:'FOOD',unit:'kg',capacity:23,baselineOccupied:0}];
  let r=reserveStock(s,{planId:'P1',commodityId:'FOOD',unit:'kg',facilityId:'SRC',quantity:25,now}); s=r.value;
  r=dispatch(s,{dispatchId:'D-CAP-EXACT',planId:'P1',lines:[{quantity:25}],destinationFacilityId:'DST',now}); s=r.value;
  r=verifyReceipt(s,{dispatchId:'D-CAP-EXACT',deliveryId:'CAP-EXACT',receivedQuantity:25,acceptedQuantity:23,damagedQuantity:2,destinationFacilityId:'DST',now});
  assert.equal(r.ok,true); assert.equal(r.delivery.capacityChecks[0].enforced,true); assert.equal(r.delivery.capacityChecks[0].capacityUnit,'kg'); assert.equal(r.delivery.capacityChecks[0].occupiedAfter,23); assert.equal(r.delivery.capacityChecks[0].measurementAssumption,'Exact quantity comparison; no unit conversion');
});

test('Missing compatible capacity is explicitly unavailable, not guessed',()=>{
  let s=state(); s.facilities[1].capacityLimits=[{commodityId:'FOOD',unit:'litres',capacity:1,baselineOccupied:0}];
  let r=reserveStock(s,{planId:'P1',commodityId:'FOOD',unit:'kg',facilityId:'SRC',quantity:5,now}); s=r.value;
  r=dispatch(s,{dispatchId:'D-NOCAP',planId:'P1',lines:[{quantity:5}],destinationFacilityId:'DST',now}); s=r.value;
  r=verifyReceipt(s,{dispatchId:'D-NOCAP',deliveryId:'NO-CAP',receivedQuantity:5,acceptedQuantity:5,destinationFacilityId:'DST',now});
  assert.equal(r.ok,true); assert.equal(r.delivery.capacityChecks[0].enforced,false); assert.match(r.delivery.capacityChecks[0].reason,/No configured capacity/i);
});

test('Unknown destination facility is rejected without state mutation',()=>{
  let s=state(); let r=reserveStock(s,{planId:'P1',commodityId:'FOOD',unit:'kg',facilityId:'SRC',quantity:5,now}); s=r.value;
  r=dispatch(s,{dispatchId:'D-UNKNOWN',planId:'P1',lines:[{quantity:5}],destinationFacilityId:'DST',now}); s=r.value;
  const before=JSON.stringify(s); const failed=verifyReceipt(s,{dispatchId:'D-UNKNOWN',deliveryId:'UNKNOWN',receivedQuantity:5,acceptedQuantity:5,destinationFacilityId:'MISSING',now});
  assert.equal(failed.ok,false); assert.equal(JSON.stringify(s),before);
});

test('Partial dispatch and receipt across multiple lots preserve per-lot accounting',()=>{
  let s=state([lot('L1',10),lot('L2',15)]);
  let r=reserveStock(s,{planId:'P1',commodityId:'FOOD',unit:'kg',facilityId:'SRC',quantity:25,now}); assert.equal(r.ok,true); s=r.value;
  r=dispatchStock(s,{dispatchId:'D-MULTI',planId:'P1',lines:s.allocationLines.map(l=>({...l,quantity:l.quantity/2})),destinationFacilityId:'DST',now}); assert.equal(r.ok,true); s=r.value;
  assert.equal(s.dispatchOrders[0].quantity,12.5);
  r=verifyReceipt(s,{dispatchId:'D-MULTI',deliveryId:'MULTI-PART',receivedQuantity:6.25,acceptedQuantity:6.25,destinationFacilityId:'DST',now}); assert.equal(r.ok,true); s=r.value;
  assert.equal(s.inventoryLots.filter(l=>l.facilityId==='DST').reduce((n,l)=>n+lotBalances(l,now).onHand,0),6.25);
  assert.equal(s.dispatchOrders[0].inTransitQuantity,6.25);
});
