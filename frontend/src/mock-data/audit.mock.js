/**
 * Simulated Immutable Audit Logs
 */
export const MOCK_AUDIT_LOGS = [
  {
    id: 'AUD-901',
    timestamp: '2026-11-05T08:15:22Z',
    actorName: 'Col. S. Vance',
    actorRole: 'Logistics Ops Chief',
    action: 'EXCEPTION_RESOLVE',
    entityType: 'Shipment',
    entityId: 'SHP-1043',
    details: 'Logged winching scout response note and authorized radio check frequency change.',
    isSimulated: true,
  },
  {
    id: 'AUD-902',
    timestamp: '2026-11-05T08:00:10Z',
    actorName: 'A. Diallo',
    actorRole: 'Field Coordinator',
    action: 'DISPATCH',
    entityType: 'Convoy',
    entityId: 'SHP-1041',
    details: 'Dispatched River Barge BRG-02 with 300 water bladders to Delta Settlement.',
    isSimulated: true,
  },
  {
    id: 'AUD-903',
    timestamp: '2026-11-05T07:50:00Z',
    actorName: 'Col. S. Vance',
    actorRole: 'Logistics Ops Chief',
    action: 'AUTHORIZE',
    entityType: 'AllocationPlan',
    entityId: 'ALC-001',
    details: 'Human sign-off granted for optimization solver proposals ALC-001 batch.',
    isSimulated: true,
  },
];
