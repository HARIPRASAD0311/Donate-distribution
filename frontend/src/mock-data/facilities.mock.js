/**
 * Simulated Warehouse Depots & Facilities
 */
export const MOCK_FACILITIES = [
  {
    id: 'FAC-01',
    code: 'CSD-01',
    name: 'Central Staging Depot',
    locationName: 'Port Access Sector Alpha',
    coordinates: { lat: -19.832, lng: 34.856 },
    totalCapacityM3: 5000,
    utilizedCapacityM3: 3850,
    capacityMeasurement: { capacity: 5000, unit: 'm3', baselineOccupied: 3850, baselineOccupiedUnit: 'm3', note: 'Volume-only facility telemetry; commodity mass-to-volume conversion is not configured.' },
    status: 'OPERATIONAL',
    isSimulated: true,
  },
  {
    id: 'FAC-02',
    code: 'NLB-02',
    name: 'North Logistics Base',
    locationName: 'Highland Dry Sector',
    coordinates: { lat: -19.745, lng: 34.912 },
    totalCapacityM3: 3500,
    utilizedCapacityM3: 3100,
    capacityMeasurement: { capacity: 3500, unit: 'm3', baselineOccupied: 3100, baselineOccupiedUnit: 'm3', note: 'Volume-only facility telemetry; commodity mass-to-volume conversion is not configured.' },
    status: 'CONSTRAINED',
    isSimulated: true,
  },
  {
    id: 'FAC-03',
    code: 'SRD-03',
    name: 'Southern Reserve Depot',
    locationName: 'Bayside Transit Zone',
    coordinates: { lat: -19.895, lng: 34.811 },
    totalCapacityM3: 4000,
    utilizedCapacityM3: 1200,
    capacityMeasurement: { capacity: 4000, unit: 'm3', baselineOccupied: 1200, baselineOccupiedUnit: 'm3', note: 'Volume-only facility telemetry; commodity mass-to-volume conversion is not configured.' },
    status: 'OPERATIONAL',
    isSimulated: true,
  },
];
