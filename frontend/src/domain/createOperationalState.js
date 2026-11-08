import { MOCK_INVENTORY_ITEMS } from '../features/resources/data/resourcesData.js';
import { MOCK_DEMAND_ITEMS, MOCK_BENEFICIARY_GROUPS } from '../features/demand/data/demandData.js';
import { MOCK_INCIDENTS } from '../mock-data/incidents.mock.js';
import { MOCK_FACILITIES } from '../mock-data/facilities.mock.js';
import { MOCK_DISPATCH_ORDERS } from '../features/dispatch/data/dispatchData.js';
import { INITIAL_AUDIT_EVENTS } from '../features/audit/data/auditData.js';
import { DEMO_GEOGRAPHIC_LOCATIONS } from '../mock-data/geographicLocations.mock.js';
import { DEMO_DISASTER_ZONES } from '../mock-data/disasterZones.mock.js';

export function createOperationalState() {
  const facilities = [
    ...MOCK_FACILITIES,
    {
      id: 'DESTINATION',
      code: 'DESTINATION',
      name: 'Field Relief Distribution Hub',
      locationName: 'Designated Field Delivery Sector',
      coordinates: { lat: -19.789, lng: 34.821 },
      totalCapacityM3: 2000,
      utilizedCapacityM3: 500,
      capacityLimits: [],
      status: 'OPERATIONAL',
      isSimulated: true,
    },
  ];

  const inventoryLots = MOCK_INVENTORY_ITEMS.map((x) => {
    const totalReceived = x.receivedQty ?? x.totalQty;
    const diff = totalReceived > x.totalQty ? totalReceived - x.totalQty : 0;
    const tx = [
      {
        id: `TX-${x.id}-INIT-RCV`,
        type: 'RECEIPT',
        quantity: totalReceived,
        unit: x.unit,
        commodityId: x.commodity,
        at: x.receivedDate || new Date().toISOString(),
      },
    ];
    if (diff > 0) {
      tx.push({
        id: `TX-${x.id}-INIT-DISP`,
        type: 'DISPATCH',
        quantity: diff,
        unit: x.unit,
        commodityId: x.commodity,
        at: x.receivedDate || new Date().toISOString(),
        planId: 'LEGACY-COMMITMENT',
      });
    }

    return {
      id: x.id,
      commodityId: x.commodity,
      commodity: x.commodity,
      facilityId: x.facilityId,
      batchId: x.batchId,
      quantityReceived: totalReceived,
      unit: x.unit,
      expiryDate: x.expiryDate,
      qualityStatus: x.qualityStatus,
      source: x.source,
      receivedAt: x.receivedDate,
      transactions: tx,
      reservations: x.reservedQty
        ? [{ id: `SEED-${x.id}`, planId: 'LEGACY-COMMITMENT', quantity: x.reservedQty, status: 'ACTIVE' }]
        : [],
      isDemo: true,
    };
  });

  const stockReservations = inventoryLots
    .flatMap((x) =>
      (x.reservations || []).map((r) => ({
        id: r.id,
        lineId: `LINE-${r.id}`,
        planId: r.planId,
        lotId: x.id,
        facilityId: x.facilityId,
        commodityId: x.commodityId,
        unit: x.unit,
        quantity: r.quantity,
        status: r.status,
        createdAt: x.receivedAt || new Date().toISOString(),
      }))
    )
    .filter((r) => r.status === 'ACTIVE');

  const allocationPlans = [
    {
      id: 'LEGACY-COMMITMENT',
      name: 'Legacy Humanitarian Commitment (Pre-allocated)',
      status: 'APPROVED',
      approvedAt: '2026-11-04T00:00:00Z',
      allocations: [],
      isDemo: true,
    },
  ];

  const allocationLines = stockReservations.map((r) => ({
    id: r.lineId,
    planId: r.planId,
    lotId: r.lotId,
    sourceFacilityId: r.facilityId,
    destinationFacilityId: 'DESTINATION',
    commodityId: r.commodityId,
    quantity: r.quantity,
    unit: r.unit,
    status: 'RESERVED',
    reservationId: r.id,
  }));

  const dispatchOrders = MOCK_DISPATCH_ORDERS.map((d) => ({
    ...d,
    destinationFacilityId: d.destinationId || 'DESTINATION',
    demandId:
      d.demandId ||
      (d.allocationId === 'ALC-001'
        ? 'DEM-2026-081'
        : d.allocationId === 'ALC-002'
        ? 'DEM-2026-082'
        : d.allocationId === 'ALC-003'
        ? 'DEM-2026-083'
        : null),
    lines: d.lines || [
      {
        id: `LINE-${d.id}`,
        lotId: d.batchId === 'BATCH-24045' ? 'RES-F01' : d.batchId === 'BATCH-24112' ? 'RES-W01' : 'RES-M01',
        planId: d.planId || 'PLAN-ALPHA',
        quantity: d.quantity,
        commodityId: d.commodity,
        unit: d.unit,
        status: d.status === 'VERIFIED' ? 'CONSUMED' : 'DISPATCHED',
      },
    ],
    accountedQuantity: d.status === 'VERIFIED' ? d.quantity : 0,
    inTransitQuantity: ['IN_TRANSIT', 'PARTIALLY_VERIFIED'].includes(d.status) ? d.quantity : 0,
    status: d.status === 'DELIVERED' ? 'ARRIVED_AWAITING_POD' : d.status,
    arrivedAt: d.actualArrival || (d.status === 'DELIVERED' ? '2026-11-05T11:15:00Z' : null),
    isDemo: true,
  }));

  const auditEvents = INITIAL_AUDIT_EVENTS.map((e) => ({
    ...e,
    actor: e.user || e.actor || 'SIMULATED_OPERATOR',
    isDemo: true,
  }));

  return {
    incidents: MOCK_INCIDENTS,
    facilities,
    inventoryLots,
    inventoryTransactions: [],
    beneficiaryGroups: MOCK_BENEFICIARY_GROUPS,
    demandRecords: MOCK_DEMAND_ITEMS.map((d) => ({
      ...d,
      commodityId: d.commodity,
      quantity: d.quantity,
      unit: d.unit,
      fulfilledQuantity: d.fulfilledQuantity || 0,
      isDemo: true,
    })),
    allocationPlans,
    allocationLines,
    stockReservations,
    recoveryResults: [],
    dispatchOrders,
    deliveryRecords: [],
    auditEvents,
    geographicLocations: DEMO_GEOGRAPHIC_LOCATIONS,
    disasterZones: DEMO_DISASTER_ZONES,
  };
}
