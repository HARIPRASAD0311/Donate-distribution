/**
 * Simulated Allocation Optimization Proposals
 */
export const MOCK_ALLOCATIONS = [
  {
    id: 'ALC-001',
    sourceFacilityId: 'FAC-01',
    sourceFacilityName: 'Central Staging Depot',
    targetCommunityId: 'DEM-001',
    targetCommunityName: 'Delta Settlement',
    commodityName: 'High-Energy Food Biscuits (BP-5)',
    allocatedQuantity: 1800,
    unitOfMeasure: 'packets',
    feasibilityStatus: 'FEASIBLE',
    routeFeasible: true,
    coordinatorAuthorized: true,
    isSimulated: true,
  },
  {
    id: 'ALC-002',
    sourceFacilityId: 'FAC-03',
    sourceFacilityName: 'Southern Reserve Depot',
    targetCommunityId: 'DEM-002',
    targetCommunityName: 'East Coastal Village',
    commodityName: 'Clean Drinking Water Bladders (10L)',
    allocatedQuantity: 3000,
    unitOfMeasure: 'containers',
    feasibilityStatus: 'PARTIALLY_CONSTRAINED',
    routeFeasible: false,
    coordinatorAuthorized: false,
    isSimulated: true,
  },
];
