/**
 * ResQNet Recovery Simulator Telemetry Data Module
 * Explicitly labeled as SIMULATED / DEMO.
 * Evaluates operational state transitions: S(t) + A(i) + E(t) -> S(t+1) -> O(i).
 */

// 1. Baseline Operational State S(t)
export const BASELINE_PLAN = {
  incidentId: 'INC-2026-0412',
  incidentName: 'Cyclone Idai II (Inundation & Estuary Surge)',
  planId: 'PLAN-ALPHA',
  planVersion: 'v2.4-Alpha',
  snapshotId: 'SNAP-2026-11-05-0830',
  planningPeriod: '72h Tactical Cycle',
  availableResources: 24000,
  verifiedDemand: 21200,
  plannedAllocations: 18350,
  operationalFacilitiesCount: 7,
  accessibleRoutesCount: 5,
  baselineUnmetDemand: 2850,
  criticalCoveragePct: 100.0,
  serviceEquityGini: 0.18,
  expectedCostUSD: 142000,
  status: 'BASELINE',
};

// 2. Disruption Scenario Templates E(t)
export const DISRUPTION_TEMPLATES = {
  FLOOD: {
    id: 'SCEN-FLOOD-01',
    category: 'FLOOD',
    name: 'Major Culvert Washout & Flash Riverine Inundation',
    description: 'Catastrophic rain surge causes culvert collapse on Highway rt-1 at km 42, severing main road transit to Buzi District.',
    parameters: [
      { id: 'p1', name: 'Route Disruption', target: 'Route rt-1 (Km 42 Culvert)', value: '100% Impassable (Washout)', severity: 'CRITICAL' },
      { id: 'p2', name: 'Bridge Submersion', target: 'Buzi River Main Crossing', value: 'Water Level +2.4m Above Deck', severity: 'CRITICAL' },
      { id: 'p3', name: 'Warehouse Flooding', target: 'CSD-01 Staging Bay A-04', value: '1,200 Food pkts Damaged / Unusable', severity: 'HIGH' },
      { id: 'p4', name: 'Isolated Populations', target: 'Delta Estuary & Buzi Island', value: 'Cut off from wheeled truck transit', severity: 'CRITICAL' },
      { id: 'p5', name: 'Transport Capacity Loss', target: 'Regional Heavy Truck Fleet', value: '-60% Throughput on southern corridor', severity: 'HIGH' },
    ],
    durationHours: 48,
    estimatedUnmetSurge: 4650,
  },
  CONFLICT: {
    id: 'SCEN-CONFLICT-02',
    category: 'ARMED_CONFLICT',
    name: 'Corridor Security Interruption & Perimeter Blockade',
    description: 'Security forces establish checkpoint exclusion zones along Route rt-3, preventing commercial transport movement.',
    parameters: [
      { id: 'p1', name: 'Facility Inaccessibility', target: 'North Logistics Base (NLB-02)', value: 'Security Perimeter Lockdown (0 dispatch)', severity: 'CRITICAL' },
      { id: 'p2', name: 'Route Restriction', target: 'Route rt-3 Highway Corridor', value: 'Checkpoints Require UN Military Escort', severity: 'HIGH' },
      { id: 'p3', name: 'Supplier Interruption', target: 'Beira Agro-Milling (SUP-01)', value: 'Terminal Grid Power Outage', severity: 'MEDIUM' },
      { id: 'p4', name: 'Displacement Demand Surge', target: 'Manga Camp Relocation Center', value: '+5,000 Newly Arrived IDPs', severity: 'CRITICAL' },
    ],
    durationHours: 72,
    estimatedUnmetSurge: 6800,
  },
  PANDEMIC: {
    id: 'SCEN-PANDEMIC-03',
    category: 'PANDEMIC',
    name: 'Acute Waterborne Cholera Outbreak & Cold-Chain Failure',
    description: 'Spike in cholera cases triggers sudden demand surge for rehydration salts while vaccine depot experiences cold-chain excursion.',
    parameters: [
      { id: 'p1', name: 'Acute Demand Surge', target: 'ORS & Cholera Treatment Packs', value: '+250% Demand Spike (120 -> 420 kits)', severity: 'CRITICAL' },
      { id: 'p2', name: 'Potable Water Surge', target: 'Safe Water 10L Containers', value: '+180% Demand in Unsanitary Pockets', severity: 'CRITICAL' },
      { id: 'p3', name: 'Facility Staff Quarantine', target: 'Central Staging Depot', value: '-35% Workforce In Quarantine', severity: 'HIGH' },
      { id: 'p4', name: 'Cold-Chain Failure', target: 'Refrigerated Storage Room C-01', value: '+12.5°C Excursion Breach (Vaccines Locked)', severity: 'CRITICAL' },
    ],
    durationHours: 36,
    estimatedUnmetSurge: 5200,
  },
};

// 3. Before-and-After Network Topology States (Baseline vs Disrupted vs Recovered)
export const NETWORK_STATES = {
  BASELINE: {
    label: 'BASELINE NETWORK',
    statusVariant: 'success',
    description: 'Nominal operational state. All 5 transport corridors open, all 7 staging nodes functional.',
    nodes: [
      { id: 'SUP-01', name: 'Beira Port Terminal', state: 'OPERATIONAL' },
      { id: 'CSD-01', name: 'Central Depot', state: 'OPERATIONAL' },
      { id: 'NLB-02', name: 'North Logistics Base', state: 'OPERATIONAL' },
      { id: 'FRRA-01', name: 'Buzi Estuary FRRA', state: 'OPERATIONAL' },
      { id: 'FRRA-02', name: 'Manga Highway Pad', state: 'OPERATIONAL' },
      { id: 'BEN-01', name: 'Delta Estuary IDP', state: 'SUPPLIED' },
      { id: 'BEN-02', name: 'Buzi Cut-Off Island', state: 'SUPPLIED' },
      { id: 'BEN-03', name: 'Manga Relocation Camp', state: 'SUPPLIED' },
    ],
    connections: [
      { from: 'SUP-01', to: 'CSD-01', state: 'NORMAL', throughput: '100%' },
      { from: 'CSD-01', to: 'FRRA-01', state: 'NORMAL', throughput: '100%' },
      { from: 'CSD-01', to: 'FRRA-02', state: 'NORMAL', throughput: '100%' },
      { from: 'FRRA-01', to: 'BEN-01', state: 'NORMAL', throughput: '100%' },
      { from: 'FRRA-01', to: 'BEN-02', state: 'NORMAL', throughput: '100%' },
      { from: 'FRRA-02', to: 'BEN-03', state: 'NORMAL', throughput: '100%' },
    ],
  },
  DISRUPTED: {
    label: 'DISRUPTED NETWORK STATE',
    statusVariant: 'critical',
    description: 'Culvert washout at km 42 severs Route rt-1. FRRA-01 and isolated communities cut off from road supply.',
    nodes: [
      { id: 'SUP-01', name: 'Beira Port Terminal', state: 'OPERATIONAL' },
      { id: 'CSD-01', name: 'Central Depot', state: 'PARTIALLY_FLOODED' },
      { id: 'NLB-02', name: 'North Logistics Base', state: 'ISOLATED' },
      { id: 'FRRA-01', name: 'Buzi Estuary FRRA', state: 'CUT_OFF' },
      { id: 'FRRA-02', name: 'Manga Highway Pad', state: 'OPERATIONAL' },
      { id: 'BEN-01', name: 'Delta Estuary IDP', state: 'STARVED_DEFICIT' },
      { id: 'BEN-02', name: 'Buzi Cut-Off Island', state: 'STARVED_DEFICIT' },
      { id: 'BEN-03', name: 'Manga Relocation Camp', state: 'CONSTRAINED' },
    ],
    connections: [
      { from: 'SUP-01', to: 'CSD-01', state: 'NORMAL', throughput: '100%' },
      { from: 'CSD-01', to: 'FRRA-01', state: 'SEVERED_WASHOUT', throughput: '0% (BLOCKED)' },
      { from: 'CSD-01', to: 'FRRA-02', state: 'NORMAL', throughput: '100%' },
      { from: 'FRRA-01', to: 'BEN-01', state: 'CRITICAL_DEFICIT', throughput: '15%' },
      { from: 'FRRA-01', to: 'BEN-02', state: 'CRITICAL_DEFICIT', throughput: '0%' },
      { from: 'FRRA-02', to: 'BEN-03', state: 'NORMAL', throughput: '85%' },
    ],
  },
  RECOVERED: {
    label: 'PROPOSED RECOVERED NETWORK',
    statusVariant: 'teal',
    description: 'Shallow-draft river barge flotilla and Mi-8 helicopter winch activated. Bypasses km 42 washout.',
    nodes: [
      { id: 'SUP-01', name: 'Beira Port Terminal', state: 'OPERATIONAL' },
      { id: 'CSD-01', name: 'Central Depot', state: 'RECONFIGURED' },
      { id: 'NLB-02', name: 'North Logistics Base', state: 'REROUTED' },
      { id: 'FRRA-01', name: 'Buzi Estuary FRRA', state: 'BARGE_CONNECTED' },
      { id: 'FRRA-02', name: 'Manga Highway Pad', state: 'OPERATIONAL' },
      { id: 'BEN-01', name: 'Delta Estuary IDP', state: 'RESTORED' },
      { id: 'BEN-02', name: 'Buzi Cut-Off Island', state: 'AIR_RESTORED' },
      { id: 'BEN-03', name: 'Manga Relocation Camp', state: 'RESTORED' },
    ],
    connections: [
      { from: 'SUP-01', to: 'CSD-01', state: 'NORMAL', throughput: '100%' },
      { from: 'CSD-01', to: 'FRRA-01', state: 'BARGE_BYPASS_ACTIVATED', throughput: '90% (VIA WATERWAY)' },
      { from: 'CSD-01', to: 'FRRA-02', state: 'NORMAL', throughput: '100%' },
      { from: 'FRRA-01', to: 'BEN-01', state: 'AMPHIBIOUS_RESTORED', throughput: '100%' },
      { from: 'CSD-01', to: 'BEN-02', state: 'AIR_SLING_RESTORED', throughput: '100% (HELICOPTER)' },
      { from: 'FRRA-02', to: 'BEN-03', state: 'NORMAL', throughput: '95%' },
    ],
  },
};

// 4. Candidate Recovery Strategies A(i)
export const MOCK_RECOVERY_STRATEGIES = [
  {
    id: 'STRAT-ALPHA',
    name: 'Strategy Alpha: River Barge Flotilla & Aerial Winch Surge',
    description: 'Mobilizes 2 shallow-draft river barges and Mi-8 helicopter cargo sling to bypass submerged roads.',
    isRecommended: true,
    feasibility: 'FEASIBLE',
    riskLevel: 'LOW',
    criticalCoveragePct: 100.0,
    remainingUnmetDemand: 650, // Down from 4,650 in disrupted state!
    worstNormalizedShortagePct: 4.8,
    serviceEquityGini: 0.19,
    expectedRecoveryTimeHours: 14.5,
    resourceWastageUnits: 45,
    operatingCostUSD: 184500,
    costDeltaUSD: '+42,500',
    timeDeltaHours: '+6.5h vs Baseline',
    actionsApplied: [
      'Alternative Route: Buzi River Estuary Waterway Corridor',
      'Vehicle Reassignment: 2 Shallow-Draft Barges + 1 Mi-8 Cargo Helicopter',
      'Inter-Facility Transfer: 1,800 Water Containers NLB-02 -> CSD-01',
      'Shipment Splitting: 50% Immediate Air Triage, 50% Barge Follow-up',
    ],
  },
  {
    id: 'STRAT-BETA',
    name: 'Strategy Beta: High-Ground Northern Road Convoy Detour',
    description: 'Diverts heavy 10-ton truck convoys through unflooded Northern highland routes, avoiding water transport entirely.',
    isRecommended: false,
    feasibility: 'FEASIBLE',
    riskLevel: 'MEDIUM',
    criticalCoveragePct: 78.5, // Fails isolated Buzi Island community!
    remainingUnmetDemand: 2450,
    worstNormalizedShortagePct: 35.2,
    serviceEquityGini: 0.36,
    expectedRecoveryTimeHours: 28.0,
    resourceWastageUnits: 120,
    operatingCostUSD: 161000,
    costDeltaUSD: '+19,000',
    timeDeltaHours: '+20.0h Detour',
    actionsApplied: [
      'Alternative Route: North Highland Unpaved Bypass (+115 km)',
      'Vehicle Reassignment: Reassign 8 Trucks to Convoy Detour',
      'Demand Reprioritization: Defer Island delivery until waters recede',
    ],
  },
  {
    id: 'STRAT-GAMMA',
    name: 'Strategy Gamma: Aggressive Demand Triage & Local Voucher Sourcing',
    description: 'Authorizes emergency local market vendor procurement and temporary reduction of ration caloric targets.',
    isRecommended: false,
    feasibility: 'CONSTRAINED',
    riskLevel: 'HIGH',
    criticalCoveragePct: 92.0,
    remainingUnmetDemand: 1800,
    worstNormalizedShortagePct: 18.0,
    serviceEquityGini: 0.28,
    expectedRecoveryTimeHours: 19.5,
    resourceWastageUnits: 15,
    operatingCostUSD: 198000,
    costDeltaUSD: '+56,000',
    timeDeltaHours: '+11.5h Intake',
    actionsApplied: [
      'Emergency Procurement: Local Beira grain milling cash vouchers',
      'Approved Demand Reprioritization: Caloric intake reduced to 1,800 kcal/day',
      'Facility Activation: Emergency Staging Hub C',
    ],
  },
];

// 5. Eight Advanced Recovery Analytics Datasets
export const RECOVERY_ANALYTICS = {
  // A. Strategy Comparison Bar Chart (Metrics Comparison)
  strategyComparison: [
    { metric: 'Critical Coverage (%)', baseline: 100, disrupted: 42, stratAlpha: 100, stratBeta: 78, stratGamma: 92 },
    { metric: 'Equity Index (1-Gini %)', baseline: 82, disrupted: 45, stratAlpha: 81, stratBeta: 64, stratGamma: 72 },
    { metric: 'Recovery Speed (%)', baseline: 100, disrupted: 20, stratAlpha: 82, stratBeta: 52, stratGamma: 74 },
  ],

  // B. Monte Carlo Outcome Distribution (500 runs histogram of service levels)
  monteCarloDistribution: [
    { bin: '40-50% (Catastrophic)', runsDisrupted: 285, runsAlpha: 0, runsBeta: 42 },
    { bin: '50-60%', runsDisrupted: 145, runsAlpha: 0, runsBeta: 68 },
    { bin: '60-70%', runsDisrupted: 55, runsAlpha: 12, runsBeta: 140 },
    { bin: '70-80%', runsDisrupted: 15, runsAlpha: 48, runsBeta: 165 },
    { bin: '80-90% (Good)', runsDisrupted: 0, runsAlpha: 195, runsBeta: 75 },
    { bin: '90-100% (Optimal)', runsDisrupted: 0, runsAlpha: 245, runsBeta: 10 },
  ],

  // C. Recovery-Time Distribution (Boxplot ranges in hours)
  recoveryTimeDistribution: [
    { strategy: 'Disrupted (No Action)', min: 72, q1: 85, median: 96, q3: 120, max: 144 },
    { strategy: 'Strat Alpha (Barge/Air)', min: 10, q1: 12, median: 14.5, q3: 18, max: 24 },
    { strategy: 'Strat Beta (Detour)', min: 20, q1: 24, median: 28, q3: 36, max: 48 },
    { strategy: 'Strat Gamma (Triage)', min: 14, q1: 16, median: 19.5, q3: 26, max: 32 },
  ],

  // D. Shortage Distribution by Beneficiary Group
  shortageDistribution: [
    { group: 'Delta Estuary IDP', disruptedShortage: 1450, recoveredShortage: 0, unit: 'pkts' },
    { group: 'Buzi Cut-Off Island', disruptedShortage: 2800, recoveredShortage: 0, unit: 'containers' },
    { group: 'Manga Relocation Camp', disruptedShortage: 1800, recoveredShortage: 400, unit: 'pkts' },
    { group: 'Chibabava Clinic', disruptedShortage: 30, recoveredShortage: 0, unit: 'kits' },
  ],

  // E. CVaR (Conditional Value-at-Risk at 95% Confidence Level)
  cvarComparison: [
    { strategy: 'Disrupted State', expectedLoss: 4650, cvar95: 5850, riskTier: 'HIGH_RISK' },
    { strategy: 'Strategy Alpha', expectedLoss: 650, cvar95: 890, riskTier: 'LOW_RISK' },
    { strategy: 'Strategy Beta', expectedLoss: 2450, cvar95: 3400, riskTier: 'MEDIUM_RISK' },
    { strategy: 'Strategy Gamma', expectedLoss: 1800, cvar95: 2350, riskTier: 'MEDIUM_RISK' },
  ],

  // F. Scenario Performance Comparison (Flood vs Conflict vs Pandemic under Strat Alpha)
  scenarioComparison: [
    { scenario: 'Flood (Km 42 Washout)', demandCoverage: 96.5, recoveryHours: 14.5, costUSD: 184500 },
    { scenario: 'Armed Conflict (Checkpoints)', demandCoverage: 88.0, recoveryHours: 24.0, costUSD: 215000 },
    { scenario: 'Pandemic (Cholera Outbreak)', demandCoverage: 92.5, recoveryHours: 18.0, costUSD: 195000 },
  ],

  // G. Recovery Timeline Restoration Progression (Hours 0 to 72)
  recoveryTimeline: [
    { hour: '0h', baseline: 100, disrupted: 38, stratAlpha: 38, stratBeta: 38 },
    { hour: '8h', baseline: 100, disrupted: 38, stratAlpha: 55, stratBeta: 42 },
    { hour: '16h', baseline: 100, disrupted: 38, stratAlpha: 88, stratBeta: 54 },
    { hour: '24h', baseline: 100, disrupted: 38, stratAlpha: 96, stratBeta: 72 },
    { hour: '48h', baseline: 100, disrupted: 38, stratAlpha: 98, stratBeta: 82 },
    { hour: '72h', baseline: 100, disrupted: 38, stratAlpha: 100, stratBeta: 88 },
  ],

  // H. Resource Utilization After Recovery Actions
  resourceUtilizationAfterRecovery: [
    { asset: 'Central Depot Capacity', before: 77, after: 84, unit: '% space' },
    { asset: 'River Barge Flotilla', before: 0, after: 92, unit: '% fleet' },
    { asset: 'Helicopter Winch Cargo', before: 0, after: 75, unit: '% hours' },
    { asset: 'Highway Truck Fleet', before: 80, after: 65, unit: '% fleet' },
  ],
};
