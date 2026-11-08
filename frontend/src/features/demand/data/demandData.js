/**
 * ResQNet Demand & Beneficiaries Telemetry Data Module
 * Demonstrates strict unit separation (packets, containers 10L, kits),
 * distinction between reported, verified, disputed, and fulfilled demand,
 * aggregated demographic privacy, and geographical distress intelligence.
 * All records labeled as SIMULATED.
 */

// 1. Registered Beneficiary Groups (Aggregated & Anonymized Demographics)
export const MOCK_BENEFICIARY_GROUPS = [
  {
    id: 'GRP-01',
    code: 'CAMP-DELTA',
    name: 'Delta Estuary Evacuation Settlement',
    region: 'Buzi District',
    coordinates: [-19.789, 34.821],
    category: 'IDP Camp',
    population: 14200,
    households: 2840,
    vulnerabilities: {
      underFivePercent: 42,
      pregnantLactatingPercent: 28,
      elderlyDisabledPercent: 15,
      waterborneDiseaseRisk: 'CRITICAL',
    },
    focalPoint: 'Community Elder Council & Red Cross Volunteer Team',
    status: 'ACTIVE_ASSISTANCE_REQUIRED',
    accessCondition: 'Waterway / Shallow Barge Only (Road Submerged)',
    isSimulated: true,
  },
  {
    id: 'GRP-02',
    code: 'CAMP-MANGA',
    name: 'Manga Camp Rapid Relocation Center',
    region: 'Manga IDP Hub',
    coordinates: [-19.835, 34.882],
    category: 'IDP Camp',
    population: 26500,
    households: 5300,
    vulnerabilities: {
      underFivePercent: 38,
      pregnantLactatingPercent: 24,
      elderlyDisabledPercent: 18,
      waterborneDiseaseRisk: 'HIGH',
    },
    focalPoint: 'UNHCR Site Management Camp Committee',
    status: 'ACTIVE_ASSISTANCE_REQUIRED',
    accessCondition: 'Heavy Truck Accessible with Military Escort',
    isSimulated: true,
  },
  {
    id: 'GRP-03',
    code: 'COMM-ISLAND',
    name: 'Buzi Island Cut-Off Community',
    region: 'Buzi District',
    coordinates: [-19.865, 34.745],
    category: 'Isolated Rural Community',
    population: 9800,
    households: 1960,
    vulnerabilities: {
      underFivePercent: 45,
      pregnantLactatingPercent: 30,
      elderlyDisabledPercent: 22,
      waterborneDiseaseRisk: 'ACUTE_CHOLERA_OUTBREAK',
    },
    focalPoint: 'Village Administration Liaison Unit',
    status: 'CRITICAL_EMERGENCY',
    accessCondition: 'Air-Drop or Helicopter Winch Only',
    isSimulated: true,
  },
  {
    id: 'GRP-04',
    code: 'CLINIC-CENTRAL',
    name: 'Chibabava Field Triage Clinic & Maternity Ward',
    region: 'Chibabava Basin',
    coordinates: [-19.715, 34.690],
    category: 'Health Facility / Hospital Cluster',
    population: 3200, // Patient & caregiver census
    households: 640,
    vulnerabilities: {
      underFivePercent: 55,
      pregnantLactatingPercent: 40,
      elderlyDisabledPercent: 30,
      waterborneDiseaseRisk: 'HIGH',
    },
    focalPoint: 'MSF Field Medical Director',
    status: 'ACTIVE_ASSISTANCE_REQUIRED',
    accessCondition: '4WD Vehicle Accessible via North Bypass',
    isSimulated: true,
  },
  {
    id: 'GRP-05',
    code: 'SHELTER-NORTH',
    name: 'Nhamatanda Highland Collective Shelter',
    region: 'Nhamatanda Corridor',
    coordinates: [-19.680, 34.550],
    category: 'Transit Center / Communal Shelter',
    population: 8600,
    households: 1720,
    vulnerabilities: {
      underFivePercent: 32,
      pregnantLactatingPercent: 20,
      elderlyDisabledPercent: 14,
      waterborneDiseaseRisk: 'MODERATE',
    },
    focalPoint: 'District Social Action Institute (INAS)',
    status: 'STABLE_MONITORING',
    accessCondition: 'Paved Highway Route Open',
    isSimulated: true,
  },
  {
    id: 'GRP-06',
    code: 'ORPHAN-SECTOR4',
    name: 'St. Teresa Vulnerable Children & Elderly Sanctuary',
    region: 'Manga IDP Hub',
    coordinates: [-19.810, 34.850],
    category: 'Vulnerable Care Sanctuary',
    population: 1450,
    households: 290,
    vulnerabilities: {
      underFivePercent: 60,
      pregnantLactatingPercent: 10,
      elderlyDisabledPercent: 40,
      waterborneDiseaseRisk: 'MODERATE',
    },
    focalPoint: 'Missionary Logistics Coordinator',
    status: 'ACTIVE_ASSISTANCE_REQUIRED',
    accessCondition: 'Urban Secondary Road Passable',
    isSimulated: true,
  },
];

// 2. Master Demand Requirements (Simulated Distress Requests)
export const MOCK_DEMAND_ITEMS = [
  {
    id: 'DEM-2026-081',
    incidentId: 'INC-2026-0412',
    region: 'Buzi District',
    location: 'Delta Estuary Evacuation Settlement (Sector 2)',
    coordinates: [-19.789, 34.821],
    beneficiaryGroupId: 'GRP-01',
    beneficiaryGroup: 'Delta Estuary Evacuation Settlement',
    commodity: 'FOOD',
    item: 'High-Energy Emergency Food Biscuits (BP-5)',
    quantity: 1450,
    fulfilledQuantity: 450,
    remainingQuantity: 1000,
    unit: 'packets',
    priority: 'CRITICAL',
    requiredByDate: '2026-11-06',
    reportingSource: 'UNICEF Rapid Needs Assessment Field Team',
    verificationStatus: 'VERIFIED',
    verificationDetails: {
      verifiedBy: 'Dr. Kwame Mensah (UNICEF WASH/Nutrition Lead)',
      verifiedAt: '2026-11-04T14:30:00Z',
      evidenceRef: 'EVID-UNICEF-RNA-2026-092',
      evidenceType: 'Ground Survey & Malnutrition Screening',
      notes: '1,450 children screened MUAC < 115mm (SAM). 450 issued from interim buffer.',
    },
    notes: 'Access via barge only. Stockout imminent within 18 hours.',
    isSimulated: true,
  },
  {
    id: 'DEM-2026-082',
    incidentId: 'INC-2026-0412',
    region: 'Buzi District',
    location: 'Buzi Island Cut-Off Community',
    coordinates: [-19.865, 34.745],
    beneficiaryGroupId: 'GRP-03',
    beneficiaryGroup: 'Buzi Island Cut-Off Community',
    commodity: 'WATER',
    item: 'Emergency Potable Water (10L Sealed Containers)',
    quantity: 2800,
    fulfilledQuantity: 600,
    remainingQuantity: 2200,
    unit: 'containers',
    priority: 'CRITICAL',
    requiredByDate: '2026-11-06',
    reportingSource: 'Local Community Leader Satellite Phone Dispatch',
    verificationStatus: 'VERIFIED',
    verificationDetails: {
      verifiedBy: 'Cap. Elena Rostova (UN OCHA Civil-Military Coordination)',
      verifiedAt: '2026-11-04T16:00:00Z',
      evidenceRef: 'AERIAL-SAT-RADAR-PASS-441',
      evidenceType: 'Copernicus SAR Flood Inundation Analysis',
      notes: 'Confirmed 100% surface water contaminated by flood silt. Extreme dehydration hazard.',
    },
    notes: 'Drop-zone coordinates cleared for Mi-8 helicopter cargo sling.',
    isSimulated: true,
  },
  {
    id: 'DEM-2026-083',
    incidentId: 'INC-2026-0412',
    region: 'Chibabava Basin',
    location: 'Chibabava Field Triage Clinic & Maternity Ward',
    coordinates: [-19.715, 34.690],
    beneficiaryGroupId: 'GRP-04',
    beneficiaryGroup: 'Chibabava Field Triage Clinic',
    commodity: 'MEDICAL',
    item: 'Inter-Agency Emergency Health Kits (IEHK Basic 2024)',
    quantity: 45,
    fulfilledQuantity: 15,
    remainingQuantity: 30,
    unit: 'kits',
    priority: 'CRITICAL',
    requiredByDate: '2026-11-05',
    reportingSource: 'MSF Field Hospital Medical Officer',
    verificationStatus: 'VERIFIED',
    verificationDetails: {
      verifiedBy: 'Dr. Sarah Al-Mansoor (WHO Health Cluster Coordinator)',
      verifiedAt: '2026-11-04T11:15:00Z',
      evidenceRef: 'WHO-EPI-SURV-CHIB-08',
      evidenceType: 'Clinical Epidemic Triage Census',
      notes: '18 acute trauma lacerations and 12 post-partum sepsis treatments awaiting sterile supplies.',
    },
    notes: 'Cold chain storage required for 5 vaccine modules included in kit.',
    isSimulated: true,
  },
  {
    id: 'DEM-2026-084',
    incidentId: 'INC-2026-0412',
    region: 'Manga IDP Hub',
    location: 'Manga Camp Rapid Relocation Center (Sector 4)',
    coordinates: [-19.835, 34.882],
    beneficiaryGroupId: 'GRP-02',
    beneficiaryGroup: 'Manga Camp Rapid Relocation Center',
    commodity: 'WATER',
    item: 'Water Purification Tablets (Aquatabs 67mg / 1000s)',
    quantity: 4200,
    fulfilledQuantity: 2800,
    remainingQuantity: 1400,
    unit: 'containers',
    priority: 'HIGH',
    requiredByDate: '2026-11-07',
    reportingSource: 'District Water & Sanitation Directorate (DAS)',
    verificationStatus: 'VERIFIED',
    verificationDetails: {
      verifiedBy: 'Eng. Manuel Da Silva (National WASH Directorate)',
      verifiedAt: '2026-11-03T09:40:00Z',
      evidenceRef: 'WASH-INSP-REP-2026-1102',
      evidenceType: 'Ground Water Quality Turbidity Test',
      notes: 'Confirmed turbidity > 15 NTU. Chemical disinfection mandatory before human consumption.',
    },
    notes: 'Road corridor passable for 10-ton flatbed convoy.',
    isSimulated: true,
  },
  {
    id: 'DEM-2026-085',
    incidentId: 'INC-2026-0412',
    region: 'Manga IDP Hub',
    location: 'Manga Camp Rapid Relocation Center (Sector 1)',
    coordinates: [-19.835, 34.882],
    beneficiaryGroupId: 'GRP-02',
    beneficiaryGroup: 'Manga Camp Rapid Relocation Center',
    commodity: 'FOOD',
    item: 'Fortified Maize Flour (Super Cereal Plus)',
    quantity: 3200,
    fulfilledQuantity: 1800,
    remainingQuantity: 1400,
    unit: 'packets',
    priority: 'HIGH',
    requiredByDate: '2026-11-08',
    reportingSource: 'WFP Site Logistics Partner (World Vision)',
    verificationStatus: 'VERIFIED',
    verificationDetails: {
      verifiedBy: 'S. Vance (WFP Senior Logistics Officer)',
      verifiedAt: '2026-11-03T15:20:00Z',
      evidenceRef: 'WFP-DIST-ROSTER-SEC1',
      evidenceType: 'Biometric Household Registration Roster',
      notes: '1,800 families verified for second distribution tranche.',
    },
    notes: 'Palletized storage available at Manga Logistics Staging Tent.',
    isSimulated: true,
  },
  {
    id: 'DEM-2026-086',
    incidentId: 'INC-2026-0412',
    region: 'Nhamatanda Corridor',
    location: 'Nhamatanda Highland Collective Shelter',
    coordinates: [-19.680, 34.550],
    beneficiaryGroupId: 'GRP-05',
    beneficiaryGroup: 'Nhamatanda Highland Shelter',
    commodity: 'FOOD',
    item: 'Therapeutic Food Paste (Plumpy Sup RUSF)',
    quantity: 950,
    fulfilledQuantity: 950,
    remainingQuantity: 0,
    unit: 'packets',
    priority: 'MEDIUM',
    requiredByDate: '2026-11-09',
    reportingSource: 'INAS Provincial Social Action Inspector',
    verificationStatus: 'VERIFIED',
    verificationDetails: {
      verifiedBy: 'Ana Macamo (Provincial Social Welfare Lead)',
      verifiedAt: '2026-11-02T13:00:00Z',
      evidenceRef: 'INAS-NUTR-SURV-994',
      evidenceType: 'Clinic Weigh-in Records',
      notes: '100% fulfilled via Convoy CNV-2026-041 on 2026-11-03.',
    },
    notes: 'Fulfilled. Monitoring for next distribution cycle.',
    isSimulated: true,
  },
  {
    id: 'DEM-2026-087',
    incidentId: 'INC-2026-0412',
    region: 'Buzi District',
    location: 'Munhava Flood Inundation Pocket',
    coordinates: [-19.815, 34.790],
    beneficiaryGroupId: 'GRP-01',
    beneficiaryGroup: 'Delta Estuary Evacuation Settlement',
    commodity: 'MEDICAL',
    item: 'Cholera Rapid Rehydration & ORS Treatment Packs',
    quantity: 120,
    fulfilledQuantity: 0,
    remainingQuantity: 120,
    unit: 'kits',
    priority: 'CRITICAL',
    requiredByDate: '2026-11-05',
    reportingSource: 'Red Cross Community Health Scout SMS Alert',
    verificationStatus: 'PENDING',
    verificationDetails: {
      verifiedBy: null,
      verifiedAt: null,
      evidenceRef: 'SMS-DISTRESS-ALERT-#991',
      evidenceType: 'Community Crowd-Sourced SMS Alert',
      notes: 'Awaiting field reconnaissance triage by WHO Epidemiologist. Unconfirmed cluster of 14 cases.',
    },
    notes: 'Do not allocate until verified by WHO field team.',
    isSimulated: true,
  },
  {
    id: 'DEM-2026-088',
    incidentId: 'INC-2026-0412',
    region: 'Chibabava Basin',
    location: 'Chibabava South Valley Isolated Households',
    coordinates: [-19.740, 34.660],
    beneficiaryGroupId: 'GRP-04',
    beneficiaryGroup: 'Chibabava Field Triage Clinic',
    commodity: 'WATER',
    item: 'Emergency Potable Water (10L Sealed Containers)',
    quantity: 1800,
    fulfilledQuantity: 0,
    remainingQuantity: 1800,
    unit: 'containers',
    priority: 'HIGH',
    requiredByDate: '2026-11-07',
    reportingSource: 'Local Radio Broadcast & Civil Protection Volunteer',
    verificationStatus: 'PENDING',
    verificationDetails: {
      verifiedBy: null,
      verifiedAt: null,
      evidenceRef: 'CVP-RAD-LOG-2026-04',
      evidenceType: 'Civil Protection Radio Report',
      notes: 'Road access washed out. Aerial drone verification scheduled for 14:00 UTC.',
    },
    notes: 'Requires drone or UAV reconnaissance to confirm population density.',
    isSimulated: true,
  },
  {
    id: 'DEM-2026-089',
    incidentId: 'INC-2026-0412',
    region: 'Manga IDP Hub',
    location: 'St. Teresa Sanctuary Sector 4',
    coordinates: [-19.810, 34.850],
    beneficiaryGroupId: 'GRP-06',
    beneficiaryGroup: 'St. Teresa Vulnerable Care Sanctuary',
    commodity: 'FOOD',
    item: 'High-Energy Emergency Food Biscuits (BP-5)',
    quantity: 800,
    fulfilledQuantity: 400,
    remainingQuantity: 400,
    unit: 'packets',
    priority: 'MEDIUM',
    requiredByDate: '2026-11-09',
    reportingSource: 'Diocese Humanitarian Aid Office',
    verificationStatus: 'VERIFIED',
    verificationDetails: {
      verifiedBy: 'Sister Maria Teresa (Sanctuary Administrator)',
      verifiedAt: '2026-11-03T10:00:00Z',
      evidenceRef: 'DIOC-REC-2026-11',
      evidenceType: 'Resident Census Register',
      notes: '1,450 orphans and elderly residents verified.',
    },
    notes: 'Partial delivery completed. Second half requested before weekend.',
    isSimulated: true,
  },
  {
    id: 'DEM-2026-090',
    incidentId: 'INC-2026-0412',
    region: 'Buzi District',
    location: 'Upper Buzi River Settlement Zone 3',
    coordinates: [-19.840, 34.720],
    beneficiaryGroupId: 'GRP-03',
    beneficiaryGroup: 'Buzi Island Cut-Off Community',
    commodity: 'FOOD',
    item: 'Fortified Maize Flour (Super Cereal Plus)',
    quantity: 5000,
    fulfilledQuantity: 0,
    remainingQuantity: 5000,
    unit: 'packets',
    priority: 'HIGH',
    requiredByDate: '2026-11-08',
    reportingSource: 'Commercial Transporter Route Claim',
    verificationStatus: 'DISPUTED',
    verificationDetails: {
      verifiedBy: 'S. Vance (WFP Senior Logistics Officer)',
      verifiedAt: '2026-11-04T12:00:00Z',
      evidenceRef: 'DISPUTE-DUPL-CLAIM-#120',
      evidenceType: 'Cross-Agency Roster Comparison',
      notes: 'Disputed: Suspected duplicate request overlapping with DEM-2026-081. Commercial vendor reported 5,000 pkts but community head confirmed only 1,200 households.',
    },
    notes: 'Blocked from automated allocation until joint recount.',
    isSimulated: true,
  },
  {
    id: 'DEM-2026-091',
    incidentId: 'INC-2026-0412',
    region: 'Nhamatanda Corridor',
    location: 'Nhamatanda Rural Outpost K-12',
    coordinates: [-19.650, 34.520],
    beneficiaryGroupId: 'GRP-05',
    beneficiaryGroup: 'Nhamatanda Highland Shelter',
    commodity: 'WATER',
    item: 'Emergency Potable Water (10L Sealed Containers)',
    quantity: 3500,
    fulfilledQuantity: 0,
    remainingQuantity: 0,
    unit: 'containers',
    priority: 'NORMAL',
    requiredByDate: '2026-11-12',
    reportingSource: 'Commercial Bottler Sales Agent',
    verificationStatus: 'REJECTED',
    verificationDetails: {
      verifiedBy: 'District Water Inspector J. Tembe',
      verifiedAt: '2026-11-03T16:45:00Z',
      evidenceRef: 'REJ-COMM-WTR-04',
      evidenceType: 'Direct Hydrogeology Well Audit',
      notes: 'Rejected: Local municipal gravity-fed borehole remains fully operational with 0 NTU turbidity. Commercial water not required.',
    },
    notes: 'Rejected from humanitarian pipeline.',
    isSimulated: true,
  },
];

/**
 * Filtered helper computing KPIs and Analytics for selected region, commodity, and verification status
 */
export function getDemandModuleData(regionFilter = 'ALL', commodityFilter = 'ALL') {
  let items = [...MOCK_DEMAND_ITEMS];
  let groups = [...MOCK_BENEFICIARY_GROUPS];

  if (regionFilter !== 'ALL') {
    items = items.filter((d) => d.region === regionFilter);
    groups = groups.filter((g) => g.region === regionFilter);
  }

  if (commodityFilter !== 'ALL') {
    items = items.filter((d) => d.commodity === commodityFilter);
  }

  // Affected population aggregated
  const totalAffectedPopulation = groups.reduce((acc, g) => acc + (g.population || 0), 0);
  const totalRegisteredGroups = groups.length;

  // Demand counts strictly categorized
  const verifiedItems = items.filter((d) => d.verificationStatus === 'VERIFIED');
  const pendingItems = items.filter((d) => d.verificationStatus === 'PENDING');
  const disputedItems = items.filter((d) => d.verificationStatus === 'DISPUTED');
  const rejectedItems = items.filter((d) => d.verificationStatus === 'REJECTED');

  // Critical unmet demand: strictly verified items with priority CRITICAL and remaining > 0
  const criticalUnmetCount = verifiedItems.filter(
    (d) => d.priority === 'CRITICAL' && d.remainingQuantity > 0
  ).length;

  // Verification Counts
  const totalVerifiedCount = verifiedItems.length;
  const totalPendingCount = pendingItems.length;
  const totalDisputedCount = disputedItems.length;
  const totalRejectedCount = rejectedItems.length;

  // Fulfilment Rate calculation (verified demand fulfilled vs total verified remaining)
  const totalVerifiedReq = verifiedItems.reduce((acc, d) => acc + d.quantity, 0);
  const totalVerifiedFulfilled = verifiedItems.reduce((acc, d) => acc + d.fulfilledQuantity, 0);
  const fulfilmentPct = totalVerifiedReq > 0 ? Math.round((totalVerifiedFulfilled / totalVerifiedReq) * 100) : 0;

  // Visualizations datasets:
  // 1. Commodity Demand Distribution (strictly separate units)
  const commodityDistribution = [
    {
      commodity: 'Food Supplies',
      category: 'FOOD',
      totalRequired: items
        .filter((i) => i.commodity === 'FOOD')
        .reduce((sum, i) => sum + i.quantity, 0),
      fulfilled: items
        .filter((i) => i.commodity === 'FOOD')
        .reduce((sum, i) => sum + i.fulfilledQuantity, 0),
      unit: 'packets',
      verifiedLots: items.filter((i) => i.commodity === 'FOOD' && i.verificationStatus === 'VERIFIED').length,
    },
    {
      commodity: 'Safe Water',
      category: 'WATER',
      totalRequired: items
        .filter((i) => i.commodity === 'WATER')
        .reduce((sum, i) => sum + i.quantity, 0),
      fulfilled: items
        .filter((i) => i.commodity === 'WATER')
        .reduce((sum, i) => sum + i.fulfilledQuantity, 0),
      unit: 'containers (10L)',
      verifiedLots: items.filter((i) => i.commodity === 'WATER' && i.verificationStatus === 'VERIFIED').length,
    },
    {
      commodity: 'Medical Supplies',
      category: 'MEDICAL',
      totalRequired: items
        .filter((i) => i.commodity === 'MEDICAL')
        .reduce((sum, i) => sum + i.quantity, 0),
      fulfilled: items
        .filter((i) => i.commodity === 'MEDICAL')
        .reduce((sum, i) => sum + i.fulfilledQuantity, 0),
      unit: 'kits',
      verifiedLots: items.filter((i) => i.commodity === 'MEDICAL' && i.verificationStatus === 'VERIFIED').length,
    },
  ];

  // 2. Beneficiary Group Population & Vulnerabilities Distribution
  const beneficiaryGroupDistribution = groups.map((g) => ({
    name: g.name,
    code: g.code,
    population: g.population,
    underFiveCount: Math.round(g.population * (g.vulnerabilities.underFivePercent / 100)),
    pregnantLactatingCount: Math.round(g.population * (g.vulnerabilities.pregnantLactatingPercent / 100)),
    category: g.category,
    region: g.region,
  }));

  // 3. Demand Priority Breakdown (All vs Verified)
  const priorityBreakdown = [
    {
      priority: 'CRITICAL',
      label: 'Critical (<24h)',
      count: items.filter((i) => i.priority === 'CRITICAL').length,
      verifiedCount: verifiedItems.filter((i) => i.priority === 'CRITICAL').length,
      fill: '#C94C4C',
    },
    {
      priority: 'HIGH',
      label: 'High (24-48h)',
      count: items.filter((i) => i.priority === 'HIGH').length,
      verifiedCount: verifiedItems.filter((i) => i.priority === 'HIGH').length,
      fill: '#D99A35',
    },
    {
      priority: 'MEDIUM',
      label: 'Medium (48-72h)',
      count: items.filter((i) => i.priority === 'MEDIUM').length,
      verifiedCount: verifiedItems.filter((i) => i.priority === 'MEDIUM').length,
      fill: '#176B76',
    },
    {
      priority: 'NORMAL',
      label: 'Normal (>72h)',
      count: items.filter((i) => i.priority === 'NORMAL').length,
      verifiedCount: verifiedItems.filter((i) => i.priority === 'NORMAL').length,
      fill: '#60758A',
    },
  ];

  // 4. Demand Over Time (Reported vs Verified vs Fulfilled Trend)
  const demandTrend = [
    { day: 'Day -5', reported: 8200, verified: 6100, fulfilled: 3200 },
    { day: 'Day -4', reported: 11400, verified: 8900, fulfilled: 4800 },
    { day: 'Day -3', reported: 14800, verified: 12100, fulfilled: 7100 },
    { day: 'Day -2', reported: 18200, verified: 15400, fulfilled: 9600 },
    { day: 'Yesterday', reported: 22600, verified: 18300, fulfilled: 12200 },
    { day: 'Today (Live)', reported: 26500, verified: 21200, fulfilled: 14350 },
  ];

  // 5. Regional Fulfilment Comparison (Verified Demand vs Fulfilled)
  const regionalComparison = [
    {
      region: 'Buzi District',
      verifiedDemand: 9250,
      fulfilled: 1050,
      unmet: 8200,
      fulfilmentRate: 11.3,
    },
    {
      region: 'Manga IDP Hub',
      verifiedDemand: 8200,
      fulfilled: 5000,
      unmet: 3200,
      fulfilmentRate: 61.0,
    },
    {
      region: 'Chibabava Basin',
      verifiedDemand: 1845,
      fulfilled: 15,
      unmet: 1830,
      fulfilmentRate: 0.8,
    },
    {
      region: 'Nhamatanda Corridor',
      verifiedDemand: 950,
      fulfilled: 950,
      unmet: 0,
      fulfilmentRate: 100.0,
    },
  ];

  return {
    items,
    groups,
    metrics: {
      totalAffectedPopulation,
      totalRegisteredGroups,
      totalVerifiedCount,
      totalVerifiedFulfilled,
      criticalUnmetCount,
      totalPendingCount,
      totalDisputedCount,
      totalRejectedCount,
      fulfilmentPct,
    },
    commodityDistribution,
    beneficiaryGroupDistribution,
    priorityBreakdown,
    demandTrend,
    regionalComparison,
  };
}
