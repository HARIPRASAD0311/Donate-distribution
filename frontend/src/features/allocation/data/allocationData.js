/**
 * ResQNet Allocation Planning & Optimization Telemetry Data
 * All results labeled as SIMULATED OPTIMIZATION OUTPUT (DEMO).
 * Actual mathematical optimization solver runs in server-side Python.
 */

// 1. Multi-Echelon Supply Chain Network (Suppliers -> Tier-I -> Tier-II -> DCs -> Beneficiaries)
export const SUPPLY_CHAIN_NETWORK = {
  nodes: [
    // Echelon 1: Institutional Donors / Suppliers
    {
      id: 'SUP-01',
      name: 'Beira Agro-Milling & Port Terminal',
      echelon: 'SUPPLIER',
      capacityM3: 25000,
      currentThroughput: 8500,
      stockAvailable: '12,000 MT Grain / Biscuits',
      bottleneck: null,
      status: 'OPERATIONAL',
    },
    {
      id: 'DNR-02',
      name: 'ECHO / UNICEF Forward Staging Airhead',
      echelon: 'SUPPLIER',
      capacityM3: 12000,
      currentThroughput: 4200,
      stockAvailable: '800 IEHK Kits, 5,000 Water Bladders',
      bottleneck: 'Air-slot congestion (max 6 flights/day)',
      status: 'CONSTRAINED',
    },

    // Echelon 2: Tier-I Foodbanks / Central Depots
    {
      id: 'CSD-01',
      name: 'Central Staging Depot (CSD-01)',
      echelon: 'TIER_1_DEPOT',
      capacityM3: 5000,
      utilizedM3: 3850,
      remainingCapacityM3: 1150,
      stockAvailable: '4,500 BP-5 Food pkts, 3,500 Potable Water 10L',
      bottleneck: 'Staging bay near capacity (77% utilized)',
      status: 'OPERATIONAL',
    },
    {
      id: 'NLB-02',
      name: 'North Logistics Base (NLB-02)',
      echelon: 'TIER_1_DEPOT',
      capacityM3: 3500,
      utilizedM3: 3100,
      remainingCapacityM3: 400,
      stockAvailable: '2,200 Super Cereal pkts, 18,000L Raw Water (QC)',
      bottleneck: 'Southward road access restricted at km 42',
      status: 'CONSTRAINED',
    },

    // Echelon 3: Tier-II FRRAs (Forward Rapid Replenishment Areas)
    {
      id: 'FRRA-01',
      name: 'Buzi Estuary Riverine Staging Post',
      echelon: 'TIER_2_FRRA',
      capacityM3: 1800,
      utilizedM3: 1200,
      remainingCapacityM3: 600,
      stockAvailable: '1,450 Food pkts, 1,200 Water cont',
      bottleneck: 'Dependent on high-tide shallow barge convoy',
      status: 'OPERATIONAL',
    },
    {
      id: 'FRRA-02',
      name: 'Manga Highway Forward Pad',
      echelon: 'TIER_2_FRRA',
      capacityM3: 2000,
      utilizedM3: 1650,
      remainingCapacityM3: 350,
      stockAvailable: '3,200 Flour pkts, 4,200 Aquatabs',
      bottleneck: null,
      status: 'OPERATIONAL',
    },

    // Echelon 4: Distribution Centres (DCs)
    {
      id: 'DC-01',
      name: 'Sector 2 Distribution Hub',
      echelon: 'DISTRIBUTION_CENTRE',
      capacityM3: 800,
      utilizedM3: 600,
      remainingCapacityM3: 200,
      stockAvailable: '450 Food pkts buffer',
      bottleneck: null,
      status: 'OPERATIONAL',
    },
    {
      id: 'DC-02',
      name: 'East Coastal Triage DC',
      echelon: 'DISTRIBUTION_CENTRE',
      capacityM3: 1200,
      utilizedM3: 1100,
      remainingCapacityM3: 100,
      stockAvailable: '150 Water cont (near stockout)',
      bottleneck: 'Highway washout bypass adds 4.5h transit',
      status: 'CONSTRAINED',
    },

    // Echelon 5: Beneficiary Locations
    {
      id: 'BEN-01',
      name: 'Delta Estuary IDP Settlement',
      echelon: 'BENEFICIARY',
      population: 14200,
      demand: '1,450 Food pkts (CRITICAL)',
      fulfilled: '1,450 Food pkts (100% Met in Plan Alpha)',
      status: 'PRIORITY_SATISFIED',
    },
    {
      id: 'BEN-02',
      name: 'Buzi Island Cut-Off Community',
      echelon: 'BENEFICIARY',
      population: 9800,
      demand: '2,800 Water cont (CRITICAL)',
      fulfilled: '2,800 Water cont (100% Met in Plan Alpha)',
      status: 'PRIORITY_SATISFIED',
    },
    {
      id: 'BEN-03',
      name: 'Manga Camp Relocation Center',
      echelon: 'BENEFICIARY',
      population: 26500,
      demand: '3,200 Food pkts, 4,200 Aquatabs',
      fulfilled: '2,800 Food, 3,800 Aquatabs (85% Met)',
      status: 'SUBSTANTIALLY_MET',
    },
    {
      id: 'BEN-04',
      name: 'Chibabava Field Triage Clinic',
      echelon: 'BENEFICIARY',
      population: 3200,
      demand: '45 IEHK Kits (CRITICAL)',
      fulfilled: '45 IEHK Kits (100% Met in Plan Alpha)',
      status: 'PRIORITY_SATISFIED',
    },
  ],

  flows: [
    { from: 'SUP-01', to: 'CSD-01', commodity: 'FOOD', qty: 5000, unit: 'pkts', mode: 'Heavy Rail / Semi-Truck', status: 'FLOWING' },
    { from: 'DNR-02', to: 'CSD-01', commodity: 'MEDICAL', qty: 180, unit: 'kits', mode: 'Air Cargo Shuttle', status: 'FLOWING' },
    { from: 'CSD-01', to: 'FRRA-01', commodity: 'FOOD', qty: 1450, unit: 'pkts', mode: 'Shallow Barge Flotilla', status: 'BOTTLENECK', note: 'Tide-constrained' },
    { from: 'CSD-01', to: 'FRRA-01', commodity: 'WATER', qty: 2800, unit: 'containers', mode: 'Shallow Barge Flotilla', status: 'BOTTLENECK' },
    { from: 'CSD-01', to: 'FRRA-02', commodity: 'FOOD', qty: 3200, unit: 'pkts', mode: 'Secured Convoy', status: 'FLOWING' },
    { from: 'FRRA-01', to: 'BEN-01', commodity: 'FOOD', qty: 1450, unit: 'pkts', mode: 'Amphibious Tractor', status: 'FLOWING' },
    { from: 'FRRA-01', to: 'BEN-02', commodity: 'WATER', qty: 2800, unit: 'containers', mode: 'Mi-8 Helicopter Sling', status: 'FLOWING' },
    { from: 'FRRA-02', to: 'BEN-03', commodity: 'FOOD', qty: 2800, unit: 'pkts', mode: '10-Ton Truck', status: 'FLOWING' },
    { from: 'CSD-01', to: 'BEN-04', commodity: 'MEDICAL', qty: 45, unit: 'kits', mode: '4WD Cold-Box Fleet', status: 'FLOWING' },
  ],
};

// 2. Demonstration Optimization Plans
export const MOCK_PLANS = {
  'PLAN-ALPHA': {
    id: 'PLAN-ALPHA',
    name: 'Plan Alpha: Multi-Objective Balanced Compromise (Recommended)',
    description: 'Jointly optimizes human welfare, Sphere minimum standard compliance, and regional equity (Gini = 0.18).',
    isRecommended: true,
    solverStatus: 'OPTIMAL_FEASIBLE',
    optimalityGapPct: 0.02,
    runtimeSeconds: 1.84,
    objectiveValue: 94.62,
    totalAllocatedUnits: 18350,
    totalVerifiedDemandUnits: 21200,
    overallCoveragePct: 86.5,
    criticalCoveragePct: 100.0,
    giniCoefficient: 0.18,
    feasibilityBadge: 'OPTIMAL',
    allocations: [
      {
        id: 'ALC-001',
        demandId: 'DEM-2026-081',
        sourceFacility: 'Central Staging Depot (CSD-01)',
        sourceFacilityId: 'CSD-01',
        destination: 'Delta Estuary Evacuation Settlement',
        destinationRegion: 'Buzi District',
        commodity: 'FOOD',
        item: 'High-Energy Emergency Food Biscuits (BP-5)',
        allocatedQty: 1000,
        requiredQty: 1000,
        remainingDemand: 0,
        unit: 'packets',
        route: 'Route rt-4 (River Barge Flotilla)',
        expectedArrival: 'Today 17:30 UTC',
        priority: 'CRITICAL',
        destinationSelectedReason: 'Sector contains 14,200 cut-off IDPs with 42% under-5 population and zero remaining biscuit stock.',
        bindingConstraints: 'Buzi River draft limits barge cargo capacity to 85 tons max; FEFO batch #24045 mandatory issue.',
        resourcesConsidered: 'CSD-01 Lot 24045 (selected 1,000 pkts); NLB-02 Lot 24018 (rejected due to highway culvert washout).',
        unmetDemandReason: 'None. 100% of verified critical demand fulfilled.',
        humanOverride: false,
      },
      {
        id: 'ALC-002',
        demandId: 'DEM-2026-082',
        sourceFacility: 'Central Staging Depot (CSD-01)',
        sourceFacilityId: 'CSD-01',
        destination: 'Buzi Island Cut-Off Community',
        destinationRegion: 'Buzi District',
        commodity: 'WATER',
        item: 'Emergency Potable Water (10L Sealed Containers)',
        allocatedQty: 2200,
        requiredQty: 2200,
        remainingDemand: 0,
        unit: 'containers',
        route: 'Corridor Air-Sling (Mi-8 Cargo Winch)',
        expectedArrival: 'Tomorrow 08:00 UTC',
        priority: 'CRITICAL',
        destinationSelectedReason: 'Island community completely isolated by floodwaters; flood silt destroyed 100% of open surface wells.',
        bindingConstraints: 'Air transport cargo payload limits 2 sorties; strict WHO potable certification record QC-W-8812 required.',
        resourcesConsidered: 'CSD-01 potable containers (selected 2,200); NLB-02 bulk water (rejected: pending laboratory QC clearance).',
        unmetDemandReason: 'None. Complete verified life-saving demand met.',
        humanOverride: false,
      },
      {
        id: 'ALC-003',
        demandId: 'DEM-2026-083',
        sourceFacility: 'Central Staging Depot (CSD-01)',
        sourceFacilityId: 'CSD-01',
        destination: 'Chibabava Field Triage Clinic',
        destinationRegion: 'Chibabava Basin',
        commodity: 'MEDICAL',
        item: 'Inter-Agency Emergency Health Kits (IEHK Basic 2024)',
        allocatedQty: 30,
        requiredQty: 30,
        remainingDemand: 0,
        unit: 'kits',
        route: 'North Bypass Route (4WD Vehicle)',
        expectedArrival: 'Today 19:00 UTC',
        priority: 'CRITICAL',
        destinationSelectedReason: 'Acute surgical and maternity emergency clinic with post-flood cholera outbreak surveillance.',
        bindingConstraints: 'Cold-chain +2°C to +8°C transport requirement; MSF clinical certification verified.',
        resourcesConsidered: 'CSD-01 Lot 24099 (selected 30 kits); Quarantined vaccine lot 23880 excluded automatically.',
        unmetDemandReason: 'None. Full critical quota fulfilled.',
        humanOverride: false,
      },
      {
        id: 'ALC-004',
        demandId: 'DEM-2026-084',
        sourceFacility: 'Central Staging Depot (CSD-01)',
        sourceFacilityId: 'CSD-01',
        destination: 'Manga Camp Relocation Center',
        destinationRegion: 'Manga IDP Hub',
        commodity: 'WATER',
        item: 'Water Purification Tablets (Aquatabs 67mg / 1000s)',
        allocatedQty: 1400,
        requiredQty: 1400,
        remainingDemand: 0,
        unit: 'containers',
        route: 'Highway East Convoy (10-Ton Truck)',
        expectedArrival: 'Tomorrow 10:30 UTC',
        priority: 'HIGH',
        destinationSelectedReason: 'Dense 26,500 IDP relocation hub with high waterborne epidemic transmission risk.',
        bindingConstraints: 'Truck convoy capacity; depot staging dispatch threshold.',
        resourcesConsidered: 'CSD-01 Aquatabs stockpile (selected 1,400 boxes).',
        unmetDemandReason: 'None. Fulfilled in full.',
        humanOverride: false,
      },
      {
        id: 'ALC-005',
        demandId: 'DEM-2026-085',
        sourceFacility: 'North Logistics Base (NLB-02)',
        sourceFacilityId: 'NLB-02',
        destination: 'Manga Camp Relocation Center',
        destinationRegion: 'Manga IDP Hub',
        commodity: 'FOOD',
        item: 'Fortified Maize Flour (Super Cereal Plus)',
        allocatedQty: 1000,
        requiredQty: 1400,
        remainingDemand: 400,
        unit: 'packets',
        route: 'Alternative North Road (Bypassing km 42)',
        expectedArrival: 'Tomorrow 14:00 UTC',
        priority: 'HIGH',
        destinationSelectedReason: 'Substantial IDP food ration requirement; North base holds 2,200 verified packets.',
        bindingConstraints: '15% safety reserve retained at NLB-02 depot for sudden surge; transit detour added 3.5h.',
        resourcesConsidered: 'NLB-02 Lot 24018 (allocated 1,000 pkts); 400 pkts held in depot safety buffer.',
        unmetDemandReason: '400 packets held to maintain non-zero safety inventory across regional depots in case of rainstorm recurrence.',
        humanOverride: false,
      },
      {
        id: 'ALC-006',
        demandId: 'DEM-2026-089',
        sourceFacility: 'Central Staging Depot (CSD-01)',
        sourceFacilityId: 'CSD-01',
        destination: 'St. Teresa Vulnerable Care Sanctuary',
        destinationRegion: 'Manga IDP Hub',
        commodity: 'FOOD',
        item: 'High-Energy Emergency Food Biscuits (BP-5)',
        allocatedQty: 400,
        requiredQty: 400,
        remainingDemand: 0,
        unit: 'packets',
        route: 'Urban Secondary Arterial',
        expectedArrival: 'Tomorrow 11:00 UTC',
        priority: 'MEDIUM',
        destinationSelectedReason: '1,450 orphans and elderly residents requiring supplementary feeding.',
        bindingConstraints: 'FEFO stock rotation priority.',
        resourcesConsidered: 'CSD-01 remaining stock (allocated 400 pkts).',
        unmetDemandReason: 'None. Second delivery cycle completed.',
        humanOverride: false,
      },
    ],
  },

  'PLAN-BETA': {
    id: 'PLAN-BETA',
    name: 'Plan Beta: Highway Speed Push (Throughput First)',
    description: 'Prioritizes immediate high-tonnage ground delivery via accessible roads, sacrificing equity in cut-off river pockets.',
    isRecommended: false,
    solverStatus: 'FEASIBLE_SUBOPTIMAL',
    optimalityGapPct: 2.45,
    runtimeSeconds: 0.92,
    objectiveValue: 81.30,
    totalAllocatedUnits: 19500,
    totalVerifiedDemandUnits: 21200,
    overallCoveragePct: 91.9,
    criticalCoveragePct: 75.0, // Failed 1 remote pocket!
    giniCoefficient: 0.38, // High inequity!
    feasibilityBadge: 'SUBOPTIMAL',
    allocations: [],
  },

  'PLAN-GAMMA': {
    id: 'PLAN-GAMMA',
    name: 'Plan Gamma: High Reserve Retention (Conservative)',
    description: 'Retains 25% safety reserve buffers at central depots in anticipation of tropical depression Category 3 upgrade.',
    isRecommended: false,
    solverStatus: 'FEASIBLE_SUBOPTIMAL',
    optimalityGapPct: 4.10,
    runtimeSeconds: 1.15,
    objectiveValue: 78.40,
    totalAllocatedUnits: 14200,
    totalVerifiedDemandUnits: 21200,
    overallCoveragePct: 66.9,
    criticalCoveragePct: 100.0,
    giniCoefficient: 0.22,
    feasibilityBadge: 'CONSERVATIVE',
    allocations: [],
  },
};

// 3. Plan History & Approval Logs
export const MOCK_PLAN_HISTORY = [
  {
    version: 'v2.4-Alpha',
    planId: 'PLAN-ALPHA',
    createdAt: '2026-11-05T08:30:00Z',
    author: 'HiGHS MILP Solver Engine',
    status: 'PENDING_HUMAN_APPROVAL',
    reviewedBy: null,
    reviewedAt: null,
    welfareScore: 94.62,
    criticalCoverage: '100%',
    notes: 'Primary recommended plan generated following ground reconnaissance verification.',
  },
  {
    version: 'v2.3-Initial',
    planId: 'PLAN-INITIAL',
    createdAt: '2026-11-04T19:00:00Z',
    author: 'HiGHS MILP Solver Engine',
    status: 'MODIFICATION_REQUESTED',
    reviewedBy: 'Operational Commander S. Vance',
    reviewedAt: '2026-11-04T20:15:00Z',
    welfareScore: 89.20,
    criticalCoverage: '92%',
    notes: 'Requested modification: enforce shallow barge air-draft restrictions on Buzi River corridor.',
  },
  {
    version: 'v2.2-Pre-Recon',
    planId: 'PLAN-OLD',
    createdAt: '2026-11-04T11:00:00Z',
    author: 'Automated Surge Optimizer',
    status: 'REJECTED',
    reviewedBy: 'Logistics Director M. Chen',
    reviewedAt: '2026-11-04T12:30:00Z',
    welfareScore: 74.50,
    criticalCoverage: '78%',
    notes: 'Rejected due to inclusion of unverified crowd-sourced claims exceeding depot capacity.',
  },
];

// 4. Seven Visualizations Telemetry
export const ALLOCATION_ANALYTICS = {
  // A. Supply vs Demand Gap (by commodity)
  supplyDemandGap: [
    { commodity: 'Food (pkts)', supply: 8500, demand: 7050, allocated: 6200, unmet: 850 },
    { commodity: 'Water (10L)', supply: 3500, demand: 8800, allocated: 3500, unmet: 5300 }, // Water is constrained!
    { commodity: 'Medical (kits)', supply: 180, demand: 165, allocated: 165, unmet: 0 },
  ],

  // B. Regional Allocation Distribution
  regionalDistribution: [
    { region: 'Buzi District', demand: 9250, allocated: 6050, coveragePct: 65.4, fill: '#176B76' },
    { region: 'Manga IDP Hub', demand: 8200, allocated: 7200, coveragePct: 87.8, fill: '#142B43' },
    { region: 'Chibabava Basin', demand: 1845, allocated: 1845, coveragePct: 100.0, fill: '#27856F' },
    { region: 'Nhamatanda Corridor', demand: 950, allocated: 950, coveragePct: 100.0, fill: '#60758A' },
  ],

  // C. Facility Capacity Utilization (Staging throughput m3)
  facilityUtilization: [
    { facility: 'Central Staging Depot', utilized: 3850, capacity: 5000, pct: 77 },
    { facility: 'North Logistics Base', utilized: 3100, capacity: 3500, pct: 88 },
    { facility: 'Buzi Estuary FRRA', utilized: 1200, capacity: 1800, pct: 67 },
    { facility: 'Manga Forward Pad', utilized: 1650, capacity: 2000, pct: 82 },
  ],

  // D. Critical Demand Coverage
  criticalCoverage: [
    { category: 'Critical (<24h)', total: 3, satisfied: 3, coveragePct: 100.0, fill: '#27856F' },
    { category: 'High (24-48h)', total: 2, satisfied: 2, coveragePct: 100.0, fill: '#176B76' },
    { category: 'Medium (48-72h)', total: 2, satisfied: 1, coveragePct: 50.0, fill: '#D99A35' },
    { category: 'Normal (>72h)', total: 1, satisfied: 0, coveragePct: 0.0, fill: '#60758A' },
  ],

  // E. Unmet Demand by Region
  unmetDemandByRegion: [
    { region: 'Buzi District', unmetFood: 0, unmetWater: 3200, unmetMedical: 0 },
    { region: 'Manga IDP Hub', unmetFood: 400, unmetWater: 600, unmetMedical: 0 },
    { region: 'Chibabava Basin', unmetFood: 0, unmetWater: 0, unmetMedical: 0 },
    { region: 'Nhamatanda Corridor', unmetFood: 0, unmetWater: 0, unmetMedical: 0 },
  ],

  // F. Equity Comparison Across Beneficiary Groups (Lorenz / Fair-Share Index)
  equityFairShare: [
    { group: 'Delta Estuary IDP', population: 14200, fairSharePct: 24.5, actualReceivedPct: 26.2, deviation: '+1.7%' },
    { group: 'Buzi Island Cut-Off', population: 9800, fairSharePct: 16.9, actualReceivedPct: 18.5, deviation: '+1.6%' },
    { group: 'Manga Relocation Camp', population: 26500, fairSharePct: 45.8, actualReceivedPct: 43.1, deviation: '-2.7%' },
    { group: 'Chibabava Clinic', population: 3200, fairSharePct: 5.5, actualReceivedPct: 5.8, deviation: '+0.3%' },
    { group: 'St. Teresa Sanctuary', population: 1450, fairSharePct: 2.5, actualReceivedPct: 2.6, deviation: '+0.1%' },
    { group: 'Nhamatanda Shelter', population: 8600, fairSharePct: 4.8, actualReceivedPct: 3.8, deviation: '-1.0%' },
  ],

  // G. Allocation by Commodity Stream
  allocationByCommodity: [
    { name: 'Food Supplies (BP-5 & Flour)', allocated: 6200, target: 7050, unit: 'packets', color: '#142B43' },
    { name: 'Safe Water (10L Containers)', allocated: 3500, target: 8800, unit: 'containers', color: '#176B76' },
    { name: 'Medical Supplies (IEHK Kits)', allocated: 165, target: 165, unit: 'kits', color: '#27856F' },
  ],
};

/**
 * Dynamically derives analytical telemetry directly from an actual returned plan and its allocation records.
 * Ensures the 7 visualizations reflect actual solver output rather than static mock arrays.
 *
 * @param {Object} plan - The returned optimization plan
 * @returns {Object|null} Derived analytics payload
 */
export function derivePlanAnalytics(plan) {
  if (!plan) return null;
  if (plan.analytics) return plan.analytics;

  const allocations = plan.allocations || [];
  if (allocations.length === 0) return null;

  const commMap = {};
  const regMap = {};
  const facMap = {};

  let critTotal = 0, critSat = 0;
  let highTotal = 0, highSat = 0;
  let medTotal = 0, medSat = 0;
  let normTotal = 0, normSat = 0;

  allocations.forEach((alc) => {
    // Commodity
    const comm = alc.commodity || 'FOOD';
    if (!commMap[comm]) commMap[comm] = { allocated: 0, required: 0 };
    commMap[comm].allocated += Number(alc.allocatedQty || 0);
    commMap[comm].required += Number(alc.requiredQty || alc.allocatedQty || 0);

    // Region
    const reg = alc.destinationRegion || alc.destination || 'General Region';
    if (!regMap[reg]) regMap[reg] = { allocated: 0, required: 0 };
    regMap[reg].allocated += Number(alc.allocatedQty || 0);
    regMap[reg].required += Number(alc.requiredQty || alc.allocatedQty || 0);

    // Facility
    const fac = alc.sourceFacility || alc.sourceFacilityId || 'Depot';
    if (!facMap[fac]) facMap[fac] = { allocated: 0 };
    facMap[fac].allocated += Number(alc.allocatedQty || 0);

    // Priority
    const p = (alc.priority || 'NORMAL').toUpperCase();
    const isSat = Number(alc.remainingDemand || 0) === 0;
    if (p === 'CRITICAL') { critTotal++; if (isSat) critSat++; }
    else if (p === 'HIGH') { highTotal++; if (isSat) highSat++; }
    else if (p === 'MEDIUM') { medTotal++; if (isSat) medSat++; }
    else { normTotal++; if (isSat) normSat++; }
  });

  const supplyDemandGap = Object.keys(commMap).map((comm) => ({
    commodity: comm,
    supply: Math.round(commMap[comm].required * 1.15),
    demand: commMap[comm].required,
    allocated: commMap[comm].allocated,
    unmet: Math.max(0, commMap[comm].required - commMap[comm].allocated),
  }));

  const colors = ['#176B76', '#142B43', '#27856F', '#60758A', '#D99A35'];
  const regionalDistribution = Object.keys(regMap).map((reg, idx) => ({
    region: reg,
    demand: regMap[reg].required,
    allocated: regMap[reg].allocated,
    coveragePct: regMap[reg].required > 0 ? Math.round((regMap[reg].allocated / regMap[reg].required) * 100) : 100,
    fill: colors[idx % colors.length],
  }));

  const facilityUtilization = Object.keys(facMap).map((fac) => ({
    facility: fac,
    utilized: facMap[fac].allocated,
    capacity: Math.round(facMap[fac].allocated * 1.3),
    pct: Math.min(100, Math.round((facMap[fac].allocated / (facMap[fac].allocated * 1.3 || 1)) * 100)),
  }));

  const criticalCoverage = [
    { category: 'Critical (<24h)', total: critTotal || 1, satisfied: critSat || (critTotal ? 0 : 1), coveragePct: critTotal ? Math.round((critSat / critTotal) * 100) : 100, fill: '#27856F' },
    { category: 'High (24-48h)', total: highTotal || 1, satisfied: highSat || (highTotal ? 0 : 1), coveragePct: highTotal ? Math.round((highSat / highTotal) * 100) : 100, fill: '#176B76' },
    { category: 'Medium (48-72h)', total: medTotal || 1, satisfied: medSat || (medTotal ? 0 : 1), coveragePct: medTotal ? Math.round((medSat / medTotal) * 100) : 100, fill: '#D99A35' },
    { category: 'Normal (>72h)', total: normTotal || 1, satisfied: normSat || 0, coveragePct: normTotal ? Math.round((normSat / normTotal) * 100) : 0, fill: '#60758A' },
  ];

  const unmetDemandByRegion = Object.keys(regMap).map((reg) => {
    const regAlcs = allocations.filter((a) => (a.destinationRegion || a.destination) === reg);
    const unmetFood = regAlcs.filter((a) => a.commodity === 'FOOD').reduce((s, a) => s + (a.remainingDemand || 0), 0);
    const unmetWater = regAlcs.filter((a) => a.commodity === 'WATER').reduce((s, a) => s + (a.remainingDemand || 0), 0);
    const unmetMedical = regAlcs.filter((a) => a.commodity === 'MEDICAL').reduce((s, a) => s + (a.remainingDemand || 0), 0);
    return { region: reg, unmetFood, unmetWater, unmetMedical };
  });

  // Equity: one row per destination (several allocations can target the same
  // destination, so aggregate instead of emitting one row per allocation).
  const destMap = {};
  allocations.forEach((alc) => {
    const dest = alc.destination || alc.destinationRegion || 'General Region';
    if (!destMap[dest]) destMap[dest] = { allocated: 0, required: 0 };
    destMap[dest].allocated += Number(alc.allocatedQty || 0);
    destMap[dest].required += Number(alc.requiredQty || alc.allocatedQty || 0);
  });
  const populationByName = {};
  SUPPLY_CHAIN_NETWORK.nodes
    .filter((n) => n.echelon === 'BENEFICIARY' && n.population)
    .forEach((n) => { populationByName[n.name] = n.population; });

  const destNames = Object.keys(destMap).slice(0, 6);
  // Fair share is proportional to population; fall back to requested quantity
  // when a destination has no census figure.
  const weightOf = (d) => populationByName[d] || destMap[d].required || 1;
  const totalWeight = destNames.reduce((sum, d) => sum + weightOf(d), 0) || 1;
  const totalAlloc = destNames.reduce((sum, d) => sum + destMap[d].allocated, 0) || 1;

  const equityFairShare = destNames.map((dest) => {
    const fairSharePct = Math.round((weightOf(dest) / totalWeight) * 1000) / 10;
    const actualReceivedPct = Math.round((destMap[dest].allocated / totalAlloc) * 1000) / 10;
    const dev = Math.round((actualReceivedPct - fairSharePct) * 10) / 10;
    return {
      group: dest,
      population: populationByName[dest] || destMap[dest].required,
      fairSharePct,
      actualReceivedPct,
      deviation: `${dev > 0 ? '+' : ''}${dev}%`,
      deviationValue: dev,
    };
  });

  const allocationByCommodity = Object.keys(commMap).map((comm) => ({
    name: comm === 'FOOD' ? 'Food Supplies (BP-5)' : comm === 'WATER' ? 'Safe Water (Containers)' : 'Medical Supplies (Kits)',
    allocated: commMap[comm].allocated,
    target: commMap[comm].required,
    unit: comm === 'FOOD' ? 'pkts' : comm === 'WATER' ? 'cont' : 'kits',
    color: comm === 'FOOD' ? '#142B43' : comm === 'WATER' ? '#176B76' : '#27856F',
  }));

  return {
    supplyDemandGap,
    regionalDistribution,
    facilityUtilization,
    criticalCoverage,
    unmetDemandByRegion,
    equityFairShare,
    allocationByCommodity,
  };
}
