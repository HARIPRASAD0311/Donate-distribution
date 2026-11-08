/** Pure frontend operational ledger. All quantities are commodity+unit scoped. */
export const compatible = (a, b) => a.commodityId === b.commodityId && a.unit === b.unit;
export const sumCompatible = (records, commodityId, unit, selector = x => x.quantity) =>
  records.filter(x => x.commodityId === commodityId && x.unit === unit).reduce((n, x) => n + selector(x), 0);
const fail = message => ({ ok: false, error: message });
const ok = (value, extra = {}) => ({ ok: true, value, ...extra });
export function lotBalances(lot, now = new Date()) {
  const tx = lot.transactions || [];
  const received = tx.filter(t => t.type === 'RECEIPT').reduce((s, t) => s + t.quantity, 0) || lot.quantityReceived || 0;
  const dispatched = tx.filter(t => t.type === 'DISPATCH').reduce((s, t) => s + t.quantity, 0);
  const accepted = tx.filter(t => t.type === 'DESTINATION_ACCEPT').reduce((s, t) => s + t.quantity, 0);
  const damaged = tx.filter(t => t.type === 'DAMAGE').reduce((s, t) => s + t.quantity, 0);
  const quarantined = tx.filter(t => t.type === 'QUARANTINE').reduce((s, t) => s + t.quantity, 0);
  const reserved = Math.max(0, (lot.reservations || []).reduce((s, r) => s + (r.status === 'ACTIVE' ? r.quantity : 0), 0));
  const rejected = tx.filter(t => t.type === 'DESTINATION_REJECT').reduce((s, t) => s + t.quantity, 0);
  const adjusted = tx.filter(t => t.type === 'DOCUMENTED_ADJUSTMENT').reduce((s, t) => s + t.quantity, 0);
  const inTransit = Math.max(0, dispatched - accepted - damaged - rejected - adjusted);
  const expired = lot.expiryDate && new Date(`${lot.expiryDate}T23:59:59`) < now ? Math.max(0, received - dispatched - quarantined) : 0;
  const onHand = Math.max(0, received - dispatched);
  const usable = lot.qualityStatus === 'VERIFIED_USABLE' ? Math.max(0, onHand - quarantined - expired) : 0;
  return { received, onHand, reserved, inTransit, quarantined, expired, damaged, usable, available: Math.max(0, usable - reserved) };
}
export function eligibleLots(lots, { commodityId, unit, facilityId, now = new Date() } = {}) {
  return lots.filter(l => l.qualityStatus === 'VERIFIED_USABLE' && (!commodityId || l.commodityId === commodityId) && (!unit || l.unit === unit) && (!facilityId || l.facilityId === facilityId) && lotBalances(l, now).available > 0 && (!l.expiryDate || new Date(`${l.expiryDate}T23:59:59`) > now)).sort((a, b) => new Date(a.expiryDate || '9999-12-31') - new Date(b.expiryDate || '9999-12-31'));
}
export function reserveStock(state, { planId, commodityId, unit, facilityId, quantity, demandId = null, destinationFacilityId = null, actor = 'SIMULATED_OPERATOR', reason = 'Allocation approval', now = new Date() } = {}) {
  if (!planId || !commodityId || !unit || !facilityId || !(Number.isFinite(quantity) && quantity > 0)) return fail('Plan, commodity, unit, source facility and positive quantity are required');
  if (state.facilities?.length && !state.facilities.some(f => f.id === facilityId || f.code === facilityId)) return fail(`Unknown source facility: ${facilityId}`);
  if (destinationFacilityId && state.facilities?.length && !state.facilities.some(f => f.id === destinationFacilityId || f.code === destinationFacilityId)) return fail(`Unknown destination facility: ${destinationFacilityId}`);
  const candidates = eligibleLots(state.inventoryLots, { commodityId, unit, facilityId, now });
  const available = candidates.reduce((sum, l) => sum + lotBalances(l, now).available, 0);
  if (quantity > available) return fail(`Insufficient eligible stock: ${available} ${unit} available`);
  let remaining = quantity; const lots = state.inventoryLots.map(l => ({ ...l, reservations: [...(l.reservations || [])] })); const lines = [];
  for (const candidate of candidates) {
    if (remaining <= 0) break; const lot = lots.find(x => x.id === candidate.id); const take = Math.min(remaining, lotBalances(lot, now).available); const lineId = `ALN-${planId}-${lot.id}-${(state.allocationLines || []).length + lines.length + 1}`; const reservationId = `RSV-${planId}-${lot.id}-${(lot.reservations || []).length + 1}`;
    lot.reservations.push({ id: reservationId, lineId, planId, quantity: take, status: 'ACTIVE' });
    lines.push({ id: lineId, planId, lotId: lot.id, demandId, sourceFacilityId: facilityId, destinationFacilityId, commodityId, quantity: take, unit, status: 'RESERVED', reservationId }); remaining -= take;
  }
  const event = { id: `AUD-${state.auditEvents.length + 1}`, timestamp: now.toISOString(), actor, action: 'STOCK_RESERVED', entityId: planId, previousState: 'AVAILABLE', newState: 'RESERVED', reason, relatedTransactionId: planId, isDemo: true };
  const reservations = lines.map(line => ({ id: line.reservationId, lineId: line.id, planId, lotId: line.lotId, demandId, sourceFacilityId: facilityId, destinationFacilityId, commodityId, quantity: line.quantity, unit, status: 'ACTIVE', createdAt: now.toISOString() }));
  return ok({ ...state, inventoryLots: lots, allocationLines: [...(state.allocationLines || []), ...lines], stockReservations: [...(state.stockReservations || []), ...reservations], auditEvents: [...state.auditEvents, event] }, { lines });
}
export function dispatchStock(state, { dispatchId, planId, lines, destinationFacilityId, demandId = null, actor = 'SIMULATED_OPERATOR', now = new Date() } = {}) {
  if (!dispatchId || !planId || !Array.isArray(lines) || !lines.length) return fail('Dispatch ID, plan ID and dispatch lines are required');
  const existingDispatch = state.dispatchOrders.find(d => d.id === dispatchId); if (existingDispatch && !['READY', 'IN_TRANSIT'].includes(existingDispatch.status)) return fail('Dispatch is already fully accounted or closed');
  const plan = state.allocationPlans.find(p => p.id === planId && p.status === 'APPROVED'); if (!plan) return fail('Dispatch requires an approved allocation');
  // A READY order carries only planned lines/quantity (nothing has shipped yet); only IN_TRANSIT orders have shipped segments.
  const shipped = existingDispatch && existingDispatch.status !== 'READY' ? existingDispatch : null;
  const priorLines = shipped?.lines || [];
  if (!destinationFacilityId || (state.facilities?.length && !state.facilities.some(f => f.id === destinationFacilityId || f.code === destinationFacilityId))) return fail('Unknown destination facility');
  const next = state.inventoryLots.map(l => ({ ...l, transactions: [...(l.transactions || [])], reservations: (l.reservations || []).map(r => ({ ...r })) }));
  const selected = []; const seen = new Set();
  for (const requested of lines) {
    const allocation = state.allocationLines.find(l => l.id === requested.id && l.planId === planId);
    if (!allocation || !['RESERVED', 'PARTIALLY_DISPATCHED'].includes(allocation.status)) return fail('Dispatch line is not an active allocation line for this plan');
    if (seen.has(allocation.id)) return fail('Duplicate allocation line in dispatch'); seen.add(allocation.id);
    const qty = Number(requested.quantity ?? allocation.quantity); if (!(Number.isFinite(qty) && qty > 0 && qty <= allocation.quantity - (allocation.dispatchedQuantity || 0))) return fail('Invalid dispatch quantity');
    if (requested.lotId !== undefined && requested.lotId !== allocation.lotId) return fail('Dispatch lot does not match allocation line');
    const lot = next.find(l => l.id === allocation.lotId); if (!lot) return fail(`Inventory lot ${allocation.lotId} not found`);
    if (lot.commodityId !== allocation.commodityId || lot.unit !== allocation.unit) return fail('Commodity/unit mismatch');
    if (lot.qualityStatus !== 'VERIFIED_USABLE' || (lot.expiryDate && new Date(`${lot.expiryDate}T23:59:59`) < now)) return fail('Lot is not quality-eligible or has expired');
    const reservation = lot.reservations.find(r => r.id === allocation.reservationId && r.status === 'ACTIVE' && r.planId === planId && r.lineId === allocation.id);
    const held = reservation?.quantity || 0; if (held < qty) return fail('Dispatch quantity is not covered by its own active reservation');
    if (allocation.demandId && demandId && allocation.demandId !== demandId) return fail('Dispatch demand does not match allocation line');
    selected.push({ allocation, lot, qty, reservation });
  }
  const commodityUnit = new Set(selected.map(x => `${x.allocation.commodityId}::${x.allocation.unit}`));
  if (commodityUnit.size !== 1) return fail('A dispatch may contain only one compatible commodity and unit');
  const demandIds = new Set(selected.map(x => x.allocation.demandId).filter(Boolean));
  if (demandIds.size > 1 || (demandId && [...demandIds].some(id => id !== demandId))) return fail('A dispatch may contain allocation lines for only one demand record');
  for (const item of selected) {
    const { allocation, lot, qty, reservation } = item;
    lot.transactions.push({ id: `TX-${dispatchId}-${priorLines.length + allocation.id}`, type: 'DISPATCH', quantity: qty, unit: allocation.unit, commodityId: allocation.commodityId, at: now.toISOString(), dispatchId });
    reservation.quantity -= qty; if (reservation.quantity === 0) reservation.status = 'CONSUMED';
  }
  const dispatchLines = selected.map(({ allocation, qty }, i) => ({ ...allocation, quantity: qty, dispatchId, dispatchSegment: priorLines.length + i + 1 }));
  const segmentQuantity = dispatchLines.reduce((sum, l) => sum + l.quantity, 0); const quantity = (shipped?.quantity || 0) + segmentQuantity;
  const dispatch = { ...(existingDispatch || {}), id: dispatchId, planId, lines: [...priorLines, ...dispatchLines], destinationFacilityId, demandId: demandId || dispatchLines[0]?.demandId || existingDispatch?.demandId || null, quantity, status: 'IN_TRANSIT', dispatchedAt: shipped?.dispatchedAt || now.toISOString(), accountedQuantity: shipped?.accountedQuantity || 0, inTransitQuantity: (shipped?.inTransitQuantity || 0) + segmentQuantity, plannedQuantity: existingDispatch?.plannedQuantity ?? existingDispatch?.quantity ?? segmentQuantity, isDemo: true };
  const allocationLines = state.allocationLines.map(l => { const item = selected.find(x => x.allocation.id === l.id); if (!item) return l; const dispatched = (l.dispatchedQuantity || 0) + item.qty; return { ...l, dispatchedQuantity: dispatched, status: dispatched >= l.quantity ? 'CONSUMED' : 'PARTIALLY_DISPATCHED' }; });
  const selectedReservationIds = new Set(selected.map(x => x.reservation.id));
  const stockReservations = (state.stockReservations || []).map(r => selectedReservationIds.has(r.id) ? { ...r, quantity: Math.max(0, r.quantity - selected.find(x => x.reservation.id === r.id).qty), status: r.quantity <= selected.find(x => x.reservation.id === r.id).qty ? 'CONSUMED' : 'ACTIVE' } : r);
  const transactions = dispatchLines.map(line => ({ id: `TX-${dispatchId}-${line.dispatchSegment}-${line.id}`, type: 'DISPATCH', lotId: line.lotId, dispatchId, allocationLineId: line.id, quantity: line.quantity, unit: line.unit, commodityId: line.commodityId, at: now.toISOString() }));
  const event = { id: `AUD-${state.auditEvents.length + 1}`, timestamp: now.toISOString(), actor, action: 'DISPATCH_CREATED', entityId: dispatchId, previousState: 'RESERVED', newState: 'IN_TRANSIT', reason: 'Approved allocation lines dispatched', relatedTransactionId: dispatchId, isDemo: true };
  return ok({ ...state, inventoryLots: next, inventoryTransactions: [...(state.inventoryTransactions || []), ...transactions], stockReservations, allocationLines, dispatchOrders: existingDispatch ? state.dispatchOrders.map(d => d.id === dispatchId ? dispatch : d) : [...state.dispatchOrders, dispatch], auditEvents: [...state.auditEvents, event] }, { dispatch });
}
export function verifyReceipt(state, { dispatchId, deliveryId, receivedQuantity, acceptedQuantity, damagedQuantity = 0, rejectedQuantity = 0, adjustedQuantity = 0, destinationFacilityId, actor = 'SIMULATED_OPERATOR', now = new Date(), adjustmentReason = null } = {}) {
  if (!deliveryId || state.deliveryRecords.some(d => d.id === deliveryId)) return fail('Duplicate delivery receipt ID');
  if (!destinationFacilityId || !state.facilities?.some(f => f.id === destinationFacilityId || f.code === destinationFacilityId)) return fail('Unknown destination facility');
  const dispatch = state.dispatchOrders.find(d => d.id === dispatchId); if (!dispatch) return fail('Dispatch not found');
  if (dispatch.destinationFacilityId && dispatch.destinationFacilityId !== destinationFacilityId) return fail('Receipt destination does not match dispatch destination');
  if (dispatch.status === 'READY' || !dispatch.dispatchedAt) return fail('Dispatch has not departed');
  if (dispatch.status === 'VERIFIED' || (dispatch.inTransitQuantity === 0 && dispatch.accountedQuantity >= dispatch.quantity)) return fail('Dispatch is already fully verified');
  if (dispatch.status === 'READY') return fail('Dispatch has not departed');
  if ([receivedQuantity, acceptedQuantity, damagedQuantity, rejectedQuantity, adjustedQuantity].some(n => !Number.isFinite(n) || n < 0) || receivedQuantity <= 0 || acceptedQuantity + damagedQuantity + rejectedQuantity + adjustedQuantity !== receivedQuantity) return fail('Every received unit must be classified as accepted, damaged, or rejected');
  if (!dispatch.lines?.length || dispatch.lines.some(l => l.commodityId !== dispatch.lines[0].commodityId || l.unit !== dispatch.lines[0].unit)) return fail('Dispatch lines must use one compatible commodity and unit');
  const prior = state.deliveryRecords.filter(d => d.dispatchId === dispatchId);
  const accounted = prior.reduce((n, d) => n + d.receivedQuantity, 0);
  const remaining = dispatch.quantity - accounted;
  if (receivedQuantity > remaining) return fail(`Receipt exceeds remaining in-transit quantity (${remaining} ${dispatch.lines[0].unit})`);
  if (adjustedQuantity > 0 && !adjustmentReason) return fail('A documented adjustment reason is required');
  const commodityId = dispatch.lines[0].commodityId, unit = dispatch.lines[0].unit;
  if (dispatch.lines.some(l => l.commodityId !== commodityId || l.unit !== unit)) return fail('Commodity/unit mismatch');
  if (dispatch.demandId) { const linked = state.demandRecords.find(d => d.id === dispatch.demandId); if (!linked || linked.commodityId !== commodityId || linked.unit !== unit || acceptedQuantity > (linked.quantity - (linked.fulfilledQuantity || 0))) return fail('Linked demand missing, incompatible, or would be over-fulfilled'); }
  const nextLots = state.inventoryLots.map(l => ({ ...l, transactions: [...(l.transactions || [])] }));
  // Allocate each receipt against the unaccounted tail of the dispatched lines.
  let skip = accounted, receiptLeft = receivedQuantity, acceptLeft = acceptedQuantity, damageLeft = damagedQuantity, rejectLeft = rejectedQuantity, adjustLeft = adjustedQuantity;
  const acceptedLines = [];
  for (const line of dispatch.lines) {
    if (skip >= line.quantity) { skip -= line.quantity; continue; }
    const lot = nextLots.find(l => l.id === line.lotId); if (!lot) return fail(`Source lot ${line.lotId} no longer exists`);
    if (lot.commodityId !== line.commodityId || lot.unit !== line.unit) return fail('Source lot commodity/unit changed');
    const capacity = Math.min(receiptLeft, line.quantity - skip); let left = capacity;
    const accepted = Math.min(left, acceptLeft); left -= accepted; acceptLeft -= accepted;
    const damaged = Math.min(left, damageLeft); left -= damaged; damageLeft -= damaged;
    const rejected = Math.min(left, rejectLeft); left -= rejected; rejectLeft -= rejected;
    const adjusted = Math.min(left, adjustLeft); left -= adjusted; adjustLeft -= adjusted;
    if (left) return fail('Receipt classification does not account for received quantity');
    if (accepted) { lot.transactions.push({ id: `TX-${deliveryId}-${lot.id}-${line.dispatchSegment || 0}-A`, type: 'DESTINATION_ACCEPT', quantity: accepted, unit, commodityId, at: now.toISOString(), deliveryId, facilityId: destinationFacilityId }); acceptedLines.push({ ...line, quantity: accepted, destinationFacilityId }); }
    if (damaged) lot.transactions.push({ id: `TX-${deliveryId}-${lot.id}-${line.dispatchSegment || 0}-D`, type: 'DAMAGE', quantity: damaged, unit, commodityId, at: now.toISOString(), deliveryId });
    if (rejected) lot.transactions.push({ id: `TX-${deliveryId}-${lot.id}-${line.dispatchSegment || 0}-R`, type: 'DESTINATION_REJECT', quantity: rejected, unit, commodityId, at: now.toISOString(), deliveryId });
    if (adjusted) lot.transactions.push({ id: `TX-${deliveryId}-${lot.id}-${line.dispatchSegment || 0}-X`, type: 'DOCUMENTED_ADJUSTMENT', quantity: adjusted, unit, commodityId, at: now.toISOString(), deliveryId, reason: adjustmentReason });
    receiptLeft -= capacity; skip = 0; if (!receiptLeft) break;
  }
  if (receiptLeft || acceptLeft || damageLeft || rejectLeft || adjustLeft) return fail('Receipt exceeds dispatched line quantities or has incompatible classification');
  // Capacity is enforced only where the facility explicitly declares a compatible
  // commodity+unit limit. No mass/volume conversion is inferred.
  const destination = state.facilities.find(f => f.id === destinationFacilityId || f.code === destinationFacilityId);
  const capacityChecks = [];
  for (const group of acceptedLines.reduce((acc, line) => { const key = `${line.commodityId}::${line.unit}`; const item = acc.find(x => x.key === key); if (item) item.quantity += line.quantity; else acc.push({ key, commodityId: line.commodityId, unit: line.unit, quantity: line.quantity }); return acc; }, [])) {
    const limit = (destination.capacityLimits || []).find(x => x.commodityId === group.commodityId && x.unit === group.unit);
    if (!limit) { capacityChecks.push({ commodityId: group.commodityId, unit: group.unit, enforced: false, reason: 'No configured capacity limit in a compatible unit', facilityCapacity: destination.capacityMeasurement || null, assumption: 'Facility capacity is not enforced for this commodity/unit; no conversion is inferred' }); continue; }
    if (!Number.isFinite(limit.capacity) || limit.capacity < 0 || !Number.isFinite(limit.baselineOccupied ?? 0) || (limit.baselineOccupied ?? 0) < 0) return fail('Destination capacity configuration is invalid');
    const occupied = nextLots.filter(l => l.facilityId === destinationFacilityId && l.commodityId === group.commodityId && l.unit === group.unit).reduce((n, l) => n + lotBalances(l, now).onHand, 0) + (limit.baselineOccupied || 0);
    if (occupied + group.quantity > limit.capacity) return fail(`Destination capacity exceeded for ${group.commodityId} (${group.unit}): ${occupied + group.quantity} > ${limit.capacity}`);
    capacityChecks.push({ commodityId: group.commodityId, unit: group.unit, enforced: true, capacity: limit.capacity, occupiedBefore: occupied, incomingAccepted: group.quantity, occupiedAfter: occupied + group.quantity, measurementAssumption: 'Exact quantity comparison; no unit conversion', capacityUnit: group.unit, capacityMeasurement: destination.capacityMeasurement || { capacity: limit.capacity, unit: group.unit } });
  }
  for (const line of acceptedLines) { const source = nextLots.find(l => l.id === line.lotId); nextLots.push({ id: `RCV-${deliveryId}-${line.lotId}-${line.dispatchSegment || 0}`, commodityId: line.commodityId, commodity: line.commodityId, facilityId: destinationFacilityId, batchId: `${source.batchId || line.lotId}-TRANSFER`, quantityReceived: line.quantity, unit: line.unit, expiryDate: source.expiryDate, qualityStatus: 'VERIFIED_USABLE', source: `Transfer ${dispatchId}`, receivedAt: now.toISOString(), transactions: [{ id: `TX-${deliveryId}-${line.lotId}-${line.dispatchSegment || 0}-RECEIPT`, type: 'RECEIPT', quantity: line.quantity, unit: line.unit, commodityId: line.commodityId, at: now.toISOString(), deliveryId }], reservations: [], isDemo: true }); }
  const delivery = { id: deliveryId, dispatchId, receivedQuantity, acceptedQuantity, damagedQuantity, rejectedQuantity, adjustedQuantity, acceptedLines, capacityChecks, verifiedAt: now.toISOString(), status: 'VERIFIED', adjustmentReason, isDemo: true };
  const deliveryRecords = [...state.deliveryRecords, delivery];
  const fullyAccounted = deliveryRecords.filter(d => d.dispatchId === dispatchId).reduce((n, d) => n + d.receivedQuantity, 0) === dispatch.quantity;
  const demandRecords = state.demandRecords.map(d => d.id === dispatch.demandId ? { ...d, fulfilledQuantity: (d.fulfilledQuantity || 0) + acceptedQuantity, remainingQuantity: Math.max(0, d.quantity - (d.fulfilledQuantity || 0) - acceptedQuantity) } : d);
  const dispatchOrders = state.dispatchOrders.map(d => d.id === dispatchId ? { ...d, status: fullyAccounted ? 'VERIFIED' : 'PARTIALLY_VERIFIED', verifiedAt: fullyAccounted ? now.toISOString() : null, lastReceiptAt: now.toISOString(), accountedQuantity: accounted + receivedQuantity, inTransitQuantity: dispatch.quantity - accounted - receivedQuantity } : d);
  const event = { id: `AUD-${state.auditEvents.length + 1}`, timestamp: now.toISOString(), actor, action: fullyAccounted ? 'DELIVERY_FULLY_VERIFIED' : 'DELIVERY_PARTIALLY_VERIFIED', entityId: dispatchId, previousState: dispatch.status, newState: fullyAccounted ? 'VERIFIED' : 'PARTIALLY_VERIFIED', reason: adjustmentReason || 'Proof of delivery quantities verified', relatedTransactionId: deliveryId, isDemo: true };
  const receiptTransactions = nextLots.flatMap(l => (l.transactions || []).filter(t => t.deliveryId === deliveryId).map(t => ({ ...t, lotId: l.id }))); return ok({ ...state, inventoryLots: nextLots, inventoryTransactions: [...(state.inventoryTransactions || []), ...receiptTransactions], deliveryRecords, dispatchOrders, demandRecords, auditEvents: [...state.auditEvents, event] }, { delivery, fullyAccounted });
}
